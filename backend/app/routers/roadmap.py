import os
import json
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv
from openai import AsyncOpenAI
import httpx

load_dotenv()

# ── Supabase (optional) ────────────────────────────────────────────────────────
# If Supabase is unreachable, roadmap data is stored in-memory for the session.
try:
    from supabase import create_client, Client
    _supabase_url = os.getenv("SUPABASE_URL")
    _supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Optional[Client] = create_client(_supabase_url, _supabase_key) if _supabase_url and _supabase_key else None
except Exception:
    supabase = None

# In-memory fallback store  { roadmap_id: { ...roadmap_data } }
_roadmap_store: Dict[str, dict] = {}

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

# ── Groq / OpenAI-compatible client ───────────────────────────────────────────
openai_client = AsyncOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

router = APIRouter()


# ── Pydantic Models ────────────────────────────────────────────────────────────
class GenerateRoadmapRequest(BaseModel):
    user_id: str
    goal: str
    timeline_months: int = 6


class MilestoneItem(BaseModel):
    id: str
    title: str
    description: str
    duration: str
    status: str  # "completed" | "current" | "upcoming"


class GenerateRoadmapResponse(BaseModel):
    roadmap_id: str
    goal: str
    milestones: List[MilestoneItem]
    recommended_videos: List[Dict[str, str]] = []
    dashboard_image_url: Optional[str] = None


# ── Endpoint ───────────────────────────────────────────────────────────────────
@router.post("/generate", response_model=GenerateRoadmapResponse)
async def generate_roadmap(request: GenerateRoadmapRequest):
    """
    Generates a structured career roadmap with milestones using an AI model.
    Saves the roadmap in-memory (and optionally to Supabase).
    """
    if not request.goal or not request.goal.strip():
        raise HTTPException(status_code=400, detail="Goal cannot be empty. Please provide a career goal.")

    try:
        prompt = f"""
You are an expert career counselor and learning path designer.

Create a detailed career roadmap for someone whose goal is: "{request.goal}"
Timeline: {request.timeline_months} months

You MUST respond in strictly valid JSON format matching this schema exactly:
{{
    "milestones": [
        {{
            "title": "Milestone title",
            "description": "Detailed description of what to learn and do in this milestone (2-3 sentences).",
            "duration": "Weeks X-Y",
            "status": "upcoming"
        }}
    ]
}}

Rules:
- Generate between 4 and 6 milestones that form a logical, progressive learning path
- The first milestone should have status "current", all others "upcoming"
- Each duration should be spread across the {request.timeline_months}-month timeline
- Be specific and actionable in descriptions
- Output ONLY raw JSON. No markdown, no backticks, no extra text.
"""

        completion = await openai_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise, JSON-outputting career planning AI. You MUST output ONLY raw JSON. No markdown, no formatting, no conversational text."
                },
                {"role": "user", "content": prompt}
            ]
        )

        raw_content = completion.choices[0].message.content.strip()

        # Strip accidental markdown code fences if the model adds them
        if raw_content.startswith("```"):
            raw_content = raw_content.split("```")[1]
            if raw_content.startswith("json"):
                raw_content = raw_content[4:]

        try:
            ai_data = json.loads(raw_content)
            raw_milestones = ai_data.get("milestones", [])
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="AI failed to return valid JSON for the roadmap.")

        if not raw_milestones:
            raise HTTPException(status_code=500, detail="AI returned an empty milestones list.")

        # Assign unique IDs to each milestone
        formatted_milestones = []
        for i, m in enumerate(raw_milestones):
            formatted_milestones.append({
                "id": str(uuid.uuid4()),
                "title": m.get("title", f"Milestone {i + 1}"),
                "description": m.get("description", ""),
                "duration": m.get("duration", ""),
                "status": m.get("status", "upcoming"),
            })

        # ── Fetch External Resources ──────────────────────────────────────────
        youtube_videos = []
        if YOUTUBE_API_KEY and len(formatted_milestones) > 0:
            # Fetch videos for the first milestone's topic
            first_topic = formatted_milestones[0]["title"]
            youtube_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q={request.goal}+{first_topic}+tutorial&type=video&key={YOUTUBE_API_KEY}"
            
            async with httpx.AsyncClient() as client:
                yt_response = await client.get(youtube_url)
                if yt_response.status_code == 200:
                    for item in yt_response.json().get("items", []):
                        youtube_videos.append({
                            "title": item["snippet"]["title"],
                            "video_id": item["id"]["videoId"],
                            "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                        })

        dashboard_image = None
        if PEXELS_API_KEY:
            pexels_url = f"https://api.pexels.com/v1/search?query={request.goal}&per_page=1"
            async with httpx.AsyncClient() as client:
                px_response = await client.get(pexels_url, headers={"Authorization": PEXELS_API_KEY})
                if px_response.status_code == 200 and px_response.json().get("photos"):
                    dashboard_image = px_response.json()["photos"][0]["src"]["landscape"]  # Prefer landscape for backgrounds

        # ── Always save to in-memory store ────────────────────────────────────
        roadmap_id = str(uuid.uuid4())
        _roadmap_store[roadmap_id] = {
            "id": roadmap_id,
            "user_id": request.user_id,
            "goal": request.goal,
            "timeline_months": request.timeline_months,
            "milestones": formatted_milestones,
            "recommended_videos": youtube_videos,
            "dashboard_image_url": dashboard_image,
        }

        # ── Best-effort Supabase write (skip silently if unavailable) ─────────
        if supabase:
            try:
                db_response = supabase.table("roadmaps").insert({
                    "id": roadmap_id,
                    "user_id": request.user_id,
                    "goal": request.goal,
                    "timeline_months": request.timeline_months,
                    "milestones": formatted_milestones,
                    "recommended_videos": youtube_videos,
                    "dashboard_image_url": dashboard_image,
                }).execute()
                if db_response.data:
                    db_id = db_response.data[0]["id"]
                    _roadmap_store[db_id] = _roadmap_store.pop(roadmap_id)
                    _roadmap_store[db_id]["id"] = db_id
                    roadmap_id = db_id
            except Exception:
                pass  # Fall back silently to in-memory store

        return {
            "roadmap_id": roadmap_id,
            "goal": request.goal,
            "milestones": formatted_milestones,
            "recommended_videos": youtube_videos,
            "dashboard_image_url": dashboard_image,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating roadmap: {str(e)}")
