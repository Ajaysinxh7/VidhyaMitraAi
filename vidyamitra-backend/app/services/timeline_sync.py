"""
Timeline Synchronization Service
=================================
Merges multiple timestamped event streams (audio filler words, CV analysis,
custom annotations) into a single, chronologically sorted timeline, with
all timestamps normalized against a video start reference.

Design goals:
  - Source-agnostic: any system can feed events via a simple dict contract
  - Handles clock drift: each source can declare its own offset from video t=0
  - Idempotent & pure: no side-effects, easy to test
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from typing import List, Optional


# ---------------------------------------------------------------------------
# Event taxonomy
# ---------------------------------------------------------------------------
class EventType(str, Enum):
    """Known event categories. Extensible — unknown strings are accepted too."""
    FILLER_WORD    = "filler_word"
    EYE_CONTACT    = "eye_contact"
    POSTURE        = "posture"
    GESTURE        = "gesture"
    EMOTION        = "emotion"
    SPEECH_PACE    = "speech_pace"
    SILENCE        = "silence"
    TOPIC_CHANGE   = "topic_change"
    CUSTOM         = "custom"


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------
@dataclass(order=True)
class TimelineEvent:
    """A single event on the unified timeline.

    `order=True` makes instances sortable by their fields in declaration
    order, so `timestamp` is the primary sort key automatically.
    """
    timestamp: float            # seconds relative to video start (t = 0)
    event: str                  # EventType value or free-form string
    label: str                  # human-readable description
    source: str = ""            # which subsystem produced this event
    confidence: float = 1.0     # 0.0 – 1.0, how certain the detection is
    metadata: dict = field(default_factory=dict, compare=False)

    def to_dict(self) -> dict:
        d: dict = {
            "timestamp":  round(self.timestamp, 2),
            "event":      self.event,
            "label":      self.label,
        }
        if self.source:
            d["source"] = self.source
        if self.confidence < 1.0:
            d["confidence"] = round(self.confidence, 2)
        if self.metadata:
            d["metadata"] = self.metadata
        return d


@dataclass
class EventSource:
    """A batch of events from one subsystem.

    `offset_seconds` lets each source declare how its t=0 relates to the
    video's t=0.  For example if the audio recorder started 2.3 s *after*
    the video, set offset_seconds = 2.3 so all its timestamps shift forward.
    """
    name: str                               # e.g. "audio_filler", "cv_gaze"
    events: List[dict] = field(default_factory=list)
    offset_seconds: float = 0.0             # shift applied to every event


@dataclass
class SyncConfig:
    """Top-level configuration for a sync run."""
    video_start_time: str                   # ISO-8601 absolute start
    duration_seconds: float = 0.0           # total recording length (0 = unknown)
    sources: List[EventSource] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------
def _parse_iso(iso_string: str) -> datetime:
    """Parse an ISO-8601 string robustly (handles 'Z' suffix)."""
    cleaned = iso_string.replace("Z", "+00:00")
    return datetime.fromisoformat(cleaned)


def _compute_absolute_offset(
    video_start_iso: str,
    source_start_iso: Optional[str],
) -> float:
    """
    If a source provides an absolute start time instead of a numeric offset,
    compute the delta in seconds relative to the video start.
    """
    if not source_start_iso:
        return 0.0
    video_dt = _parse_iso(video_start_iso)
    source_dt = _parse_iso(source_start_iso)
    return (source_dt - video_dt).total_seconds()


def normalize_timestamp(
    raw_ts: float,
    source_offset: float,
    clamp_min: float = 0.0,
    clamp_max: Optional[float] = None,
) -> float:
    """Shift a raw source timestamp by the source's offset, then clamp."""
    normalised = raw_ts + source_offset
    normalised = max(normalised, clamp_min)
    if clamp_max is not None:
        normalised = min(normalised, clamp_max)
    return normalised


# ---------------------------------------------------------------------------
# Source-specific adapters
# ---------------------------------------------------------------------------
def _adapt_filler_events(raw_events: List[dict], offset: float) -> List[TimelineEvent]:
    """Convert audio filler-word dicts to TimelineEvents.

    Expected input shape (matches audio_analysis service output):
      { "word": "um", "timestamp": 12.5 }
    """
    results: List[TimelineEvent] = []
    for ev in raw_events:
        word = ev.get("word", "")
        ts = normalize_timestamp(ev.get("timestamp", 0.0), offset)
        extra_metadata = {
            k: v
            for k, v in ev.items()
            if k not in ("word", "timestamp")
        }
        results.append(TimelineEvent(
            timestamp=ts,
            event=EventType.FILLER_WORD,
            label=f"Used '{word}'",
            source="audio_filler",
            metadata={"word": word, **extra_metadata},
        ))
    return results


