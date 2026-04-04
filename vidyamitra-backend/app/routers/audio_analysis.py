"""
Audio Analysis Router
=====================
POST /audio/analyze   — Upload audio, get transcript + filler-word analysis.
"""

from typing import Optional, List

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from ..services.audio_analysis import analyze_audio, DEFAULT_FILLERS

router = APIRouter()


# ---------------------------------------------------------------------------
# Response schemas (for OpenAPI docs)
# ---------------------------------------------------------------------------
class FillerWordItem(BaseModel):
    word: str
    timestamp: float


class AudioAnalysisResponse(BaseModel):
    transcript: str
    filler_words: List[FillerWordItem]
    total_count: int
    duration_seconds: float


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@router.post(
    "/analyze",
    response_model=AudioAnalysisResponse,
    summary="Analyze interview audio for filler words",
    description=(
        "Accepts an audio file (webm, wav, mp3, m4a, ogg), transcribes it "
        "using Whisper via Groq, and returns a filler-word report with "
        "per-occurrence timestamps."
    ),
)
async def analyze_interview_audio(
    audio: UploadFile = File(
        ...,
        description="Audio file to analyze (webm, wav, mp3, m4a, ogg).",
    ),
    fillers: Optional[str] = Form(
        default=None,
        description=(
            "Comma-separated list of filler words to detect. "
            "Defaults to: um, uh, like, you know"
        ),
    ),
):
    """
    Full pipeline:  audio → Whisper STT → filler-word detection.

    **Accepted formats:** webm, wav, mp3, m4a, ogg, flac, mp4  
    **Max size:** ~25 MB (Groq Whisper limit)

    **Form fields:**
    - `audio`   — the audio file (required)
    - `fillers` — comma-separated custom filler list (optional)

    **Returns:**
    ```json
    {
      "transcript": "...",
      "filler_words": [
        { "word": "um", "timestamp": 3.24 },
        { "word": "like", "timestamp": 7.81 }
      ],
      "total_count": 2,
      "duration_seconds": 45.6
    }
    ```
    """
    # ---- Validate file type ----
    allowed_extensions = {".webm", ".wav", ".mp3", ".m4a", ".ogg", ".flac", ".mp4"}
    filename = audio.filename or "audio.webm"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported audio format '{ext}'. "
                f"Accepted: {', '.join(sorted(allowed_extensions))}"
            ),
        )

    # ---- Read the upload ----
    try:
        audio_bytes = await audio.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read audio file: {e}")

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

    # ~25 MB Groq limit
    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Audio file exceeds 25 MB limit.",
        )

    # ---- Parse custom filler list ----
    target_fillers: set[str] | None = None
    if fillers:
        target_fillers = {f.strip().lower() for f in fillers.split(",") if f.strip()}
        if not target_fillers:
            target_fillers = None  # fall back to defaults

    # ---- Run the pipeline ----
    try:
        result = await analyze_audio(audio_bytes, filename, target_fillers)
        return result.to_dict()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Audio analysis failed: {str(e)}",
        )
