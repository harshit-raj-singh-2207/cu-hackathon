"""JWT-protected student and administrator placement analytics endpoints."""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_user
from app.database import get_database
from app.schemas.analytics import DashboardEnvelope, PlacementAnalyticsResponse, ReadinessResponse, SkillGapResponse, Suggestion
from app.services.placement_analytics_service import PlacementAnalyticsService

router = APIRouter()
ADMIN_ROLES = {"admin", "placement_officer", "placement_cell"}


def _service() -> PlacementAnalyticsService:
    database = get_database()
    if database is None:
        raise HTTPException(status_code=500, detail="Database connection is unavailable")
    return PlacementAnalyticsService(database)


def _require_admin(user: dict) -> None:
    if str(user.get("role", "student")).casefold() not in ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Placement-cell or admin access is required")


def _filters(department: str | None, batch: str | None, graduation_year: int | None, course: str | None,
             date_from: str | None = None, date_to: str | None = None, job_role: str | None = None,
             company: str | None = None) -> dict[str, Any]:
    return {"department": department, "batch": batch, "graduation_year": graduation_year, "course": course,
            "date_from": date_from, "date_to": date_to, "job_role": job_role, "company": company}


@router.get("/placement", response_model=PlacementAnalyticsResponse, summary="Legacy student placement dashboard")
async def placement_dashboard(period_days: int = Query(30), current_user: dict = Depends(get_current_user)):
    try: return await _service().get_dashboard(current_user, period_days)
    except ValueError as exc: raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/readiness-score", response_model=ReadinessResponse, summary="Get placement readiness score")
async def readiness_score(current_user: dict = Depends(get_current_user)):
    return await _service().readiness(current_user)


@router.get("/skill-gap", response_model=SkillGapResponse, summary="Compare student skills with active jobs")
async def skill_gap(current_user: dict = Depends(get_current_user)):
    return await _service().skill_gap(current_user)


@router.get("/improvement-suggestions", response_model=list[Suggestion], summary="Get personalized improvement actions")
async def improvement_suggestions(current_user: dict = Depends(get_current_user)):
    return await _service().suggestions(current_user)


@router.get("/student-dashboard", response_model=DashboardEnvelope, summary="Get combined student analytics")
async def student_dashboard(current_user: dict = Depends(get_current_user)):
    return await _service().student_dashboard(current_user)


@router.get("/overview", summary="Get institution placement overview")
async def overview(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    return await _service().overview()


@router.get("/department-comparison", summary="Compare placement outcomes by department")
async def department_comparison(department: str | None = Query(None, max_length=100), batch: str | None = Query(None, max_length=30),
    graduation_year: int | None = Query(None, ge=2000, le=2200), course: str | None = Query(None, max_length=100),
    current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    return await _service().department_comparison(_filters(department, batch, graduation_year, course))


@router.get("/recruitment-funnel", summary="Get unique-student recruitment funnel")
async def recruitment_funnel(department: str | None = Query(None, max_length=100), batch: str | None = Query(None, max_length=30),
    graduation_year: int | None = Query(None, ge=2000, le=2200), course: str | None = Query(None, max_length=100),
    current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    return await _service().recruitment_funnel(_filters(department, batch, graduation_year, course))


@router.get("/admin-dashboard", response_model=DashboardEnvelope, summary="Get combined placement-cell analytics")
async def admin_dashboard(department: str | None = Query(None, max_length=100), batch: str | None = Query(None, max_length=30),
    graduation_year: int | None = Query(None, ge=2000, le=2200), course: str | None = Query(None, max_length=100),
    date_from: str | None = None, date_to: str | None = None, job_role: str | None = Query(None, max_length=100),
    company: str | None = Query(None, max_length=100), current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    return await _service().admin_dashboard(_filters(department, batch, graduation_year, course, date_from, date_to, job_role, company))
