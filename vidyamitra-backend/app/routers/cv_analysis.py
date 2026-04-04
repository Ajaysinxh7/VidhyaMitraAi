"""
Computer Vision Analysis Router
===============================
POST /cv/eye-contact  — Upload video, get timestamps indicating eye contact state.
"""

from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from ..services.cv_analysis import process_video_eye_contact

router = APIRouter()


class EyeContactEvent(BaseModel):
    timestamp: float
    eye_contact: bool


@router.post(
    "/eye-contact",
    response_model=List[EyeContactEvent],
    summary="Track eye contact states throughout a video",
    description=(
        "Accepts a video file, uses MediaPipe Face Mesh to approximate head pose "
        "and iris direction, and returns an array of state-transition edges. "
        "Output contains only the timestamps where eye contact is lost or regained."
    ),
)
async def analyze_eye_contact(
    video: UploadFile = File(
        ...,
        description="Video file to analyze (webm, mp4, etc).",
    ),
):
    """
    Video processing pipeline:
      - Reads video at 3 FPS
      - Extracts 468 3D landmarks (including Iris)
      - Computes heuristics for Pitch, Yaw, and Iris-Sclera ratio.
      - Emits a state change when `eye_contact` flips.
      
    Returns:
    ```json
    [
      { "timestamp": 0.0,  "eye_contact": true },
      { "timestamp": 10.2, "eye_contact": false },
      { "timestamp": 15.5, "eye_contact": true }
    ]
    ```
    """
    allowed_extensions = {".webm", ".mp4", ".mov", ".mkv", ".avi"}
    filename = video.filename or "video.webm"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported video format '{ext}'. "
                f"Accepted: {', '.join(sorted(allowed_extensions))}"
            ),
        )

    try:
        video_bytes = await video.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read video file: {e}")

    if len(video_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded video file is empty.")

    # 100 MB generous upload limit for CV
    if len(video_bytes) > 100 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Video file exceeds 100 MB limit.",
        )

    try:
        timeline = await process_video_eye_contact(video_bytes, filename, target_fps=3)
        return timeline
    except RuntimeError as e:
        if "MediaPipe" in str(e):
            raise HTTPException(status_code=503, detail="Server missing MediaPipe.")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Video analysis failed: {str(e)}",
        )
