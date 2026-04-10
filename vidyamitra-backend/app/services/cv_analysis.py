"""
Computer Vision Analysis Service
=================================
Uses MediaPipe Face Mesh to implement a lightweight eye contact tracker.
Processes video to detect if the user's head pose and eye direction are
pointed toward the screen.
"""

import math
import os
import tempfile
from dataclasses import dataclass
from typing import List

import cv2
import numpy as np

try:
    import mediapipe as mp
    import mediapipe.python.solutions.face_mesh as mp_face_mesh
except ImportError:
    mp = None
    mp_face_mesh = None


@dataclass
class EyeContactState:
    timestamp: float
    eye_contact: bool


def _distance(p1, p2) -> float:
    return math.hypot(p1.x - p2.x, p1.y - p2.y)


def check_eye_contact(landmarks) -> bool:
    """
    Evaluates Face Mesh landmarks to determine if the user is maintaining eye contact.
    Uses both head yaw/pitch heuristics and iris location.
    """
    # Head pose (Yaw) estimation
    # left cheek edge 234, right cheek edge 454, nose tip 1
    left_edge = landmarks[234]
    right_edge = landmarks[454]
    nose = landmarks[1]

    face_width = _distance(left_edge, right_edge)
    if face_width == 0:
        return False

    dist_left_to_nose = _distance(left_edge, nose)
    dist_right_to_nose = _distance(right_edge, nose)

    yaw_ratio = dist_left_to_nose / face_width
    # Looking perfectly center should be ~0.5. Extrema < 0.3 or > 0.7 = heavy turn
    if yaw_ratio < 0.35 or yaw_ratio > 0.65:
        return False

    # Head pose (Pitch) estimation
    # top of forehead 10, chin 152
    top = landmarks[10]
    chin = landmarks[152]
    face_height = _distance(top, chin)
    if face_height == 0:
        return False

    dist_nose_to_chin = _distance(nose, chin)
    pitch_ratio = dist_nose_to_chin / face_height
    # Looking perfectly center should be ~0.35 to 0.45 
    if pitch_ratio < 0.25 or pitch_ratio > 0.55:
        return False

    # Eye direction estimation (Iris vs Sclera bounds)
    # Left eye: outer 33, inner 133, iris center 468
    # Right eye: inner 362, outer 263, iris center 473
    l_outer = landmarks[33]
    l_inner = landmarks[133]
    l_iris = landmarks[468]

    r_inner = landmarks[362]
    r_outer = landmarks[263]
    r_iris = landmarks[473]

    l_eye_width = _distance(l_outer, l_inner)
    r_eye_width = _distance(r_inner, r_outer)

    if l_eye_width == 0 or r_eye_width == 0:
        return False

    l_iris_ratio = _distance(l_outer, l_iris) / l_eye_width
    r_iris_ratio = _distance(r_inner, r_iris) / r_eye_width

    # Ideal center look is around 0.4 - 0.6.
    if l_iris_ratio < 0.35 or l_iris_ratio > 0.65:
        return False
    if r_iris_ratio < 0.35 or r_iris_ratio > 0.65:
        return False

    return True


async def process_video_eye_contact(
    video_bytes: bytes,
    filename: str = "video.webm",
    target_fps: int = 3,
) -> List[dict]:
    """
    Lightweight video processor.
    - Decodes video via cv2
    - Samples frames down to 'target_fps' for performance
    - Extracts face landmarks via MediaPipe
    - Emits state changes to keep output small
    """
    if mp is None:
        print("WARNING: MediaPipe or OpenCV failed to load (likely missing OS packages like libGL natively on Render). Skipping video eye contact analysis.")
        return []

    suffix = "." + filename.rsplit(".", 1)[-1] if "." in filename else ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    timeline: List[EyeContactState] = []

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise RuntimeError("Could not open video file using OpenCV.")

        orig_fps = cap.get(cv2.CAP_PROP_FPS)
        if orig_fps <= 0 or math.isnan(orig_fps):
            orig_fps = 30.0  # fallback

        frame_skip = max(1, int(round(orig_fps / target_fps)))
        
        frame_idx = 0
        current_state = None

        try:
            with mp_face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,  # Crucial for Iris tracking
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            ) as face_mesh:
                
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break

                    # Process only target_fps frames
                    if frame_idx % frame_skip == 0:
                        timestamp = frame_idx / orig_fps
                        
                        # Convert BGR to RGB
                        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        results = face_mesh.process(rgb_frame)

                        has_eye_contact = False
                        if results.multi_face_landmarks:
                            landmarks = results.multi_face_landmarks[0].landmark
                            has_eye_contact = check_eye_contact(landmarks)

                        # Only record state changes! (Keeps timeline tiny)
                        if current_state != has_eye_contact:
                            timeline.append(EyeContactState(
                                timestamp=round(timestamp, 2),
                                eye_contact=has_eye_contact
                            ))
                            current_state = has_eye_contact

                    frame_idx += 1
        finally:
            cap.release()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    return [{"timestamp": e.timestamp, "eye_contact": e.eye_contact} for e in timeline]
