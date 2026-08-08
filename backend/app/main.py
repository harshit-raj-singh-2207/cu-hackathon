"""
FastAPI application entry-point.

Run with::

    uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection


# ── Lifespan (startup / shutdown) ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to MongoDB on startup, disconnect on shutdown."""
    await connect_to_mongo()
    yield
    await close_mongo_connection()


# ── App instance ───────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check & Root ───────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}


# ── Static file serving ───────────────────────────────────────────────────────

import os
_static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.isdir(_static_dir):
    app.mount("/static", StaticFiles(directory=_static_dir), name="static")


# ── Register API v1 routers ───────────────────────────────────────────────────

from app.api.v1 import auth, analytics, analyzer, ats, coding, coding_interview
from app.api.v1 import communication_analysis, companies, interview
from app.api.v1 import interview_recording, interview_types, jobs, job_roles
from app.api.v1 import learning_roadmap, profile, resume, skill_analysis
from app.api.v1 import stress_interview, system_design, webcam_analysis

_prefix = settings.API_V1_STR

app.include_router(auth.router,                    prefix=f"{_prefix}/auth",                    tags=["Auth"])
app.include_router(profile.router,                  prefix=f"{_prefix}/profile",                 tags=["Profile"])
app.include_router(analytics.router,                prefix=f"{_prefix}/analytics",               tags=["Analytics"])
app.include_router(analyzer.router,                 prefix=f"{_prefix}/analyzer",                tags=["Analyzer"])
app.include_router(ats.router,                      prefix=f"{_prefix}/ats",                     tags=["ATS"])
app.include_router(coding.router,                   prefix=f"{_prefix}/coding",                  tags=["Coding"])
app.include_router(coding_interview.router,         prefix=f"{_prefix}/coding-interview",        tags=["Coding Interview"])
app.include_router(communication_analysis.router,   prefix=f"{_prefix}/communication-analysis",  tags=["Communication Analysis"])
app.include_router(companies.router,                prefix=f"{_prefix}/companies",               tags=["Companies"])
app.include_router(interview.router,                prefix=f"{_prefix}/interview",               tags=["Interview"])
app.include_router(interview_recording.router,      prefix=f"{_prefix}/interview-recording",     tags=["Interview Recording"])
app.include_router(interview_types.router,          prefix=f"{_prefix}/interview-types",         tags=["Interview Types"])
app.include_router(jobs.router,                     prefix=f"{_prefix}/jobs",                    tags=["Jobs"])
app.include_router(job_roles.router,                prefix=f"{_prefix}/job-roles",               tags=["Job Roles"])
app.include_router(learning_roadmap.router,         prefix=f"{_prefix}/roadmap",                 tags=["Learning Roadmap"])
app.include_router(resume.router,                   prefix=f"{_prefix}/resume",                  tags=["Resume"])
app.include_router(skill_analysis.router,           prefix=f"{_prefix}/skill-analysis",          tags=["Skill Analysis"])
app.include_router(stress_interview.router,         prefix=f"{_prefix}/stress-interview",        tags=["Stress Interview"])
app.include_router(system_design.router,            prefix=f"{_prefix}/system-design",           tags=["System Design"])
app.include_router(webcam_analysis.router,          prefix=f"{_prefix}/webcam-analysis",         tags=["Webcam Analysis"])
