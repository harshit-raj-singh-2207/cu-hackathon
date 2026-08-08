from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_user
from app.database import get_database
from app.controllers.learning_roadmap_controller import LearningRoadmapController
from app.schemas.learning_roadmap import (
    LearningRoadmapCreate,
    LearningRoadmapUpdate,
    LearningRoadmapResponse,
    RoadmapPhaseResponse,
    LearningTaskCreate,
    LearningTaskUpdate,
    LearningTaskResponse,
    ProjectRecommendationCreate,
    ProjectRecommendationResponse,
    AssessmentCreate,
    AssessmentResponse,
    ProgressTrackerResponse,
    GenerateRoadmapRequest,
)

router = APIRouter()


def _controller() -> LearningRoadmapController:
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable",
        )
    return LearningRoadmapController(db)


# ============================================================
# IMPORTANT: Static routes MUST come before /{roadmap_id}
# to prevent FastAPI from matching them as path params.
# ============================================================


# --- AI Generation (Persistent) ---
@router.post(
    "/generate-from-goal",
    response_model=LearningRoadmapResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a persistent AI roadmap from a career goal and save to DB",
)
async def generate_roadmap_from_goal(
    payload: GenerateRoadmapRequest,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    """
    Query the LLM to generate a structured 4-week roadmap based on the user's
    career goal text, persist it to MongoDB with all Phases and Tasks, and
    return the saved LearningRoadmap object.
    """
    try:
        return await ctrl.generate_and_save_roadmap(current_user["id"], payload.goal)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI roadmap: {str(e)}",
        )


# --- Tasks (static path prefix, must come before /{roadmap_id}) ---
@router.post(
    "/phases/{phase_id}/tasks",
    response_model=LearningTaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new custom task to a roadmap phase",
)
async def create_task(
    phase_id: str,
    payload: LearningTaskCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.create_task(phase_id, current_user["id"], payload)


@router.get(
    "/phases/{phase_id}/tasks",
    response_model=List[LearningTaskResponse],
    summary="Retrieve all tasks in a roadmap phase",
)
async def get_tasks(
    phase_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.get_tasks(phase_id, current_user["id"])


@router.patch(
    "/tasks/{task_id}",
    response_model=LearningTaskResponse,
    summary="Update a task status or details (recalculates roadmap progress)",
)
async def update_task(
    task_id: str,
    payload: LearningTaskUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.update_task(task_id, current_user["id"], payload)


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task from a phase",
)
async def delete_task(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    await ctrl.delete_task(task_id, current_user["id"])
    return None


# --- Roadmap Core CRUD ---
@router.post(
    "",
    response_model=LearningRoadmapResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new learning roadmap from a skill analysis or goal",
)
async def create_roadmap(
    payload: LearningRoadmapCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.create_roadmap(current_user["id"], payload)


@router.get(
    "",
    summary="List all learning roadmaps for the current user",
)
async def list_roadmaps(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    items, total = await ctrl.list_roadmaps(
        user_id=current_user["id"],
        page=page,
        limit=limit,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get(
    "/{roadmap_id}",
    response_model=LearningRoadmapResponse,
    summary="Retrieve details of a learning roadmap",
)
async def get_roadmap(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.get_roadmap(roadmap_id, current_user["id"])


@router.patch(
    "/{roadmap_id}",
    response_model=LearningRoadmapResponse,
    summary="Update roadmap details and status",
)
async def update_roadmap(
    roadmap_id: str,
    payload: LearningRoadmapUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.update_roadmap(roadmap_id, current_user["id"], payload)


@router.delete(
    "/{roadmap_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a learning roadmap and cascade all its phases and tasks",
)
async def delete_roadmap(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    await ctrl.delete_roadmap(roadmap_id, current_user["id"])
    return None


# --- Phases ---
@router.get(
    "/{roadmap_id}/phases",
    response_model=List[RoadmapPhaseResponse],
    summary="Retrieve all phases for a learning roadmap",
)
async def get_phases(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.get_phases(roadmap_id, current_user["id"])


# --- Project Recommendations ---
@router.get(
    "/{roadmap_id}/projects",
    response_model=List[ProjectRecommendationResponse],
    summary="Retrieve recommended projects for a roadmap",
)
async def get_projects(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.get_projects(roadmap_id, current_user["id"])


@router.post(
    "/{roadmap_id}/projects",
    response_model=ProjectRecommendationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a recommended project to the roadmap",
)
async def create_project(
    roadmap_id: str,
    payload: ProjectRecommendationCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.create_project(roadmap_id, current_user["id"], payload)


# --- Assessments ---
@router.get(
    "/{roadmap_id}/assessments",
    response_model=List[AssessmentResponse],
    summary="Retrieve assessments for a learning roadmap",
)
async def get_assessments(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.get_assessments(roadmap_id, current_user["id"])


@router.post(
    "/{roadmap_id}/assessments",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an assessment milestone to the roadmap",
)
async def create_assessment(
    roadmap_id: str,
    payload: AssessmentCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.create_assessment(roadmap_id, current_user["id"], payload)


# --- Progress Tracker ---
@router.get(
    "/{roadmap_id}/progress",
    response_model=ProgressTrackerResponse,
    summary="Retrieve overall progress metrics for a learning roadmap",
)
async def get_progress(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.get_progress(roadmap_id, current_user["id"])


# --- Recalculation ---
@router.post(
    "/{roadmap_id}/recalculate",
    response_model=LearningRoadmapResponse,
    summary="Recalculate roadmap tasks based on a new Skill Gap Analysis",
)
async def recalculate_roadmap(
    roadmap_id: str,
    new_analysis_id: str = Query(..., description="ID of the new Skill Gap Analysis"),
    current_user: dict = Depends(get_current_user),
    ctrl: LearningRoadmapController = Depends(_controller),
):
    return await ctrl.recalculate_roadmap(roadmap_id, current_user["id"], new_analysis_id)
