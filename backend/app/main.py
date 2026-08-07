import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import connect_db, close_db, get_database
from app.api.v1.auth import router as auth_router
from app.api.v1.profile import router as profile_router
from app.api.v1.resume import router as resume_router
from app.api.v1.analyzer import router as analyzer_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.coding_interview import router as coding_interview_router
from app.api.v1.system_design import router as system_design_router
from app.api.v1.communication_analysis import router as communication_analysis_router
from app.api.v1.webcam_analysis import router as webcam_analysis_router, websocket_analysis
from app.api.v1.stress_interview import router as stress_interview_router, websocket_stress
from app.api.v1.interview_recording import router as interview_recording_router
from app.api.v1.skill_analysis import router as skill_analysis_router
from app.api.v1.learning_roadmap import router as learning_roadmap_router
from app.api.v1.companies import router as companies_router
from app.api.v1.job_roles import router as job_roles_router
from app.api.v1.interview_types import router as interview_types_router
from app.api.v1.interview import router as interview_router




from app.api.v1.ats import router as ats_router
from app.api.v1.coding import router as coding_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MainApp")


async def _create_indexes():
    """Create MongoDB indexes for performance and token cleanup."""

    db = get_database()

    if db is None:
        logger.warning("Skipping index creation — database is not available.")
        return

    # Coding interview indexes
    await db["coding_sessions"].create_index("session_id", unique=True)
    await db["coding_sessions"].create_index([("user_id", 1), ("created_at", -1)])
    await db["code_snapshots"].create_index([("session_id", 1), ("snapshot_number", 1)])
    await db["submissions"].create_index([("session_id", 1), ("submitted_at", -1)])
    await db["test_cases"].create_index("session_id")
    await db["ai_question_hooks"].create_index("question_id", unique=True)
    await db["algorithm_discussions"].create_index("session_id", unique=True)

    # System design indexes
    await db["system_design_sessions"].create_index("session_id", unique=True)
    await db["system_design_sessions"].create_index([("user_id", 1), ("created_at", -1)])
    await db["system_design_whiteboards"].create_index("session_id", unique=True)
    await db["system_design_architecture_notes"].create_index("session_id")
    await db["system_design_diagrams"].create_index("session_id")
    await db["system_design_apis"].create_index("session_id")
    await db["system_design_db_designs"].create_index("session_id")
    await db["system_design_scalings"].create_index("session_id")
    await db["system_design_evaluations"].create_index("session_id", unique=True)
    await db["system_design_recordings"].create_index("session_id", unique=True)

    # Communication analysis indexes
    await db["communication_analyses"].create_index("analysis_id", unique=True)
    await db["communication_analyses"].create_index([("user_id", 1), ("created_at", -1)])

    # Webcam analysis indexes
    await db["webcam_sessions"].create_index("session_id", unique=True)
    await db["webcam_sessions"].create_index([("user_id", 1), ("created_at", -1)])
    await db["body_language_analyses"].create_index([("session_id", 1), ("timestamp", 1)])
    await db["body_language_summaries"].create_index("session_id", unique=True)
    await db["timeline_events"].create_index([("session_id", 1), ("event_time", 1)])

    # Stress interview indexes
    await db["stress_sessions"].create_index("session_id", unique=True)
    await db["stress_sessions"].create_index([("user_id", 1), ("created_at", -1)])
    await db["stress_events"].create_index([("session_id", 1), ("event_time", 1)])
    await db["stress_reports"].create_index("session_id", unique=True)

    # Interview recording indexes
    await db["interview_recordings"].create_index("interview_session_id", unique=True)
    await db["interview_recordings"].create_index([("user_id", 1), ("created_at", -1)])
    await db["interview_recordings"].create_index("recording_status")
    await db["replay_events"].create_index([("recording_id", 1), ("timestamp", 1)])
    await db["mistake_markers"].create_index([("recording_id", 1), ("timestamp", 1)])
    await db["ai_comments"].create_index([("recording_id", 1), ("timestamp", 1)])
    await db["bookmarks"].create_index([("recording_id", 1), ("timestamp", 1)])
    await db["recording_analytics"].create_index("recording_id", unique=True)

    # Skill analysis indexes
    await db["skill_analyses"].create_index("interview_session_id", unique=True)
    await db["skill_analyses"].create_index([("user_id", 1), ("created_at", -1)])
    await db["skill_analyses"].create_index("overall_score")
    await db["skill_scores"].create_index([("analysis_id", 1), ("skill_name", 1)])
    await db["weak_skills"].create_index("analysis_id")
    await db["strength_skills"].create_index("analysis_id")
    await db["learning_recommendations"].create_index("analysis_id")
    await db["career_readiness"].create_index("analysis_id", unique=True)

    # Learning roadmap indexes
    await db["learning_roadmaps"].create_index([("user_id", 1), ("created_at", -1)])
    await db["learning_roadmaps"].create_index([("analysis_id", 1), ("status", 1)])
    await db["roadmap_phases"].create_index([("roadmap_id", 1), ("phase_number", 1)])
    await db["learning_tasks"].create_index("phase_id")
    await db["project_recommendations"].create_index("roadmap_id")
    await db["assessments"].create_index("roadmap_id")
    await db["progress_trackers"].create_index("roadmap_id", unique=True)

    # Companies indexes
    await db["companies"].create_index("name_normalized", unique=True)

    # Job roles indexes
    await db["job_roles"].create_index("role_id", unique=True)
    await db["job_roles"].create_index("role_name_normalized", unique=True)

    # Interview types indexes
    await db["interview_types"].create_index("name_normalized", unique=True)

    # Unique user email




    await db["users"].create_index(
        "email",
        unique=True,
        name="unique_user_email",
    )

    # Automatically remove expired blacklisted tokens
    await db["token_blacklist"].create_index(
        "expires_at",
        expireAfterSeconds=0,
        name="token_blacklist_ttl",
    )

    # Fast blacklist token lookup
    await db["token_blacklist"].create_index(
        "token",
        name="token_blacklist_token",
    )

    # Jobs indexes
    await db["jobs"].create_index(
        "seed_key",
        unique=True,
        partialFilterExpression={
            "seed_key": {"$type": "string"}
        },
        name="unique_job_seed_key",
    )

    job_fields = (
        "is_active",
        "normalized_title",
        "normalized_company",
        "normalized_location",
        "normalized_skills",
        "posted_at",
        "application_deadline",
        "workplace_type",
        "employment_type",
        "salary_min",
        "salary_max",
    )

    for field in job_fields:
        await db["jobs"].create_index(field)

    compound_job_fields = (
        "normalized_title",
        "normalized_company",
        "normalized_location",
        "posted_at",
    )

    for field in compound_job_fields:
        await db["jobs"].create_index(
            [("is_active", 1), (field, 1)]
        )

    # Preferences
    await db["job_preferences"].create_index(
        "user_id",
        unique=True,
    )

    await db["user_job_preferences"].create_index(
        "user_id",
        unique=True,
    )

    # Saved jobs
    await db["saved_jobs"].create_index(
        [("user_id", 1), ("job_id", 1)],
        unique=True,
    )

    # Job applications
    await db["job_applications"].create_index(
        [("user_id", 1), ("applied_at", -1)]
    )

    await db["job_applications"].create_index(
        [("user_id", 1), ("status", 1)]
    )

    await db["job_applications"].create_index(
        [("user_id", 1), ("job_id", 1)],
        unique=True,
    )

    await db["job_applications"].create_index("job_id")
    await db["job_applications"].create_index("status")
    await db["job_applications"].create_index("applied_at")

    # Analytics lookups and department filters
    for field in ("department", "batch", "graduation_year", "course", "role"):
        await db["users"].create_index(field)
    for collection in ("coding_scores", "interview_results"):
        await db[collection].create_index([("user_id", 1), ("updated_at", -1)])

    logger.info("MongoDB indexes created or verified successfully.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown lifecycle."""
    # ── Startup ──
    logger.info("Starting up CareerCopilot AI Backend...")
    await connect_db()
    await _create_indexes()

    # Seed default collections
    db = get_database()
    if db is not None:
        from app.services.company_service import seed_default_companies
        from app.services.job_role_service import seed_default_job_roles
        from app.services.interview_type_service import seed_default_interview_types
        await seed_default_companies(db)
        await seed_default_job_roles(db)
        await seed_default_interview_types(db)

    yield

    logger.info("Shutting down CareerCopilot AI Backend...")
    await close_db()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "AI Career Copilot Backend API with JWT authentication, "
        "resume analysis, job recommendations and placement analytics."
    ),
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── API Routers ───────────────────────────────────────────────────────────────
app.include_router(auth_router,     prefix=f"{settings.API_V1_STR}/auth",     tags=["🔐 Authentication"])
app.include_router(profile_router,  prefix=f"{settings.API_V1_STR}/profile",  tags=["👤 Profile"])
app.include_router(resume_router,   prefix=f"{settings.API_V1_STR}/resume",   tags=["📄 Resume"])
app.include_router(analyzer_router, prefix=f"{settings.API_V1_STR}/analyzer", tags=["🤖 Resume Analyzer"])
app.include_router(ats_router,      prefix=f"{settings.API_V1_STR}/ats",      tags=["🎯 ATS Checker"])
app.include_router(coding_router,   prefix=f"{settings.API_V1_STR}/coding",   tags=["Coding Workspace"])

