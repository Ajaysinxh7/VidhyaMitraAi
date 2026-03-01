import os
import json
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

# --- Supabase (Optional Fallback) ---
try:
    from supabase import create_client, Client
    _supabase_url = os.getenv("SUPABASE_URL")
    _supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Optional[Client] = create_client(_supabase_url, _supabase_key) if _supabase_url and _supabase_key else None
except Exception:
    supabase = None

# In-memory store fallback { session_id: { ...data } }
_interview_sessions_store: Dict[str, dict] = {}
openai_client = AsyncOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1" # This tricks the OpenAI library into talking to Groq!
)

router = APIRouter()

# --- Pydantic Models ---
class StartInterviewRequest(BaseModel):
    user_id: str
    target_role: str

class AnswerItem(BaseModel):
    question_id: str
    answer_text: str

class SubmitAllAnswersRequest(BaseModel):
    session_id: str
    user_id: str
    answers: List[AnswerItem]

# --- Endpoints ---

@router.post("/start")
async def start_interview_session(request: StartInterviewRequest):
    """
    Starts a new interview session by generating 5 role-specific questions.
    Assigns a unique ID to each question for reliable tracking.
    """
    try:
        # 1. validate input and handle empty target_role with auto-fetch logic
        if not request.target_role or request.target_role.strip() == "":
            if supabase:
                try:
                    # Fetch the user's latest resume evaluation
                    db_query = supabase.table("resume_evaluations").select("analysis_result").eq("user_id", request.user_id).order("created_at", desc=True).limit(1).execute()
                    
                    if db_query.data:
                        analysis = db_query.data[0].get("analysis_result", {})
                        request.target_role = analysis.get("target_role_evaluated", analysis.get("suggested_roles", ["professional"])[0].strip())
                except Exception:
                    pass
            
            # Absolute fallback if we still don't have a role
            if not request.target_role or request.target_role.strip() == "":
                request.target_role = "Software Engineer" # Default fallback for offline mode



        # 2. Ask GPT-4 to generate the questions
        prompt = f"""
        You are conducting a professional job interview for a '{request.target_role}' position. 
        Generate exactly 5 interview questions. Include a mix of technical, behavioral, and situational questions.
        
        You MUST respond in strictly valid JSON format matching this schema:
        {{
            "questions": [
                "Question 1 text...",
                "Question 2 text...",
                "Question 3 text...",
                "Question 4 text...",
                "Question 5 text..."
            ]
        }}
        """

        completion = await openai_client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": "You are a precise, JSON-outputting hiring manager AI. You MUST output ONLY raw JSON. No markdown, no formatting, no conversational text."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # 3. Parse the AI Data
        try:
            ai_data = json.loads(completion.choices[0].message.content)
            raw_questions = ai_data.get("questions", [])
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="AI failed to return valid JSON.")

        # 4. Format questions with unique IDs
        formatted_questions = [
            {"id": str(uuid.uuid4()), "text": q_text} for q_text in raw_questions
        ]

        # 5. Always save to in-memory store
        session_id = str(uuid.uuid4())
        _interview_sessions_store[session_id] = {
            "id": session_id,
            "user_id": request.user_id,
            "target_role": request.target_role,
            "questions": formatted_questions,
            "status": "in_progress",
            "user_answers": []
        }

        # 6. Best-effort write to Supabase
        if supabase:
            try:
                db_response = supabase.table("interview_sessions").insert({
                    "id": session_id,
                    "user_id": request.user_id,
                    "target_role": request.target_role,
                    "questions": formatted_questions,
                    "status": "in_progress"
                }).execute()
                
                if db_response.data:
                    # Update local ref with DB generated ID to be safe
                    db_id = db_response.data[0]["id"]
                    _interview_sessions_store[db_id] = _interview_sessions_store.pop(session_id)
                    _interview_sessions_store[db_id]["id"] = db_id
                    session_id = db_id
            except Exception:
                pass # Fail silently to memory fallback

        return {
            "status": "success",
            "session_id": session_id,
            "questions": formatted_questions
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error starting interview: {str(e)}")


@router.post("/submit-answers")
async def submit_all_answers(submission: SubmitAllAnswersRequest):
    """
    Accepts all answers mapped to their question_ids at once.
    Saves them to the database session and marks it ready for evaluation.
    """
    try:
        # 1. Format the answers into a JSON serializable list
        answers_data = [
            {"question_id": ans.question_id, "answer_text": ans.answer_text}
            for ans in submission.answers
        ]

        # 2. Update the in-memory store
        is_in_memory = submission.session_id in _interview_sessions_store
        if is_in_memory:
            # We enforce user_id validation if it's in memory
            if _interview_sessions_store[submission.session_id]["user_id"] != submission.user_id:
                raise HTTPException(status_code=403, detail="Unauthorized session access.")
            
            _interview_sessions_store[submission.session_id]["user_answers"] = answers_data
            _interview_sessions_store[submission.session_id]["status"] = "pending_evaluation"
            
        # 3. Best-effort write to Supabase
        if supabase:
            try:
                # Validate the session exists and belongs to the user
                db_query = supabase.table("interview_sessions").select("id").eq("id", submission.session_id).eq("user_id", submission.user_id).execute()
                if not db_query.data and not is_in_memory:
                    raise HTTPException(status_code=404, detail="Interview session not found or unauthorized.")

                if db_query.data:
                    # Update the Supabase session record
                    db_response = supabase.table("interview_sessions").update({
                        "user_answers": answers_data,
                        "status": "pending_evaluation" # Setting state for the evaluate.py router to pick up
                    }).eq("id", submission.session_id).execute()
            except Exception as supabase_err:
                # If we couldn't reach Supabase, but we had it in memory, we can proceed.
                if not is_in_memory:
                    raise HTTPException(status_code=500, detail="Database unreachable and session not found in memory.")
        
        elif not is_in_memory:
            # Neither Supabase nor memory had it
            raise HTTPException(status_code=404, detail="Interview session not found.")

        return {
            "status": "success",
            "message": "All answers submitted successfully. Ready for evaluation.",
            "session_id": submission.session_id,
            "next_steps": {
                "action": "evaluate_session",
                "endpoint": "/api/evaluate/interview-summary"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error submitting answers: {str(e)}")


@router.get("/history/{user_id}")
async def get_interview_history(user_id: str):
    """Fetches a user's past interview sessions."""
    try:
        db_history = []
        if supabase:
            try:
                response = supabase.table("interview_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
                db_history = response.data if response.data else []
            except Exception:
                pass # Fail silently
                
        # Also grab any built up in-memory sessions that haven't synced
        memory_history = [
            session for session in _interview_sessions_store.values() 
            if session.get("user_id") == user_id
        ]
        
        # Merge, preferring DB ones if there's an ID collision (unlikely)
        db_ids = {s.get("id") for s in db_history}
        merged_history = db_history + [s for s in memory_history if s.get("id") not in db_ids]

        return {"status": "success", "history": merged_history}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")