"""
Audio Analysis Service
======================
Transcribes audio via Groq's Whisper API and detects filler words
with precise timestamps.
"""

import os
import re
import tempfile
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Filler-word catalogue (lowercase, regex-safe)
# ---------------------------------------------------------------------------
# Each entry is a compiled regex that matches the filler as a whole word,
# accounting for punctuation that Whisper may attach (e.g. "um," or "like.").
FILLER_PATTERNS: dict[str, re.Pattern] = {
    "um":       re.compile(r"\bu+m+\b",       re.IGNORECASE),
    "uh":       re.compile(r"\bu+h+\b",       re.IGNORECASE),
    "like":     re.compile(r"\blike\b",     re.IGNORECASE),
    "you know": re.compile(r"\byou know\b", re.IGNORECASE),
    "so":       re.compile(r"\bso\b",       re.IGNORECASE),
    "actually": re.compile(r"\bactually\b", re.IGNORECASE),
    "basically": re.compile(r"\bbasically\b", re.IGNORECASE),
    "right":    re.compile(r"\bright\b",    re.IGNORECASE),
}

# The user asked for these four specifically — this is the default set
DEFAULT_FILLERS = {"um", "uh", "like", "you know"}


# ---------------------------------------------------------------------------
# Data models (plain dataclasses — no Pydantic dependency inside service)
# ---------------------------------------------------------------------------
@dataclass
class FillerOccurrence:
    word: str
    timestamp: float          # seconds into the audio


@dataclass
class AudioAnalysisResult:
    transcript: str
    filler_words: List[FillerOccurrence] = field(default_factory=list)
    total_count: int = 0
    duration_seconds: float = 0.0
    # Whisper verbose_json word-level output (when available).
    # Each entry typically includes: { "word": str, "start": float, "end": float, ... }
    words: List[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "transcript": self.transcript,
            "filler_words": [
                {"word": f.word, "timestamp": round(f.timestamp, 2)}
                for f in self.filler_words
            ],
            "total_count": self.total_count,
            "duration_seconds": round(self.duration_seconds, 2),
        }


# ---------------------------------------------------------------------------
# Groq Whisper client
# ---------------------------------------------------------------------------
def _get_groq_client():
    """Lazy-init the Groq client so import-time failures don't crash the app."""
    try:
        from groq import Groq
    except ImportError:
        raise RuntimeError(
            "The 'groq' package is required for audio analysis. "
            "Install it with: pip install groq"
        )

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set in the environment.")

    return Groq(api_key=api_key)


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """
    Sends audio to Groq Whisper and returns the verbose JSON response
    containing word-level timestamps.

    Returns the raw Groq response dict with keys:
      - text (str)            full transcript
      - segments (list)       segment-level data
      - words (list|None)     word-level data (when available)
      - duration (float)      total audio length in seconds
    """
    client = _get_groq_client()

    # Groq's SDK expects a file-like object.  Write to a temp file so we
    # can pass it with the right filename/extension for codec detection.
    suffix = Path(filename).suffix or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        # Use verbose_json to get word-level timestamps
        with open(tmp_path, "rb") as f:
            transcription = client.audio.transcriptions.create(
                file=(filename, f),
                model="whisper-large-v3",
                prompt="Umm, let me think like, uh, actually, you know, yeah.",
                response_format="verbose_json",
                timestamp_granularities=["word", "segment"],
                language="en",
            )

        # The Groq SDK returns a Pydantic-like object — normalise to dict
        if hasattr(transcription, "model_dump"):
            return transcription.model_dump()
        elif hasattr(transcription, "dict"):
            return transcription.dict()
        else:
            # Already a dict (some SDK versions)
            return dict(transcription)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# Filler-word detection
