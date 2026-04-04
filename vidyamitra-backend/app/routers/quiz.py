import os
import json
import uuid
from pathlib import Path
import tempfile
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

# ── Supabase (optional) ───────────────────────────────────────────────────────
# If Supabase is unreachable, quiz data is stored in a local file for the session.
try:
    from supabase import create_client, Client
    _supabase_url = os.getenv("SUPABASE_URL")
    _supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Optional[Client] = create_client(_supabase_url, _supabase_key) if _supabase_url and _supabase_key else None
except Exception:
    supabase = None

# File-backed quiz store — survives server restarts with --reload
_STORE_PATH = Path(tempfile.gettempdir()) / "_quiz_store.json"

def _load_store() -> Dict[str, dict]:
    """Load quiz store from disk."""
    try:
        if _STORE_PATH.exists():
            return json.loads(_STORE_PATH.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}

def _save_store(store: Dict[str, dict]) -> None:
    """Persist quiz store to disk, auto-purging completed quizzes."""
    try:
        # Only keep pending (active) quizzes — completed ones are no longer needed
        active = {k: v for k, v in store.items() if v.get("status") != "completed"}
        _STORE_PATH.write_text(json.dumps(active, ensure_ascii=False), encoding="utf-8")
    except Exception:
        pass

# ── OpenAI / Groq client ──────────────────────────────────────────────────────
openai_client = AsyncOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

router = APIRouter()

# --- Pydantic Models ---
class GenerateQuizRequest(BaseModel):
    user_id: str
    topic: str
    difficulty: str = "intermediate" # beginner, intermediate, advanced
    num_questions: int = 5
    resume_data: Optional[Dict] = None

class QuizAnswerItem(BaseModel):
    question_id: str
    selected_option: str

class SubmitQuizRequest(BaseModel):
    quiz_id: str
    user_id: str
    answers: List[QuizAnswerItem]

# --- Endpoints ---

