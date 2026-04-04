import asyncio
import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import AsyncOpenAI

from ..services.audio_analysis import (
    analyze_audio,
)
from ..services.cv_analysis import process_video_eye_contact
from ..services.timeline_sync import sync_timeline
from ..utils.storage import get_writable_temp_path

load_dotenv()

router = APIRouter()

# -----------------------------------------------------------------------------
# Persistence (file-backed, Supabase best-effort)
# -----------------------------------------------------------------------------

import tempfile
_DEFAULT_STORE_PATH = Path(tempfile.gettempdir()) / "_interview_pipeline_store.json"
_STORE_PATH = Path(os.getenv("INTERVIEW_PIPELINE_STORE_PATH", str(_DEFAULT_STORE_PATH)))

_MEDIA_DIR = get_writable_temp_path("INTERVIEW_MEDIA_PATH", "vidyamitra_interview_media")
_MEDIA_DIR.mkdir(parents=True, exist_ok=True)


def _load_store() -> Dict[str, dict]:
    try:
        if _STORE_PATH.exists():
            return json.loads(_STORE_PATH.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def _save_store(store: Dict[str, dict]) -> None:
    try:
        _STORE_PATH.write_text(json.dumps(store, ensure_ascii=False), encoding="utf-8")
    except Exception:
        # Best-effort only — pipeline can still work without persistence.
        pass


def _as_safe_words_text(tokens: List[str]) -> str:
    """
    Join word tokens into a readable transcript.

    Whisper word tokens can include punctuation; this keeps spacing natural.
    """
    text = " ".join(t for t in tokens if t)
    # Remove spaces before punctuation.
    text = re.sub(r"\s+([,.!?;:])", r"\1", text)
    # Collapse multiple spaces.
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


def _compute_eye_contact_ratio(edges: List[Dict[str, Any]], start_s: float, end_s: float) -> float:
    """
    edges: [{timestamp, eye_contact}] transitions (state changes only).
    Compute ratio of time within [start_s, end_s] where eye_contact is True.
    """
    if end_s <= start_s:
        return 0.0
    if not edges:
        return 0.0

    edges_sorted = sorted(edges, key=lambda e: e.get("timestamp", 0.0))
    # Determine initial state at start_s.
    last_state = edges_sorted[0].get("eye_contact", False)
    for e in edges_sorted:
        ts = float(e.get("timestamp", 0.0))
        if ts <= start_s:
            last_state = bool(e.get("eye_contact", False))
        else:
            break

    total = end_s - start_s
    eye_time = 0.0

    current_state = last_state
    current_ts = start_s

    for e in edges_sorted:
        ts = float(e.get("timestamp", 0.0))
        if ts <= start_s:
            continue
        if ts >= end_s:
            break
        if current_state:
            eye_time += ts - current_ts
        current_ts = ts
        current_state = bool(e.get("eye_contact", False))

    # Tail interval.
    if current_state and current_ts < end_s:
        eye_time += end_s - current_ts

    ratio = eye_time / total if total > 0 else 0.0
    return max(0.0, min(1.0, ratio))


def _json_loads_strict(content: str) -> Any:
    """
    Parse model output as JSON defensively: strip markdown fences and fall back to
    a direct json.loads.
    """
    raw = (content or "").strip()
    if raw.startswith("```json"):
        raw = raw[len("```json") :].strip()
    elif raw.startswith("```"):
        raw = raw[len("```") :].strip()
    if raw.endswith("```"):
        raw = raw[: -len("```")].strip()
    return json.loads(raw)


# -----------------------------------------------------------------------------
# LLM client
# -----------------------------------------------------------------------------

_groq_key = os.getenv("GROQ_API_KEY")
openai_client = AsyncOpenAI(
    api_key=_groq_key,
    base_url="https://api.groq.com/openai/v1",  # OpenAI-compatible shim for Groq
    timeout=60.0,
)


# -----------------------------------------------------------------------------
# Optional Supabase (best-effort only)
# -----------------------------------------------------------------------------

try:
    from supabase import create_client, Client

    _supabase_url = os.getenv("SUPABASE_URL")
    _supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Optional[Client] = (
        create_client(_supabase_url, _supabase_key) if _supabase_url and _supabase_key else None
    )
except Exception:
    supabase = None


# -----------------------------------------------------------------------------
# Schemas
# -----------------------------------------------------------------------------


class GenerateQuestionsRequest(BaseModel):
    user_id: str
    resume_data: Dict[str, Any] = Field(..., description="Structured resume data (skills/projects/experience).")
    num_questions: int = Field(default=6, ge=5, le=7)
    difficulty: str = Field(default="intermediate")


class InterviewQuestion(BaseModel):
    id: str
    text: str
    category: str  # project-based | technical | behavioral


class GenerateQuestionsResponse(BaseModel):
    status: str
    session_id: str
    questions: List[InterviewQuestion]


class AnswerWindow(BaseModel):
    question_id: str
    start_offset_seconds: float
    end_offset_seconds: float


class RecordInterviewResponse(BaseModel):
    status: str
    session_id: str
    media_refs: Dict[str, str]


class AnalyzeInterviewResponse(BaseModel):
    status: str
    session_id: str
    analysis: Dict[str, Any]


class InterviewReportResponse(BaseModel):
    status: str
    session_id: str
    interview_report: Dict[str, Any]


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------


@router.post("/questions", response_model=GenerateQuestionsResponse)
async def generate_questions(request: GenerateQuestionsRequest):
    if not _groq_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured on this server.")

    if not isinstance(request.resume_data, dict):
        raise HTTPException(status_code=400, detail="resume_data must be an object.")

    session_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"

    resume_json = json.dumps(request.resume_data, ensure_ascii=False)
    prompt = f"""
You are VidyaMitra's interview designer.
Generate {request.num_questions} interview questions for a candidate using ONLY the provided resume data.

Resume Data:
{resume_json}

Rules:
- Questions must be resume-aware: each question should reference something from skills/projects/experience.
- Include a mix of:
  * project-based
  * technical
  * behavioral
- Questions must be practical and interview-realistic.
- Output MUST be strictly valid JSON (no markdown, no extra keys, no commentary).

Output schema:
{{
  "questions": [
    {{
      "text": "Question text...",
      "category": "project-based" | "technical" | "behavioral"
    }}
  ]
}}
"""

    completion = await openai_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a precise, JSON-outputting interview designer AI. Output ONLY raw JSON. No markdown, no formatting, no conversational text.",
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"}
    )

    try:
        ai_data = _json_loads_strict(completion.choices[0].message.content or "{}")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"AI failed to return valid JSON: {str(e)}")

    raw_questions = ai_data.get("questions", [])
    if not isinstance(raw_questions, list) or len(raw_questions) == 0:
        raise HTTPException(status_code=422, detail="AI returned no questions (invalid schema).")

    # Ensure count is within [5,7]. If the model deviates, clamp by taking first N.
    num = max(5, min(7, request.num_questions))
    raw_questions = raw_questions[:num]

    formatted = []
    for q in raw_questions:
        text = str(q.get("text", "")).strip()
        category = str(q.get("category", "")).strip() or "technical"
        if not text:
            continue
        formatted.append(
            InterviewQuestion(
                id=str(uuid.uuid4()),
                text=text,
                category=category,
            )
        )

    if len(formatted) < 5:
        raise HTTPException(status_code=422, detail="AI returned too few valid questions (invalid schema).")

    store = _load_store()
    store[session_id] = {
        "id": session_id,
        "user_id": request.user_id,
        "resume_data": request.resume_data,
        "questions": [q.model_dump() for q in formatted],
        "status": "questions_generated",
        "created_at": created_at,
    }
    _save_store(store)

    # Best-effort Supabase write (schema may differ; never block demo).
    if supabase:
        try:
            supabase.table("interview_sessions").upsert(
                {
                    "id": session_id,
                    "user_id": request.user_id,
                    "target_role": "Interview",
                    "questions": [q.model_dump() for q in formatted],
                    "status": "questions_generated",
                    "created_at": created_at,
                },
                on_conflict="id",
            ).execute()
        except Exception:
            pass

    return {
        "status": "success",
        "session_id": session_id,
        "questions": [q.model_dump() for q in formatted],
    }