def _adapt_cv_events(raw_events: List[dict], offset: float) -> List[TimelineEvent]:
    """Convert computer-vision dicts to TimelineEvents.

    Expected input shape:
      { "type": "eye_contact", "timestamp": 15.5, "label": "Lost eye contact",
        "confidence": 0.87 }
    """
    results: List[TimelineEvent] = []
    for ev in raw_events:
        event_type = ev.get("type", EventType.CUSTOM)
        ts = normalize_timestamp(ev.get("timestamp", 0.0), offset)
        results.append(TimelineEvent(
            timestamp=ts,
            event=event_type,
            label=ev.get("label", event_type),
            source="cv_analysis",
            confidence=ev.get("confidence", 1.0),
            metadata={k: v for k, v in ev.items()
                      if k not in ("type", "timestamp", "label", "confidence")},
        ))
    return results


def _adapt_generic_events(
    raw_events: List[dict],
    offset: float,
    source_name: str,
) -> List[TimelineEvent]:
    """Fallback adapter for any source that sends well-formed dicts.

    Expected input shape:
      { "timestamp": 30.0, "event": "custom", "label": "Something happened" }
    """
    results: List[TimelineEvent] = []
    for ev in raw_events:
        ts = normalize_timestamp(ev.get("timestamp", 0.0), offset)
        results.append(TimelineEvent(
            timestamp=ts,
            event=ev.get("event", ev.get("type", EventType.CUSTOM)),
            label=ev.get("label", "Event"),
            source=source_name,
            confidence=ev.get("confidence", 1.0),
            metadata={k: v for k, v in ev.items()
                      if k not in ("timestamp", "event", "type", "label", "confidence")},
        ))
    return results


# Adapter registry — maps source names to their specialised adapters
_SOURCE_ADAPTERS = {
    "audio_filler":  _adapt_filler_events,
    "filler_words":  _adapt_filler_events,   # alias
    "cv_analysis":   _adapt_cv_events,
    "cv_gaze":       _adapt_cv_events,        # alias
    "cv_posture":    _adapt_cv_events,        # alias
    "cv_emotion":    _adapt_cv_events,        # alias
}


# ---------------------------------------------------------------------------
# Main sync orchestrator
# ---------------------------------------------------------------------------
def build_timeline(config: SyncConfig) -> dict:
    """
    Merge all event sources into a single sorted timeline.

    Returns:
        {
            "video_start_time": "2026-03-30T12:00:00Z",
            "duration_seconds": 120.0,
            "total_events": 14,
            "timeline": [
                { "timestamp": 3.21, "event": "filler_word", "label": "Used 'um'" },
                ...
            ],
            "summary": {
                "filler_word": 8,
                "eye_contact": 3,
                ...
            }
        }
    """
    all_events: List[TimelineEvent] = []

    for source in config.sources:
        offset = source.offset_seconds

        # Pick the right adapter
        adapter_fn = _SOURCE_ADAPTERS.get(source.name)
        if adapter_fn:
            adapted = adapter_fn(source.events, offset)
        else:
            adapted = _adapt_generic_events(source.events, offset, source.name)

        all_events.extend(adapted)

    # Sort chronologically (TimelineEvent is @dataclass(order=True))
    all_events.sort()

    # Optionally clamp to recording duration
    if config.duration_seconds > 0:
        all_events = [
            e for e in all_events
            if 0 <= e.timestamp <= config.duration_seconds
        ]

    # Build summary counts per event type
    summary: dict[str, int] = {}
    for ev in all_events:
        summary[ev.event] = summary.get(ev.event, 0) + 1

    return {
        "video_start_time": config.video_start_time,
        "duration_seconds":  round(config.duration_seconds, 2),
        "total_events":      len(all_events),
        "timeline":          [e.to_dict() for e in all_events],
        "summary":           summary,
    }


# ---------------------------------------------------------------------------
# Convenience: build from raw dicts (used by the router directly)
# ---------------------------------------------------------------------------
def sync_timeline(
    video_start_time: str,
    duration_seconds: float = 0.0,
    sources: Optional[List[dict]] = None,
) -> dict:
    """
    Thin wrapper around `build_timeline` that accepts plain dicts.

    Each source dict:
      {
        "name": "audio_filler",
        "events": [ { "word": "um", "timestamp": 12.5 }, ... ],
        "offset_seconds": 0.0          # optional, default 0
      }
    """
    parsed_sources = []
    for src in (sources or []):
        parsed_sources.append(EventSource(
            name=src.get("name", "unknown"),
            events=src.get("events", []),
            offset_seconds=src.get("offset_seconds", 0.0),
        ))

    config = SyncConfig(
        video_start_time=video_start_time,
        duration_seconds=duration_seconds,
        sources=parsed_sources,
    )

    return build_timeline(config)