# ---------------------------------------------------------------------------
def detect_fillers_from_words(
    words: list[dict],
    target_fillers: set[str] | None = None,
) -> List[FillerOccurrence]:
    if target_fillers is None:
        target_fillers = DEFAULT_FILLERS

    occurrences: List[FillerOccurrence] = []

    if not words:
        return occurrences

    active_patterns = {name: FILLER_PATTERNS[name] for name in target_fillers if name in FILLER_PATTERNS}
    multi_fillers = {f for f in target_fillers if " " in f}

    for idx, w in enumerate(words):
        raw_word = w.get("word", "")
        # Remove punctuation for cleaner matching but keep word boundaries intact
        clean = re.sub(r"[^\w\s]", "", raw_word).strip().lower()
        if not clean:
            continue

        # Check singles
        for name, pattern in active_patterns.items():
            if " " not in name and pattern.search(clean):
                occurrences.append(FillerOccurrence(word=name, timestamp=w.get("start", 0.0)))
                break  # Matched, move to next word

        # Check bigrams
        if multi_fillers and idx < len(words) - 1:
            clean_next = re.sub(r"[^\w\s]", "", words[idx + 1].get("word", "")).strip().lower()
            bigram = f"{clean} {clean_next}"
            for name in multi_fillers:
                if name in active_patterns and active_patterns[name].search(bigram):
                    occurrences.append(FillerOccurrence(word=name, timestamp=w.get("start", 0.0)))

    occurrences.sort(key=lambda o: o.timestamp)
    return occurrences


def detect_fillers_from_segments(
    segments: list[dict],
    target_fillers: set[str] | None = None,
) -> List[FillerOccurrence]:
    if target_fillers is None:
        target_fillers = DEFAULT_FILLERS

    occurrences: List[FillerOccurrence] = []
    active_patterns = {name: FILLER_PATTERNS[name] for name in target_fillers if name in FILLER_PATTERNS}
    multi_fillers = {f for f in target_fillers if " " in f}

    for seg in segments:
        text = seg.get("text", "")
        seg_start = seg.get("start", 0.0)
        seg_end = seg.get("end", seg_start)
        seg_duration = seg_end - seg_start

        tokens = text.split()
        if not tokens:
            continue
        time_per_token = seg_duration / len(tokens) if tokens else 0.0

        for idx, token in enumerate(tokens):
            clean = re.sub(r"[^\w\s]", "", token).strip().lower()
            
            # Check singles
            for name, pattern in active_patterns.items():
                if " " not in name and pattern.search(clean):
                    approx_ts = seg_start + (idx * time_per_token)
                    occurrences.append(FillerOccurrence(word=name, timestamp=approx_ts))
                    break

            # Bigrams
            if multi_fillers and idx < len(tokens) - 1:
                clean_next = re.sub(r"[^\w\s]", "", tokens[idx + 1]).strip().lower()
                bigram = f"{clean} {clean_next}"
                for name in multi_fillers:
                    if name in active_patterns and active_patterns[name].search(bigram):
                        approx_ts = seg_start + (idx * time_per_token)
                        occurrences.append(FillerOccurrence(word=name, timestamp=approx_ts))

    occurrences.sort(key=lambda o: o.timestamp)
    return occurrences


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------
async def analyze_audio(
    audio_bytes: bytes,
    filename: str = "audio.webm",
    target_fillers: Optional[set[str]] = None,
) -> AudioAnalysisResult:
    """
    Full pipeline: audio → Whisper STT → filler-word detection.

    Returns an AudioAnalysisResult with transcript, filler list, and counts.
    """
    whisper_response = await transcribe_audio(audio_bytes, filename)

    transcript = whisper_response.get("text", "")
    duration = whisper_response.get("duration", 0.0)
    words = whisper_response.get("words") or []
    segments = whisper_response.get("segments", [])

    # Prefer word-level timestamps; fall back to segment-level interpolation
    if words:
        fillers = detect_fillers_from_words(words, target_fillers)
    else:
        fillers = detect_fillers_from_segments(segments, target_fillers)

    return AudioAnalysisResult(
        transcript=transcript,
        filler_words=fillers,
        total_count=len(fillers),
        duration_seconds=duration,
        words=words if words else [],
    )