@router.post("/record", response_model=RecordInterviewResponse)
async def record_interview(
    session_id: str = Form(...),
    user_id: str = Form(...),
    video_start_time: str = Form(...),
    answer_windows: str = Form(..., description="JSON string of AnswerWindow[]."),
    video: UploadFile = File(...),
    audio: UploadFile = File(...),
):
    store = _load_store()
    session = store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    if str(session.get("user_id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Unauthorized session access.")

    try:
        windows_raw = json.loads(answer_windows)
        windows = [AnswerWindow.model_validate(w) for w in windows_raw]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid answer_windows: {str(e)}")

    if not windows:
        raise HTTPException(status_code=400, detail="answer_windows cannot be empty.")

    # Persist uploads to a writable directory.
    session_media_dir = _MEDIA_DIR / session_id
    session_media_dir.mkdir(parents=True, exist_ok=True)

    video_ext = "." + video.filename.rsplit(".", 1)[-1].lower() if video.filename and "." in video.filename else ".webm"
    audio_ext = "." + audio.filename.rsplit(".", 1)[-1].lower() if audio.filename and "." in audio.filename else ".webm"

    video_path = session_media_dir / f"video{video_ext}"
    audio_path = session_media_dir / f"audio{audio_ext}"

    try:
        video_bytes = await video.read()
        audio_bytes = await audio.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read upload: {str(e)}")

    if len(video_bytes) == 0 or len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded media cannot be empty.")

    video_path.write_bytes(video_bytes)
    audio_path.write_bytes(audio_bytes)

    session["video_start_time"] = video_start_time
    session["answer_windows"] = [w.model_dump() for w in windows]
    session["media"] = {
        "video_path": str(video_path),
        "audio_path": str(audio_path),
        "video_filename": video_path.name,
        "audio_filename": audio_path.name,
    }
    session["status"] = "recorded"
    _save_store(store)

    # Best-effort Supabase update.
    video_url = f"/interview-media/{session_id}/{video_path.name}"
    audio_url = f"/interview-media/{session_id}/{audio_path.name}"
    if supabase:
        try:
            supabase.table("interview_sessions").update(
                {
                    "video_start_time": video_start_time,
                    "answer_windows": [w.model_dump() for w in windows],
                    "video_url": video_url,
                    "audio_url": audio_url,
                    "status": "recorded",
                }
            ).eq("id", session_id).eq("user_id", user_id).execute()
        except Exception:
            pass

    return {
        "status": "success",
        "session_id": session_id,
        "media_refs": {
            "video_url": video_url,
            "audio_url": audio_url,
        },
    }


@router.post("/analyze", response_model=AnalyzeInterviewResponse)
async def analyze_interview(session_id: str = Form(...), user_id: Optional[str] = Form(None)):
    # NOTE: Using Form here keeps it easy for axios multipart patterns; also works for simple form posts.
    store = _load_store()
    session = store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    if user_id is not None and str(session.get("user_id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Unauthorized session access.")

    if session.get("status") not in ("recorded", "analyzed", "completed"):
        raise HTTPException(status_code=400, detail="Interview session is not ready for analysis.")

    media = session.get("media") or {}
    audio_path = media.get("audio_path")
    video_path = media.get("video_path")
    answer_windows = session.get("answer_windows") or []
    questions = session.get("questions") or []
    resume_data = session.get("resume_data") or {}
    video_start_time = session.get("video_start_time") or ""

    if not audio_path or not video_path:
        raise HTTPException(status_code=400, detail="Media paths are missing.")
    if not answer_windows:
        raise HTTPException(status_code=400, detail="answer_windows are missing.")
    if not questions:
        raise HTTPException(status_code=400, detail="questions are missing.")

    audio_bytes = Path(audio_path).read_bytes()
    video_bytes = Path(video_path).read_bytes()

    # 1) Transcribe + filler detection (with word timestamps).
    try:
        audio_result = await analyze_audio(audio_bytes, filename="audio.webm", target_fillers=None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio transcription failed: {str(e)}")

    transcript = str(audio_result.transcript or "")
    duration = float(audio_result.duration_seconds or 0.0)
    words = audio_result.words or []
    filler_occurrences = audio_result.filler_words or []
    def _find_question_id_for_ts(ts: float) -> Optional[str]:
        for w in answer_windows:
            start_o = float(w.get("start_offset_seconds", 0.0) or 0.0)
            end_o = float(w.get("end_offset_seconds", 0.0) or 0.0)
            if start_o <= ts <= end_o:
                qid = w.get("question_id")
                return str(qid) if qid else None
        return None

    filler_words = [
        {
            "word": f.word,
            "timestamp": round(float(f.timestamp), 2),
            "question_id": _find_question_id_for_ts(float(f.timestamp)),
        }
        for f in filler_occurrences
    ]

    # 2) Eye contact events (transitions) from video.
    eye_edges = await process_video_eye_contact(video_bytes, filename="video.webm", target_fps=3)
    # eye_edges: [{timestamp, eye_contact}]

    # 3) Timeline (unified + question boundaries).
    question_boundary_events: List[dict] = []
    for w in answer_windows:
        qid = w.get("question_id")
        start_o = float(w.get("start_offset_seconds", 0.0) or 0.0)
        end_o = float(w.get("end_offset_seconds", 0.0) or 0.0)
        question_boundary_events.append(
            {
                "timestamp": start_o,
                "event": "question_start",
                "label": "Answer started",
                "question_id": qid,
            }
        )
        question_boundary_events.append(
            {
                "timestamp": end_o,
                "event": "question_end",
                "label": "Answer stopped",
                "question_id": qid,
            }
        )

    timeline_sources = [
        {
            "name": "audio_filler",
            "offset_seconds": 0.0,
            "events": filler_words,
        },
        {
            "name": "cv_analysis",
            "offset_seconds": 0.0,
            "events": [
                {
                    "type": "eye_contact",
                    "timestamp": float(e.get("timestamp", 0.0) or 0.0),
                    "label": "Eye contact maintained" if bool(e.get("eye_contact")) else "Lost eye contact",
                    "confidence": 1.0,
                    "question_id": _find_question_id_for_ts(float(e.get("timestamp", 0.0) or 0.0)),
                }
                for e in eye_edges
            ],
        },
        {
            "name": "questions",
            "offset_seconds": 0.0,
            "events": question_boundary_events,
        },
    ]

    timeline = sync_timeline(
        video_start_time=video_start_time,
        duration_seconds=duration,
        sources=timeline_sources,
    )

    # 4) Per-question segmentation (transcript excerpt + metrics).
    per_question: List[dict] = []
    for w in answer_windows:
        qid = w.get("question_id")
        start_o = float(w.get("start_offset_seconds", 0.0) or 0.0)
        end_o = float(w.get("end_offset_seconds", 0.0) or 0.0)

        words_in_window = []
        for wd in words:
            ts = float(wd.get("start", 0.0) or 0.0)
            if start_o <= ts <= end_o:
                words_in_window.append(str(wd.get("word", "") or ""))

        transcript_excerpt = _as_safe_words_text(words_in_window)

        filler_in_window = [
            f for f in filler_occurrences if start_o <= float(f.timestamp) <= end_o
        ]
        filler_word_count = len(filler_in_window)
        top_fillers = {}
        for f in filler_in_window:
            top_fillers[f.word] = top_fillers.get(f.word, 0) + 1
        top_fillers_sorted = sorted(top_fillers.items(), key=lambda x: x[1], reverse=True)
        top_fillers_list = [w for w, _ in top_fillers_sorted[:3]]

        eye_ratio = _compute_eye_contact_ratio(eye_edges, start_o, end_o)

        per_question.append(
            {
                "question_id": qid,
                "answer_start_offset_seconds": start_o,
                "answer_end_offset_seconds": end_o,
                "transcript_excerpt": transcript_excerpt,
                "filler_word_count": filler_word_count,
                "top_fillers": top_fillers_list,
                "eye_contact_ratio": round(eye_ratio, 3),
                # These are lightweight heuristics; final scoring is AI in /report.
                "words_in_window_count": len(words_in_window),
            }
        )

    analysis = {
        "transcript": transcript,
        "duration_seconds": duration,
        "filler_words": filler_words,
        "eye_contact_edges": eye_edges,
        "timeline": timeline.get("timeline", []),
        "timeline_summary": timeline.get("summary", {}),
        # Full timeline sync payload (useful for UI rendering).
        "timeline_sync": timeline,
        "per_question": per_question,
        "video_start_time": video_start_time,
        "resume_data_preview": {
            "skills": resume_data.get("skills", []),
            "projects": resume_data.get("projects", [])[:5] if isinstance(resume_data.get("projects"), list) else [],
            "experience": resume_data.get("experience", [])[:5] if isinstance(resume_data.get("experience"), list) else [],
        },
    }

    session["analysis"] = analysis
    session["status"] = "analyzed"
    _save_store(store)

    if supabase:
        try:
            supabase.table("interview_sessions").update(
                {
                    "analysis_data": analysis,
                    "status": "analyzed",
                }
            ).eq("id", session_id).eq("user_id", session.get("user_id")).execute()
        except Exception:
            pass

    return {
        "status": "success",
        "session_id": session_id,
        "analysis": analysis,
    }


@router.post("/report", response_model=InterviewReportResponse)
async def generate_report(
    session_id: str = Form(...),
    user_id: str = Form(...),
):
    store = _load_store()
    session = store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    if str(session.get("user_id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Unauthorized session access.")

    if session.get("status") not in ("analyzed", "completed"):
        raise HTTPException(status_code=400, detail="Interview session must be analyzed before reporting.")

    if not _groq_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured on this server.")

    analysis = session.get("analysis") or {}
    if not analysis:
        raise HTTPException(status_code=400, detail="analysis is missing.")

    questions = session.get("questions") or []
    per_question = analysis.get("per_question") or []
    resume_data = session.get("resume_data") or {}
    timeline_summary = analysis.get("timeline_summary") or {}

    # Index questions by id for fast matching.
    q_by_id = {q.get("id"): q for q in questions}

    per_question_by_id: dict[str, dict] = {}
    for item in per_question:
        qid = item.get("question_id")
        if qid:
            per_question_by_id[str(qid)] = item

    async def eval_single_answer(item: dict) -> dict:
        qid = item.get("question_id")
        qid_str = str(qid) if qid is not None else ""
        q = q_by_id.get(qid) or {}
        question_text = q.get("text", "")

        per_q_payload = {
            "question_text": question_text,
            "transcript_excerpt": item.get("transcript_excerpt", ""),
            "filler_word_count": item.get("filler_word_count", 0),
            "top_fillers": item.get("top_fillers", []),
            "eye_contact_ratio": item.get("eye_contact_ratio", 0.0),
            "answer_time_range_seconds": [item.get("answer_start_offset_seconds"), item.get("answer_end_offset_seconds")],
        }

        resume_preview = {
            "skills": resume_data.get("skills", []),
            "projects": resume_data.get("projects", [])[:5] if isinstance(resume_data.get("projects"), list) else [],
            "experience": resume_data.get("experience", [])[:5] if isinstance(resume_data.get("experience"), list) else [],
        }

        prompt = f"""
You are an expert interview evaluator for VidyaMitra.
Evaluate the candidate's answer using:
- relevance to the candidate's resume and this specific question
- communication clarity
- technical depth (when applicable)
- confidence / conviction inferred from answer content

Candidate answer payload:
{json.dumps(per_q_payload, ensure_ascii=False)}

Candidate resume (for relevance grounding):
{json.dumps(resume_preview, ensure_ascii=False)}

Return strictly valid JSON:
{{
  "question_id": "{qid_str}",
  "score": 0,
  "confidence": 0,
  "feedback": "2-4 sentences of specific, actionable feedback",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "better_response": "A better way the user should answer (concise but high-quality).",
  "ideal_answer": "A strong model answer (can be longer)."
}}
"""

        try:
            resp = await openai_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise, JSON-outputting interview evaluator AI. Output ONLY raw JSON. No markdown, no formatting, no conversational text.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"}
            )
            parsed = _json_loads_strict(resp.choices[0].message.content or "{}")
            # Defensive normalization (never allow malformed output to break the UI).
            if not isinstance(parsed, dict):
                raise ValueError("Per-question evaluation is not a JSON object.")

            def _clamp_0_100(value: Any) -> int:
                try:
                    n = float(value)
                except Exception:
                    return 0
                n = max(0.0, min(100.0, n))
                return int(round(n))

            score = _clamp_0_100(parsed.get("score", 0))
            confidence = _clamp_0_100(parsed.get("confidence", 0))

            feedback = parsed.get("feedback", "")
            improvements = parsed.get("improvements", [])
            better_response = parsed.get("better_response", "")
            ideal_answer = parsed.get("ideal_answer", "")

            feedback_val = feedback if isinstance(feedback, str) else "Evaluation failed for this answer."
            if isinstance(improvements, list):
                improvements_val = [str(x) for x in improvements if x is not None]
            else:
                improvements_val = []

            return {
                "question_id": qid_str,
                "score": score,
                "confidence": confidence,
                "feedback": feedback_val,
                "improvements": improvements_val,
                "better_response": better_response if isinstance(better_response, str) else "",
                "ideal_answer": ideal_answer if isinstance(ideal_answer, str) else "",
            }
        except Exception:
            return {
                "question_id": qid_str,
                "score": 0,
                "confidence": 0,
                "feedback": "Evaluation failed for this answer.",
                "improvements": [],
                "better_response": "",
                "ideal_answer": "",
            }

    # Evaluate answers concurrently (demo-friendly synchronous pipeline).
    eval_tasks = [eval_single_answer(item) for item in per_question]
    individual_evaluations = await asyncio.gather(*eval_tasks)

    overall_prompt = f"""
You are a career coach summarizing an interview.
Use the following individual evaluations and timeline summary to compute overall scores.

Timeline summary:
{json.dumps(timeline_summary, ensure_ascii=False)}

Individual evaluations:
{json.dumps(individual_evaluations, ensure_ascii=False)}

Return strictly valid JSON:
{{
  "technical_score": 0,
  "communication_score": 0,
  "filler_word_count": 0,
  "eye_contact_score": 0,
  "final_score": 0,
  "final_verdict": "A short, encouraging summary of overall performance.",
  "key_strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areas_for_improvement": ["Area 1", "Area 2", "Area 3"],
  "per_question_feedback": {json.dumps(individual_evaluations, ensure_ascii=False)}
}}
"""

    try:
        overall_resp = await openai_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise, JSON-outputting career coach AI. Output ONLY raw JSON. No markdown, no formatting, no conversational text.",
                },
                {"role": "user", "content": overall_prompt},
            ],
            response_format={"type": "json_object"}
        )
        overall = _json_loads_strict(overall_resp.choices[0].message.content or "{}")
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"AI failed to return valid overall report JSON: {str(e)}",
        )

    # Normalize per-question feedback to include required fields + answer window metadata.
    per_q_feedback = []
    for item in individual_evaluations:
        qid = str(item.get("question_id") or "")
        meta = per_question_by_id.get(qid, {})
        per_q_feedback.append(
            {
                "question_id": qid,
                "score": item.get("score", 0),
                "confidence": item.get("confidence", 0),
                "feedback": item.get("feedback", ""),
                "improvements": item.get("improvements", []),
                "better_response": item.get("better_response", ""),
                "ideal_answer": item.get("ideal_answer", ""),
                "answer_start_offset_seconds": meta.get("answer_start_offset_seconds", 0),
                "answer_end_offset_seconds": meta.get("answer_end_offset_seconds", 0),
                "transcript_excerpt": meta.get("transcript_excerpt", ""),
                "eye_contact_ratio": meta.get("eye_contact_ratio", 0),
                "filler_word_count": meta.get("filler_word_count", 0),
            }
        )

    def _clamp_0_100(value: Any) -> int:
        try:
            n = float(value)
        except Exception:
            return 0
        n = max(0.0, min(100.0, n))
        return int(round(n))

    def _as_str_list(value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(x) for x in value if x is not None]

    interview_report = {
        "technical_score": _clamp_0_100(overall.get("technical_score", 0)),
        "communication_score": _clamp_0_100(overall.get("communication_score", 0)),
        "filler_word_count": int(overall.get("filler_word_count", 0) or 0),
        "eye_contact_score": _clamp_0_100(overall.get("eye_contact_score", 0)),
        "final_score": _clamp_0_100(overall.get("final_score", 0)),
        "final_verdict": overall.get("final_verdict", "") if isinstance(overall.get("final_verdict", ""), str) else "",
        "key_strengths": _as_str_list(overall.get("key_strengths", [])),
        "areas_for_improvement": _as_str_list(overall.get("areas_for_improvement", [])),
        "per_question_feedback": per_q_feedback,
        "timeline": analysis.get("timeline", []),
    }

    session["report"] = interview_report
    session["status"] = "completed"
    _save_store(store)

    if supabase:
        try:
            supabase.table("interview_sessions").update(
                {
                    "evaluation_data": interview_report,
                    "status": "completed",
                }
            ).eq("id", session_id).eq("user_id", user_id).execute()
        except Exception:
            pass

    return {
        "status": "success",
        "session_id": session_id,
        "interview_report": interview_report,
    }