@router.post("/generate")
async def generate_quiz(request: GenerateQuizRequest):
    """
    Generates a multiple-choice quiz on a specific topic using GPT-4.
    Saves the questions and correct answers to the database.
    """
    try:
        if request.resume_data:
            # Generate from resume
            prompt = f"""
            Create a multiple-choice quiz with exactly {request.num_questions} questions for {request.difficulty} level based ONLY on the provided resume data.
            
            Resume Data:
            {json.dumps(request.resume_data)}
            
            Rules:
            - Questions must be based ONLY on the technologies, projects, and experiences listed in the resume.
            - Focus on practical understanding of the listed skills and projects, avoiding generic theory where possible.
            - Include a mix of conceptual, project-based (e.g. "In a project using X, how would you..."), and scenario-based questions.
            
            You MUST respond in strictly valid JSON format matching this schema exactly:
            {{
                "skills_tested": ["skill1", "skill2"],
                "questions": [
                    {{
                        "question_text": "The question itself?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "The exact string of the correct option",
                        "explanation": "Why this is the correct answer"
                    }}
                ]
            }}
            """
        else:
            # Standard topic-based generation
            prompt = f"""
            Create a multiple-choice quiz with exactly {request.num_questions} questions about '{request.topic}' at an '{request.difficulty}' level.
            
            You MUST respond in strictly valid JSON format matching this schema exactly:
            {{
                "skills_tested": ["{request.topic}"],
                "questions": [
                    {{
                        "question_text": "The question itself?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "The exact string of the correct option",
                        "explanation": "Why this is the correct answer"
                    }}
                ]
            }}
            """

        completion = await openai_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a precise, JSON-outputting educational AI.You MUST output ONLY raw JSON. No markdown, no formatting, no conversational text."},
                {"role": "user", "content": prompt}
            ]
        )
        
        try:
            content = completion.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            ai_data = json.loads(content)
            raw_questions = ai_data.get("questions", [])
            skills_tested = ai_data.get("skills_tested", [])
        except Exception as e:
            print(f"Failed to decode JSON: {e}")
            print(f"Raw content: {completion.choices[0].message.content}")
            raise HTTPException(status_code=500, detail="AI failed to return valid JSON.")

        # Assign unique IDs to each question so the frontend can track them
        formatted_questions = []
        for q in raw_questions:
            q["id"] = str(uuid.uuid4())
            formatted_questions.append(q)

        # ── Save to file-backed store (survives server restarts) ──
        quiz_id = str(uuid.uuid4())
        is_resume = bool(request.resume_data)
        store = _load_store()
        store[quiz_id] = {
            "id": quiz_id,
            "user_id": request.user_id,
            "topic": request.topic if not is_resume else "Resume Based",
            "difficulty": request.difficulty,
            "questions": formatted_questions,  # includes correct_answer + explanation
            "status": "pending",
            "is_resume_based": is_resume,
            "skills_tested": skills_tested
        }
        _save_store(store)

        # ── Best-effort Supabase write (skip if unavailable) ──
        if supabase:
            try:
                db_response = supabase.table("quizzes").insert({
                    "id": quiz_id,
                    "user_id": request.user_id,
                    "topic": request.topic if not is_resume else "Resume Based",
                    "difficulty": request.difficulty,
                    "questions": formatted_questions,
                    "status": "pending",
                    "is_resume_based": is_resume,
                    "skills_tested": skills_tested
                }).execute()
                # Use the DB-generated id if available
                if db_response.data:
                    db_id = db_response.data[0]["id"]
                    if db_id != quiz_id:
                        store = _load_store()
                        store[db_id] = store.pop(quiz_id)
                        store[db_id]["id"] = db_id
                        quiz_id = db_id
                        _save_store(store)
            except Exception:
                pass  # Fall back silently to file store

        # Strip correct_answer + explanation before returning to the frontend
        safe_questions = [
            {
                "id": q["id"],
                "question_text": q["question_text"],
                "options": q["options"]
            }
            for q in formatted_questions
        ]

        return {
            "status": "success",
            "quiz_id": quiz_id,
            "topic": request.topic,
            "questions": safe_questions
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")


@router.post("/submit")
async def submit_quiz(submission: SubmitQuizRequest):
    """
    Grades the submitted quiz by comparing user answers to the stored correct answers.
    Returns the score and explanations.
    """
    try:
        # 1. Look up quiz — file store first, then Supabase
        store = _load_store()
        quiz_data = store.get(submission.quiz_id)

        if quiz_data is None and supabase:
            try:
                db_query = supabase.table("quizzes").select("*") \
                    .eq("id", submission.quiz_id) \
                    .eq("user_id", submission.user_id).execute()
                if db_query.data:
                    quiz_data = db_query.data[0]
            except Exception:
                pass  # Supabase unreachable — keep quiz_data as None

        if quiz_data is None:
            raise HTTPException(status_code=404, detail="Quiz session not found. Please generate a new quiz.")

        if quiz_data.get("status") == "completed":
            raise HTTPException(status_code=400, detail="This quiz has already been submitted.")

        # Validate ownership
        if quiz_data.get("user_id") and quiz_data["user_id"] != submission.user_id:
            raise HTTPException(status_code=403, detail="Quiz does not belong to this user.")

        original_questions = quiz_data.get("questions", [])

        # 2. Grade programmatically
        score = 0
        total_questions = len(original_questions)
        detailed_results = []
        user_answers_dict = {ans.question_id: ans.selected_option for ans in submission.answers}

        for q in original_questions:
            q_id = q["id"]
            correct_ans = q["correct_answer"]
            user_ans = user_answers_dict.get(q_id, "No answer provided")
            is_correct = (user_ans == correct_ans)
            if is_correct:
                score += 1
            detailed_results.append({
                "question_id": q_id,
                "question_text": q["question_text"],
                "user_answer": user_ans,
                "correct_answer": correct_ans,
                "is_correct": is_correct,
                "explanation": q.get("explanation", "")
            })

        final_score_percentage = (score / total_questions) * 100 if total_questions > 0 else 0

        # 3. Mark file store as completed
        if submission.quiz_id in store:
            store[submission.quiz_id]["status"] = "completed"
            _save_store(store)

        # 4. Best-effort Supabase update
        if supabase:
            try:
                supabase.table("quizzes").update({
                    "score_percentage": final_score_percentage,
                    "user_answers": [ans.model_dump() for ans in submission.answers],
                    "detailed_results": detailed_results,
                    "status": "completed"
                }).eq("id", submission.quiz_id).execute()
            except Exception:
                pass  # Non-fatal — results are returned regardless

        return {
            "status": "success",
            "message": "Quiz graded successfully.",
            "score": f"{score}/{total_questions}",
            "score_percentage": final_score_percentage,
            "detailed_results": detailed_results,
            "is_resume_based": quiz_data.get("is_resume_based", False),
            "skills_tested": quiz_data.get("skills_tested", [])
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error grading quiz: {str(e)}")


@router.get("/history/{user_id}")
async def get_quiz_history(user_id: str):
    """Fetches a user's past quizzes and scores."""
    try:
        response = supabase.table("quizzes").select("id, topic, difficulty, score_percentage, created_at, is_resume_based, skills_tested").eq("user_id", user_id).order("created_at", desc=True).execute()
        return {"status": "success", "history": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching quiz history: {str(e)}")