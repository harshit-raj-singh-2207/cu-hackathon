from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_user
from app.database import get_database
from app.controllers.system_design_controller import SystemDesignController
from app.schemas.system_design import (
    SystemDesignSessionCreate,
    SystemDesignSessionUpdate,
    SystemDesignSessionResponse,
    WhiteboardMetadataSave,
    WhiteboardMetadataResponse,
    ArchitectureNotesCreate,
    ArchitectureNotesUpdate,
    ArchitectureNotesResponse,
    DiagramMetadataCreate,
    DiagramMetadataUpdate,
    DiagramMetadataResponse,
    APIDesignCreate,
    APIDesignUpdate,
    APIDesignResponse,
    DatabaseDesignCreate,
    DatabaseDesignUpdate,
    DatabaseDesignResponse,
    ScalingDiscussionCreate,
    ScalingDiscussionUpdate,
    ScalingDiscussionResponse,
    EvaluationCriteriaSave,
    EvaluationCriteriaResponse,
    SessionRecordingMetadataSave,
    SessionRecordingMetadataResponse,
)

router = APIRouter()


def _controller() -> SystemDesignController:
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable",
        )
    return SystemDesignController(db)


# --- System Design Session ---
@router.post(
    "/sessions",
    response_model=SystemDesignSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new system design session",
)
async def create_session(
    payload: SystemDesignSessionCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.create_session(current_user["id"], payload)


@router.get(
    "/sessions/{session_id}",
    response_model=SystemDesignSessionResponse,
    summary="Retrieve details of a system design session",
)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.get_session(session_id, current_user["id"])


@router.get(
    "/sessions",
    summary="List all system design sessions for the user",
)
async def list_sessions(
    status: Optional[str] = Query(None, description="Filter by status (Pending, Active, Completed)"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (Easy, Medium, Hard)"),
    search: Optional[str] = Query(None, description="Search term for title or company"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort direction (asc or desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    items, total = await ctrl.list_sessions(
        user_id=current_user["id"],
        status=status,
        difficulty=difficulty,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.put(
    "/sessions/{session_id}",
    response_model=SystemDesignSessionResponse,
    summary="Update system design session fields",
)
async def update_session(
    session_id: str,
    payload: SystemDesignSessionUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.update_session(session_id, current_user["id"], payload)


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a system design session",
)
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    await ctrl.delete_session(session_id, current_user["id"])
    return None


# --- Whiteboard Metadata ---
@router.post(
    "/sessions/{session_id}/whiteboard",
    response_model=WhiteboardMetadataResponse,
    summary="Save whiteboard metadata for a session",
)
async def save_whiteboard(
    session_id: str,
    payload: WhiteboardMetadataSave,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.save_whiteboard(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/whiteboard",
    response_model=WhiteboardMetadataResponse,
    summary="Retrieve whiteboard metadata for a session",
)
async def get_whiteboard(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.get_whiteboard(session_id, current_user["id"])


# --- Architecture Notes ---
@router.post(
    "/sessions/{session_id}/architecture-notes",
    response_model=ArchitectureNotesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create architecture notes for a session",
)
async def create_architecture_note(
    session_id: str,
    payload: ArchitectureNotesCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.create_architecture_note(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/architecture-notes",
    response_model=List[ArchitectureNotesResponse],
    summary="Retrieve all architecture notes for a session",
)
async def list_architecture_notes(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.list_architecture_notes(session_id, current_user["id"])


@router.put(
    "/sessions/{session_id}/architecture-notes/{note_id}",
    response_model=ArchitectureNotesResponse,
    summary="Update architecture notes",
)
async def update_architecture_note(
    session_id: str,
    note_id: str,
    payload: ArchitectureNotesUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.update_architecture_note(session_id, note_id, current_user["id"], payload)


@router.delete(
    "/sessions/{session_id}/architecture-notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete architecture notes",
)
async def delete_architecture_note(
    session_id: str,
    note_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    await ctrl.delete_architecture_note(session_id, note_id, current_user["id"])
    return None


# --- Diagram Metadata ---
@router.post(
    "/sessions/{session_id}/diagrams",
    response_model=DiagramMetadataResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create diagram metadata for a session",
)
async def create_diagram(
    session_id: str,
    payload: DiagramMetadataCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.create_diagram(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/diagrams",
    response_model=List[DiagramMetadataResponse],
    summary="Retrieve all diagrams metadata for a session",
)
async def list_diagrams(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.list_diagrams(session_id, current_user["id"])


@router.put(
    "/sessions/{session_id}/diagrams/{diagram_id}",
    response_model=DiagramMetadataResponse,
    summary="Update diagram metadata",
)
async def update_diagram(
    session_id: str,
    diagram_id: str,
    payload: DiagramMetadataUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.update_diagram(session_id, diagram_id, current_user["id"], payload)


@router.delete(
    "/sessions/{session_id}/diagrams/{diagram_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete diagram metadata",
)
async def delete_diagram(
    session_id: str,
    diagram_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    await ctrl.delete_diagram(session_id, diagram_id, current_user["id"])
    return None


# --- API Design ---
@router.post(
    "/sessions/{session_id}/apis",
    response_model=APIDesignResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Document an API discussed in a session",
)
async def create_api_design(
    session_id: str,
    payload: APIDesignCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.create_api_design(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/apis",
    response_model=List[APIDesignResponse],
    summary="Retrieve all documented APIs in a session",
)
async def list_api_designs(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.list_api_designs(session_id, current_user["id"])


@router.put(
    "/sessions/{session_id}/apis/{api_design_id}",
    response_model=APIDesignResponse,
    summary="Update API design details",
)
async def update_api_design(
    session_id: str,
    api_design_id: str,
    payload: APIDesignUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.update_api_design(session_id, api_design_id, current_user["id"], payload)


@router.delete(
    "/sessions/{session_id}/apis/{api_design_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an API design",
)
async def delete_api_design(
    session_id: str,
    api_design_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    await ctrl.delete_api_design(session_id, api_design_id, current_user["id"])
    return None


# --- Database Design ---
@router.post(
    "/sessions/{session_id}/db-designs",
    response_model=DatabaseDesignResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Document a Database design discussed in a session",
)
async def create_db_design(
    session_id: str,
    payload: DatabaseDesignCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.create_db_design(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/db-designs",
    response_model=List[DatabaseDesignResponse],
    summary="Retrieve all documented DB designs in a session",
)
async def list_db_designs(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.list_db_designs(session_id, current_user["id"])


@router.put(
    "/sessions/{session_id}/db-designs/{db_design_id}",
    response_model=DatabaseDesignResponse,
    summary="Update DB design details",
)
async def update_db_design(
    session_id: str,
    db_design_id: str,
    payload: DatabaseDesignUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.update_db_design(session_id, db_design_id, current_user["id"], payload)


@router.delete(
    "/sessions/{session_id}/db-designs/{db_design_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a Database design",
)
async def delete_db_design(
    session_id: str,
    db_design_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    await ctrl.delete_db_design(session_id, db_design_id, current_user["id"])
    return None


# --- Scaling Discussion ---
@router.post(
    "/sessions/{session_id}/scalings",
    response_model=ScalingDiscussionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a scaling discussion topic",
)
async def create_scaling(
    session_id: str,
    payload: ScalingDiscussionCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.create_scaling(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/scalings",
    response_model=List[ScalingDiscussionResponse],
    summary="Retrieve all scaling discussion topics discussed in a session",
)
async def list_scalings(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.list_scalings(session_id, current_user["id"])


@router.put(
    "/sessions/{session_id}/scalings/{scaling_id}",
    response_model=ScalingDiscussionResponse,
    summary="Update scaling discussion topic",
)
async def update_scaling(
    session_id: str,
    scaling_id: str,
    payload: ScalingDiscussionUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.update_scaling(session_id, scaling_id, current_user["id"], payload)


@router.delete(
    "/sessions/{session_id}/scalings/{scaling_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a scaling discussion topic",
)
async def delete_scaling(
    session_id: str,
    scaling_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    await ctrl.delete_scaling(session_id, scaling_id, current_user["id"])
    return None


# --- Evaluation Criteria ---
@router.post(
    "/sessions/{session_id}/evaluation",
    response_model=EvaluationCriteriaResponse,
    summary="Save evaluation scores for a session",
)
async def save_evaluation(
    session_id: str,
    payload: EvaluationCriteriaSave,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.save_evaluation(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/evaluation",
    response_model=EvaluationCriteriaResponse,
    summary="Retrieve evaluation scores for a session",
)
async def get_evaluation(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.get_evaluation(session_id, current_user["id"])


# --- Session Recording Metadata ---
@router.post(
    "/sessions/{session_id}/recording",
    response_model=SessionRecordingMetadataResponse,
    summary="Save recording metadata for a session",
)
async def save_recording(
    session_id: str,
    payload: SessionRecordingMetadataSave,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.save_recording(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/recording",
    response_model=SessionRecordingMetadataResponse,
    summary="Retrieve recording metadata for a session",
)
async def get_recording(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: SystemDesignController = Depends(_controller),
):
    return await ctrl.get_recording(session_id, current_user["id"])
