"""
Timeline Router
================
POST /timeline/sync   — Merge multiple event streams into a unified timeline.
"""

from typing import List, Optional, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..services.timeline_sync import sync_timeline

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------
class EventSourcePayload(BaseModel):
    """A batch of events from one subsystem."""
    name: str = Field(
        ...,
        description=(
            "Source identifier. Use 'audio_filler' or 'filler_words' for "
            "filler-word events, 'cv_analysis' / 'cv_gaze' / 'cv_posture' "
            "for computer-vision events, or any custom string."
        ),
        examples=["audio_filler"],
    )
    events: List[dict] = Field(
        default_factory=list,
        description=(
            "List of event dicts. Shape depends on source type.\n\n"
            "**audio_filler**: `{ \"word\": \"um\", \"timestamp\": 12.5 }`\n\n"
            "**cv_analysis**: `{ \"type\": \"eye_contact\", \"timestamp\": 15.5, "
            "\"label\": \"Lost eye contact\", \"confidence\": 0.87 }`\n\n"
            "**generic**: `{ \"timestamp\": 30.0, \"event\": \"custom\", "
            "\"label\": \"Something happened\" }`"
        ),
    )
    offset_seconds: float = Field(
        default=0.0,
        description=(
            "Time offset (in seconds) of this source relative to video t=0. "
            "Positive means the source started *after* the video began."
        ),
    )


class TimelineSyncRequest(BaseModel):
    """Full payload for a timeline sync operation."""
    video_start_time: str = Field(
        ...,
        description="ISO-8601 timestamp of when the video recording started.",
        examples=["2026-03-30T12:00:00Z"],
    )
    duration_seconds: float = Field(
        default=0.0,
        description=(
            "Total recording duration in seconds. "
            "If set, events outside [0, duration] are clamped/discarded."
        ),
    )
    sources: List[EventSourcePayload] = Field(
        ...,
        description="One or more event sources to merge into the timeline.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "video_start_time": "2026-03-30T12:00:00Z",
                    "duration_seconds": 120.0,
                    "sources": [
                        {
                            "name": "audio_filler",
                            "offset_seconds": 0.0,
                            "events": [
                                {"word": "um", "timestamp": 12.5},
                                {"word": "like", "timestamp": 24.1},
                                {"word": "uh", "timestamp": 35.7},
                            ],
                        },
                        {
                            "name": "cv_analysis",
                            "offset_seconds": 0.2,
                            "events": [
                                {
                                    "type": "eye_contact",
                                    "timestamp": 15.3,
                                    "label": "Lost eye contact",
                                    "confidence": 0.91,
                                },
                                {
                                    "type": "posture",
                                    "timestamp": 42.0,
                                    "label": "Slouching detected",
                                    "confidence": 0.78,
                                },
                            ],
                        },
                    ],
                }
            ]
        }
    }


class TimelineEventItem(BaseModel):
    timestamp: float
    event: str
    label: str
    source: Optional[str] = None
    confidence: Optional[float] = None
    metadata: Optional[dict] = None


class TimelineSyncResponse(BaseModel):
    video_start_time: str
    duration_seconds: float
    total_events: int
    timeline: List[TimelineEventItem]
    summary: dict[str, int]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@router.post(
    "/sync",
    response_model=TimelineSyncResponse,
    summary="Synchronize and merge event streams into a timeline",
    description=(
        "Accepts multiple timestamped event sources (audio fillers, CV analysis, "
        "custom annotations), normalizes all timestamps relative to the video "
        "start, and returns a single sorted timeline."
    ),
)
async def sync_interview_timeline(payload: TimelineSyncRequest):
    """
    Merge multiple event streams into a unified, chronologically sorted
    timeline.

    **How it works:**
    1. Each source provides events with timestamps in its own time frame.
    2. `offset_seconds` shifts each source's timestamps relative to video t=0.
    3. All events are merged and sorted chronologically.
    4. A summary count per event type is included.

    **Example response:**
    ```json
    {
      "video_start_time": "2026-03-30T12:00:00Z",
      "duration_seconds": 120.0,
      "total_events": 5,
      "timeline": [
        { "timestamp": 12.5,  "event": "filler_word",  "label": "Used 'um'" },
        { "timestamp": 15.5,  "event": "eye_contact",  "label": "Lost eye contact" },
        { "timestamp": 24.1,  "event": "filler_word",  "label": "Used 'like'" },
        { "timestamp": 35.7,  "event": "filler_word",  "label": "Used 'uh'" },
        { "timestamp": 42.2,  "event": "posture",      "label": "Slouching detected" }
      ],
      "summary": { "filler_word": 3, "eye_contact": 1, "posture": 1 }
    }
    ```
    """
    if not payload.sources:
        raise HTTPException(
            status_code=400,
            detail="At least one event source is required.",
        )

    try:
        result = sync_timeline(
            video_start_time=payload.video_start_time,
            duration_seconds=payload.duration_seconds,
            sources=[s.model_dump() for s in payload.sources],
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Timeline sync failed: {str(e)}",
        )
