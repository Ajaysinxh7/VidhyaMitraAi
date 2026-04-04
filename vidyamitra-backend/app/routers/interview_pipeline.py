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

    # --- Safety: cap questions at 7 ---
    per_question = per_question[:7]

    # Index questions by id for fast matching.
    q_by_id = {q.get("id"): q for q in questions}

    per_question_by_id: dict[str, dict] = {}
    for item in per_question:
        qid = item.get("question_id")
        if qid:
            per_question_by_id[str(qid)] = item

    # --- Helpers ---
    def _clamp_0_100(value: Any) -> int:
        try:
            n = float(value)
        except Exception:
            return 0
        n = max(0.0, min(100.0, n))
        return int(round(n))

    def _truncate(text: str, max_chars: int = 500) -> str:
        """Truncate text to limit LLM input/output size."""
        if not isinstance(text, str):
            return ""
        return text[:max_chars] + ("..." if len(text) > max_chars else "")

    def _as_str_list(value: Any, max_items: int = 5) -> list[str]:
        if not isinstance(value, list):
            return []
        return [_truncate(str(x), 200) for x in value[:max_items] if x is not None]

    # =========================================================================
    # STEP 1: Per-question analysis (3-axis scores + feedback)
    #   Each question evaluated independently for accuracy.
    # =========================================================================

    async def eval_single_answer(item: dict) -> dict:
        qid = item.get("question_id")
        qid_str = str(qid) if qid is not None else ""
        q = q_by_id.get(qid) or {}
        question_text = _truncate(q.get("text", ""), 300)

        # Truncate transcript to limit payload size
        transcript_raw = item.get("transcript_excerpt", "")
        transcript_truncated = _truncate(transcript_raw, 400)

        per_q_payload = {
            "question_text": question_text,
            "transcript_excerpt": transcript_truncated,
            "filler_word_count": item.get("filler_word_count", 0),
            "top_fillers": item.get("top_fillers", [])[:5],
            "eye_contact_ratio": item.get("eye_contact_ratio", 0.0),
        }

        resume_preview = {
            "skills": resume_data.get("skills", [])[:15],
            "projects": resume_data.get("projects", [])[:3] if isinstance(resume_data.get("projects"), list) else [],
            "experience": resume_data.get("experience", [])[:3] if isinstance(resume_data.get("experience"), list) else [],
        }

        prompt = f"""You are an expert interview evaluator for VidyaMitra.
Evaluate the candidate's answer on 3 axes (0-100 each):
- technical_score: depth of technical knowledge shown
- communication_score: clarity, structure, and articulation
- confidence_score: conviction and assertiveness in delivery

Also provide a concise feedback and an improved version of their answer.

Candidate answer:
{json.dumps(per_q_payload, ensure_ascii=False)}

Candidate resume context:
{json.dumps(resume_preview, ensure_ascii=False)}

Return strictly valid JSON (keep text fields concise, max 3-4 sentences each):
{{
  "question_id": "{qid_str}",
  "scores": {{
    "technical": 0,
    "communication": 0,
    "confidence": 0
  }},
  "feedback": "2-3 sentences of specific, actionable feedback.",
  "improvements": ["improvement 1", "improvement 2"],
  "better_response": "Concise improved answer (max 4 sentences).",
  "ideal_answer": "Strong model answer (max 5 sentences)."
}}"""

        try:
            resp = await openai_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise, JSON-outputting interview evaluator AI. Output ONLY raw JSON. No markdown, no formatting, no conversational text. Keep all text fields concise.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"}
            )
            parsed = _json_loads_strict(resp.choices[0].message.content or "{}")
            if not isinstance(parsed, dict):
                raise ValueError("Per-question evaluation is not a JSON object.")

            # Extract 3-axis scores
            scores_raw = parsed.get("scores", {})
            if not isinstance(scores_raw, dict):
                scores_raw = {}
            tech = _clamp_0_100(scores_raw.get("technical", parsed.get("score", 0)))
            comm = _clamp_0_100(scores_raw.get("communication", 0))
            conf = _clamp_0_100(scores_raw.get("confidence", parsed.get("confidence", 0)))

            # Deterministic combined score
            combined_score = int(round((tech + comm + conf) / 3))

            feedback = parsed.get("feedback", "")
            improvements = parsed.get("improvements", [])
            better_response = parsed.get("better_response", "")
            ideal_answer = parsed.get("ideal_answer", "")

            feedback_val = _truncate(feedback, 500) if isinstance(feedback, str) else "Evaluation failed for this answer."
            if isinstance(improvements, list):
                improvements_val = [_truncate(str(x), 200) for x in improvements[:3] if x is not None]
            else:
                improvements_val = []

            return {
                "question_id": qid_str,
                "score": combined_score,
                "confidence": conf,
                "scores": {
                    "technical": tech,
                    "communication": comm,
                    "confidence": conf,
                },
                "feedback": feedback_val,
                "improvements": improvements_val,
                "better_response": _truncate(better_response, 600) if isinstance(better_response, str) else "",
                "ideal_answer": _truncate(ideal_answer, 600) if isinstance(ideal_answer, str) else "",
            }
        except Exception:
            return {
                "question_id": qid_str,
                "score": 0,
                "confidence": 0,
                "scores": {"technical": 0, "communication": 0, "confidence": 0},
                "feedback": "Evaluation failed for this answer.",
                "improvements": [],
                "better_response": "",
                "ideal_answer": "",
            }

    # Evaluate answers concurrently.
    eval_tasks = [eval_single_answer(item) for item in per_question]
    individual_evaluations = list(await asyncio.gather(*eval_tasks))

    # =========================================================================
    # STEP 2: Final summary + skill gap analysis (separate LLM call)
    #   Uses aggregated per-question scores for accuracy.
    # =========================================================================

    # Compute deterministic overall scores from per-question results
    all_tech = [e.get("scores", {}).get("technical", 0) for e in individual_evaluations]
    all_comm = [e.get("scores", {}).get("communication", 0) for e in individual_evaluations]
    all_conf = [e.get("scores", {}).get("confidence", 0) for e in individual_evaluations]

    avg_tech = int(round(sum(all_tech) / max(len(all_tech), 1)))
    avg_comm = int(round(sum(all_comm) / max(len(all_comm), 1)))
    avg_conf = int(round(sum(all_conf) / max(len(all_conf), 1)))
    deterministic_final = int(round((avg_tech + avg_comm + avg_conf) / 3))

    # Prepare compact evaluation summary for the second LLM call
    compact_evals = []
    for e in individual_evaluations:
        qid = e.get("question_id", "")
        q = q_by_id.get(qid) or {}
        compact_evals.append({
            "question": _truncate(q.get("text", ""), 100),
            "scores": e.get("scores", {}),
            "feedback_snippet": _truncate(e.get("feedback", ""), 100),
        })

    # Extract skills for gap analysis (top 8)
    resume_skills = resume_data.get("skills", [])
    if isinstance(resume_skills, list):
        resume_skills = [str(s) for s in resume_skills if s][:8]
    else:
        resume_skills = []

    summary_prompt = f"""You are a career coach writing an interview summary.

Overall computed scores:
- Technical: {avg_tech}/100
- Communication: {avg_comm}/100
- Confidence: {avg_conf}/100
- Final: {deterministic_final}/100

Timeline stats: {json.dumps(timeline_summary, ensure_ascii=False)}

Per-question summaries:
{json.dumps(compact_evals, ensure_ascii=False)}

Candidate's resume skills: {json.dumps(resume_skills, ensure_ascii=False)}

Return strictly valid JSON with:
1. A short final verdict
2. Key strengths (max 4)
3. Key weaknesses (max 4)
4. Improvement suggestions (max 4)
5. Skill gap analysis: for each resume skill, estimate a proficiency score (0-100) based on interview performance, and a level label.

Schema:
{{
  "final_verdict": "2-3 sentence encouraging summary.",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improvements": ["suggestion 1", "suggestion 2"],
  "skill_gap_analysis": [
    {{"skill": "React", "score": 70, "level": "Proficient"}},
    {{"skill": "System Design", "score": 40, "level": "Needs Improvement"}}
  ]
}}"""

    try:
        summary_resp = await openai_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise, JSON-outputting career coach AI. Output ONLY raw JSON. No markdown, no formatting. Keep all text concise.",
                },
                {"role": "user", "content": summary_prompt},
            ],
            response_format={"type": "json_object"}
        )
        summary_data = _json_loads_strict(summary_resp.choices[0].message.content or "{}")
    except Exception as e:
        # Fallback: use computed values without AI summary
        summary_data = {
            "final_verdict": "Interview analysis complete. Review your per-question feedback for detailed insights.",
            "strengths": [],
            "weaknesses": [],
            "improvements": [],
            "skill_gap_analysis": [],
        }

    # Normalize skill gap (cap at 8, clamp scores)
    raw_skill_gaps = summary_data.get("skill_gap_analysis", [])
    if not isinstance(raw_skill_gaps, list):
        raw_skill_gaps = []
    skill_gap_analysis = []
    for sg in raw_skill_gaps[:8]:
        if not isinstance(sg, dict):
            continue
        skill_gap_analysis.append({
            "skill": _truncate(str(sg.get("skill", "")), 50),
            "score": _clamp_0_100(sg.get("score", 0)),
            "level": _truncate(str(sg.get("level", "Unknown")), 30),
        })

    # Normalize per-question feedback with answer window metadata + timestamp buffer
    per_q_feedback = []
    for item in individual_evaluations:
        qid = str(item.get("question_id") or "")
        meta = per_question_by_id.get(qid, {})

        # Apply -1 sec buffer to start timestamps for better seek alignment
        raw_start = float(meta.get("answer_start_offset_seconds", 0) or 0)
        buffered_start = max(0.0, raw_start - 1.0)

        per_q_feedback.append(
            {
                "question_id": qid,
                "score": item.get("score", 0),
                "confidence": item.get("confidence", 0),
                "scores": item.get("scores", {"technical": 0, "communication": 0, "confidence": 0}),
                "feedback": item.get("feedback", ""),
                "improvements": item.get("improvements", []),
                "better_response": item.get("better_response", ""),
                "ideal_answer": item.get("ideal_answer", ""),
                "answer_start_offset_seconds": buffered_start,
                "answer_end_offset_seconds": float(meta.get("answer_end_offset_seconds", 0) or 0),
                "transcript_excerpt": _truncate(meta.get("transcript_excerpt", ""), 500),
                "eye_contact_ratio": meta.get("eye_contact_ratio", 0),
                "filler_word_count": meta.get("filler_word_count", 0),
            }
        )

    interview_report = {
        "technical_score": avg_tech,
        "communication_score": avg_comm,
        "confidence_score": avg_conf,
        "filler_word_count": int(timeline_summary.get("filler_word", 0) or 0),
        "eye_contact_score": _clamp_0_100(timeline_summary.get("eye_contact", 0)),
        "final_score": deterministic_final,
        "final_verdict": _truncate(
            summary_data.get("final_verdict", "") if isinstance(summary_data.get("final_verdict"), str) else "", 500
        ),
        "key_strengths": _as_str_list(summary_data.get("strengths", []), 4),
        "areas_for_improvement": _as_str_list(summary_data.get("weaknesses", []), 4),
        "final_summary": {
            "overall_score": deterministic_final,
            "strengths": _as_str_list(summary_data.get("strengths", []), 4),
            "weaknesses": _as_str_list(summary_data.get("weaknesses", []), 4),
            "improvements": _as_str_list(summary_data.get("improvements", []), 4),
        },
        "skill_gap_analysis": skill_gap_analysis,
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

