from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_user
from app.database import get_database
from app.controllers.skill_analysis_controller import SkillAnalysisController
from app.schemas.skill_analysis import (
    SkillAnalysisCreate,
    SkillAnalysisResponse,
    SkillScoreResponse,
    WeakSkillResponse,
    StrengthSkillResponse,
    LearningRecommendationResponse,
    CareerReadinessResponse,
)

router = APIRouter()


def _controller() -> SkillAnalysisController:
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable",
        )
    return SkillAnalysisController(db)


@router.post(
    "",
    response_model=SkillAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new skill gap analysis for a session",
)
async def create_analysis(
    payload: SkillAnalysisCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: SkillAnalysisController = Depends(_controller),
):
    return await ctrl.create_analysis(current_user["id"], payload)


@router.get(
    "",
    summary="List all skill gap analyses for the current authenticated user",
)
async def list_analyses(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user),
    ctrl: SkillAnalysisController = Depends(_controller),
):
    items, total = await ctrl.list_analyses(
        user_id=current_user["id"],
        page=page,
        limit=limit,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get(
    "/user/{user_id}",
    summary="List all skill gap analyses for a specific user ID",
)
async def list_analyses_for_user(
    user_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user),
    ctrl: SkillAnalysisController = Depends(_controller),
):
    # Security check: User can access only their own data (unless admin/role checks implemented)
    if current_user["id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access another user's history",
        )
    items, total = await ctrl.list_analyses(
        user_id=user_id,
        page=page,
        limit=limit,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get(
    "/{analysis_id}",
    response_model=SkillAnalysisResponse,
    summary="Retrieve details of a skill analysis",
)
async def get_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SkillAnalysisController = Depends(_controller),
):
    return await ctrl.get_analysis(analysis_id, current_user["id"])


@router.delete(
    "/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a skill analysis and all cascade metrics",
)
async def delete_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SkillAnalysisController = Depends(_controller),
):
    await ctrl.delete_analysis(analysis_id, current_user["id"])
    return None


@router.get(
    "/{analysis_id}/scores",
    response_model=List[SkillScoreResponse],
    summary="Retrieve individual skill scores for an analysis",
)
async def get_scores(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SkillAnalysisController = Depends(_controller),
):
    return await ctrl.get_scores(analysis_id, current_user["id"])


@router.get(
    "/{analysis_id}/strengths",
    response_model=List[StrengthSkillResponse],
    summary="Retrieve strength skills for an analysis",
)
async def get_strengths(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SkillAnalysisController = Depends(_controller),
):
    return await ctrl.get_strengths(analysis_id, current_user["id"])


@router.get(
    "/{analysis_id}/weaknesses",
    response_model=List[WeakSkillResponse],
    summary="Retrieve weakness skills for an analysis",
)
async def get_weaknesses(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SkillAnalysisController = Depends(_controller),
):
    return await ctrl.get_weaknesses(analysis_id, current_user["id"])


@router.get(
    "/{analysis_id}/recommendations",
    response_model=List[LearningRecommendationResponse],
    summary="Retrieve learning path recommendations for weaknesses",
)
async def get_recommendations(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SkillAnalysisController = Depends(_controller),
):
    return await ctrl.get_recommendations(analysis_id, current_user["id"])


@router.get(
    "/{analysis_id}/career-readiness",
    response_model=CareerReadinessResponse,
    summary="Retrieve career readiness metrics for an analysis",
)
async def get_readiness(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SkillAnalysisController = Depends(_controller),
):
    return await ctrl.get_readiness(analysis_id, current_user["id"])
