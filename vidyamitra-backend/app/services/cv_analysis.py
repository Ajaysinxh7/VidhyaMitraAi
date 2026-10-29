"""
Computer Vision Analysis Service
=================================

Face detection / eye-contact analysis has been removed. The pipeline hooks
(imported by the interview pipeline and cv router) are kept as no-op stubs so
the rest of the system continues to work without CV analysis.
"""

from typing import List


async def process_video_eye_contact(
    video_bytes: bytes,
    filename: str = "video.webm",
    target_fps: int = 3,
) -> List[dict]:
    """
    No-op stub. Previously ran MediaPipe Face Mesh eye-contact detection.

    Returns an empty timeline so downstream consumers (timeline sync,
    per-question eye_contact_ratio, eye_contact_score) degrade gracefully to 0.
    """
    return []
