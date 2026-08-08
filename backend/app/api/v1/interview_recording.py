from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_user
from app.database import get_database
from app.controllers.interview_recording_controller import InterviewRecordingController
from app.schemas.interview_recording import (
    InterviewRecordingCreate,
    InterviewRecordingUpdate,
    InterviewRecordingResponse,
    ReplayEventCreate,
    ReplayEventResponse,
    MistakeMarkerCreate,
    MistakeMarkerResponse,
    AICommentCreate,
    AICommentResponse,
    BookmarkCreate,
    BookmarkResponse,
    RecordingAnalyticsResponse,
)

router = APIRouter()


def _controller() -> InterviewRecordingController:
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable",
        )
    return InterviewRecordingController(db)


# --- Recording CRUD ---
@router.post(
    "",
    response_model=InterviewRecordingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new interview recording session",
)
async def create_recording(
    payload: InterviewRecordingCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.create_recording(current_user["id"], payload)


@router.get(
    "",
    summary="List all interview recordings for the user",
)
async def list_recordings(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    items, total = await ctrl.list_recordings(
        user_id=current_user["id"],
        page=page,
        limit=limit,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get(
    "/{recording_id}",
    response_model=InterviewRecordingResponse,
    summary="Retrieve interview recording details",
)
async def get_recording(
    recording_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.get_recording(recording_id, current_user["id"])


@router.patch(
    "/{recording_id}",
    response_model=InterviewRecordingResponse,
    summary="Update recording metadata and status",
)
async def update_recording(
    recording_id: str,
    payload: InterviewRecordingUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.update_recording(recording_id, current_user["id"], payload)


@router.delete(
    "/{recording_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete an interview recording",
)
async def delete_recording(
    recording_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    await ctrl.delete_recording(recording_id, current_user["id"])
    return None


# --- Replay summary ---
@router.get(
    "/{recording_id}/replay",
    summary="Retrieve the complete replay state for the UI player",
)
async def get_replay(
    recording_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    """Aggregates recording metadata, timeline events, mistake markers, bookmarks, and analytics."""
    recording = await ctrl.get_recording(recording_id, current_user["id"])
    events = await ctrl.get_events(recording_id, current_user["id"])
    mistakes = await ctrl.get_mistakes(recording_id, current_user["id"])
    comments = await ctrl.get_comments(recording_id, current_user["id"])
    bookmarks = await ctrl.get_bookmarks(recording_id, current_user["id"])
    analytics = await ctrl.get_analytics(recording_id, current_user["id"])

    return {
        "recording": recording,
        "events": events,
        "mistakes": mistakes,
        "comments": comments,
        "bookmarks": bookmarks,
        "analytics": analytics,
    }


# --- Timeline / Events ---
@router.post(
    "/{recording_id}/events",
    response_model=ReplayEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a replay/timeline event during the interview",
)
async def store_event(
    recording_id: str,
    payload: ReplayEventCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.store_event(recording_id, current_user["id"], payload)


@router.get(
    "/{recording_id}/events",
    response_model=List[ReplayEventResponse],
    summary="Retrieve chronological events for a recording",
)
async def get_events(
    recording_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.get_events(recording_id, current_user["id"])


# --- Mistakes ---
@router.post(
    "/{recording_id}/mistakes",
    response_model=MistakeMarkerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a candidate mistake marker",
)
async def store_mistake(
    recording_id: str,
    payload: MistakeMarkerCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.store_mistake(recording_id, current_user["id"], payload)


@router.get(
    "/{recording_id}/mistakes",
    response_model=List[MistakeMarkerResponse],
    summary="Retrieve all logged mistakes for a recording",
)
async def get_mistakes(
    recording_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.get_mistakes(recording_id, current_user["id"])


# --- AI Comments ---
@router.post(
    "/{recording_id}/comments",
    response_model=AICommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save an AI observation comment on the recording",
)
async def store_comment(
    recording_id: str,
    payload: AICommentCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.store_comment(recording_id, current_user["id"], payload)


@router.get(
    "/{recording_id}/comments",
    response_model=List[AICommentResponse],
    summary="Retrieve all AI comments for a recording",
)
async def get_comments(
    recording_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.get_comments(recording_id, current_user["id"])


# --- Bookmarks ---
@router.post(
    "/{recording_id}/bookmarks",
    response_model=BookmarkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a replay bookmark at a specific timestamp",
)
async def store_bookmark(
    recording_id: str,
    payload: BookmarkCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.store_bookmark(recording_id, current_user["id"], payload)


@router.get(
    "/{recording_id}/bookmarks",
    response_model=List[BookmarkResponse],
    summary="Retrieve all bookmarks for a recording",
)
async def get_bookmarks(
    recording_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.get_bookmarks(recording_id, current_user["id"])


@router.delete(
    "/bookmarks/{bookmark_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a bookmark by its ID",
)
async def delete_bookmark(
    bookmark_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    await ctrl.delete_bookmark(bookmark_id, current_user["id"])
    return None


# --- Analytics ---
@router.get(
    "/{recording_id}/analytics",
    response_model=RecordingAnalyticsResponse,
    summary="Retrieve aggregate replay analytics for a recording",
)
async def get_analytics(
    recording_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: InterviewRecordingController = Depends(_controller),
):
    return await ctrl.get_analytics(recording_id, current_user["id"])
