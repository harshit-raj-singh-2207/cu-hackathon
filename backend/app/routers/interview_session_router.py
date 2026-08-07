from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.database import get_database
from app.schemas.interview_session import InterviewSessionCreate, InterviewSessionHistoryResponse, InterviewSessionResponse, InterviewSessionUpdate
from app.services.interview_session_service import InterviewSessionService

router = APIRouter()


def get_interview_session_service() -> InterviewSessionService:
    database = get_database()
    if database is None:
        raise HTTPException(status_code=500, detail="Database connection is unavailable")
    return InterviewSessionService(database)


@router.post("", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED, summary="Create an interview session")
async def create_session(payload: InterviewSessionCreate, current_user: dict = Depends(get_current_user), service: InterviewSessionService = Depends(get_interview_session_service)):
    return await service.create(current_user["id"], payload)


@router.get("", response_model=InterviewSessionHistoryResponse, summary="List interview sessions")
async def get_history(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), current_user: dict = Depends(get_current_user), service: InterviewSessionService = Depends(get_interview_session_service)):
    items, total = await service.history(current_user["id"], skip, limit)
    return {"items": items, "total": total}


@router.get("/{session_id}", response_model=InterviewSessionResponse, summary="Get interview session details")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user), service: InterviewSessionService = Depends(get_interview_session_service)):
    return await service.get(session_id, current_user["id"])


@router.patch("/{session_id}", response_model=InterviewSessionResponse, summary="Update a created interview session")
async def update_session(session_id: str, payload: InterviewSessionUpdate, current_user: dict = Depends(get_current_user), service: InterviewSessionService = Depends(get_interview_session_service)):
    return await service.update(session_id, current_user["id"], payload)


@router.post("/{session_id}/start", response_model=InterviewSessionResponse, summary="Start an interview session")
async def start_session(session_id: str, current_user: dict = Depends(get_current_user), service: InterviewSessionService = Depends(get_interview_session_service)):
    return await service.start(session_id, current_user["id"])


@router.post("/{session_id}/pause", response_model=InterviewSessionResponse, summary="Pause an interview session")
async def pause_session(session_id: str, current_user: dict = Depends(get_current_user), service: InterviewSessionService = Depends(get_interview_session_service)):
    return await service.pause(session_id, current_user["id"])


@router.post("/{session_id}/resume", response_model=InterviewSessionResponse, summary="Resume an interview session")
async def resume_session(session_id: str, current_user: dict = Depends(get_current_user), service: InterviewSessionService = Depends(get_interview_session_service)):
    return await service.resume(session_id, current_user["id"])


@router.post("/{session_id}/complete", response_model=InterviewSessionResponse, summary="Complete an interview session")
async def complete_session(session_id: str, current_user: dict = Depends(get_current_user), service: InterviewSessionService = Depends(get_interview_session_service)):
    return await service.complete(session_id, current_user["id"])


@router.delete("/{session_id}", response_model=InterviewSessionResponse, summary="Cancel an interview session")
async def cancel_session(session_id: str, current_user: dict = Depends(get_current_user), service: InterviewSessionService = Depends(get_interview_session_service)):
    return await service.cancel(session_id, current_user["id"])