app.include_router(
    jobs_router,
    prefix=f"{settings.API_V1_STR}/jobs",
    tags=["Job Recommendations"],
)

app.include_router(
    analytics_router,
    prefix=f"{settings.API_V1_STR}/analytics",
    tags=["Placement Analytics"],
)

app.include_router(
    coding_interview_router,
    prefix=f"{settings.API_V1_STR}/coding-interviews",
    tags=["Coding Interview"],
)

app.include_router(
    system_design_router,
    prefix=f"{settings.API_V1_STR}/system-design",
    tags=["System Design Interview"],
)

app.include_router(
    communication_analysis_router,
    prefix=f"{settings.API_V1_STR}/communication-analysis",
    tags=["Communication Analysis"],
)

app.include_router(
    webcam_analysis_router,
    prefix="/api/webcam",
    tags=["Webcam Analysis"],
)

app.add_api_websocket_route("/ws/webcam-analysis/{session_id}", websocket_analysis)

app.include_router(
    stress_interview_router,
    prefix="/api/stress",
    tags=["Stress Interview"],
)

app.add_api_websocket_route("/ws/stress/{session_id}", websocket_stress)

app.include_router(
    interview_recording_router,
    prefix=f"{settings.API_V1_STR}/recordings",
    tags=["Interview Recording"],
)

app.include_router(
    skill_analysis_router,
    prefix=f"{settings.API_V1_STR}/skill-analysis",
    tags=["Skill Gap Analysis"],
)

app.include_router(
    learning_roadmap_router,
    prefix=f"{settings.API_V1_STR}/roadmaps",
    tags=["Personalized Learning Roadmap"],
)

app.include_router(
    companies_router,
    prefix=f"{settings.API_V1_STR}/companies",
    tags=["Companies"],
)

app.include_router(
    job_roles_router,
    prefix=f"{settings.API_V1_STR}/roles",
    tags=["Job Roles"],
)

app.include_router(
    interview_types_router,
    prefix=f"{settings.API_V1_STR}/interview-types",
    tags=["Interview Types"],
)

app.include_router(
    interview_router,
    prefix=f"{settings.API_V1_STR}/interviews",
    tags=["Interview Engine"],
)







@app.get("/health", tags=["Health"])
async def health_check():
    """Public API health check."""

    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "api_prefix": settings.API_V1_STR,
        "docs": f"{settings.API_V1_STR}/docs",
    }
