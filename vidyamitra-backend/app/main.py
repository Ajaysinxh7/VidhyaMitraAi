from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from fastapi.staticfiles import StaticFiles

from .utils.storage import get_writable_temp_path

from .routers import resume, evaluate, quiz, interview, jobs, progress, auth, roadmap, audio_analysis, timeline, cv_analysis
from .routers.interview_pipeline import router as interview_pipeline_router

app: FastAPI = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)
origins = [
    "http://localhost:5173",
    "https://vidhyamitraai.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(resume.router, prefix="/resume", tags=["resume"])
app.include_router(evaluate.router, prefix="/evaluate", tags=["evaluate"])
app.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
app.include_router(interview.router, prefix="/interview", tags=["interview"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(roadmap.router, prefix="/roadmap", tags=["roadmap"])
app.include_router(audio_analysis.router, prefix="/audio", tags=["audio-analysis"])
app.include_router(timeline.router, prefix="/timeline", tags=["timeline"])
app.include_router(cv_analysis.router, prefix="/cv", tags=["cv-analysis"])

# Serve uploaded interview media for review playback (defaults to OS temp, not the repo).
_media_dir = get_writable_temp_path("INTERVIEW_MEDIA_PATH", "vidyamitra_interview_media")
_media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/interview-media", StaticFiles(directory=str(_media_dir)), name="interview-media")

app.include_router(interview_pipeline_router, prefix="/interview", tags=["interview-pipeline"])

@app.get(path="/")
def root() -> dict[str, str]:
    return {"name": "Vidyamitra API", "status": "ok"}