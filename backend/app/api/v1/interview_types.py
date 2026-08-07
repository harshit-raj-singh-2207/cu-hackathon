"""Interview type CRUD endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.api.deps import get_current_user
from app.database import get_database
from app.schemas.interview_type import (
    InterviewTypeCreate,
    InterviewTypeListResponse,
    InterviewTypeResponse,
    InterviewTypeUpdate,
)
from app.services.interview_type_service import InterviewTypeService


router = APIRouter()


def get_interview_type_service() -> InterviewTypeService:
    database = get_database()
    if database is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection is unavailable")
    return InterviewTypeService(database)


@router.get("/", response_model=InterviewTypeListResponse, summary="List interview types")
async def list_interview_types(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    service: InterviewTypeService = Depends(get_interview_type_service),
):
    items, total = await service.list(skip, limit)
    return {"items": items, "total": total}


@router.get("/{interview_type_id}", response_model=InterviewTypeResponse, summary="Get an interview type")
async def get_interview_type(interview_type_id: str, service: InterviewTypeService = Depends(get_interview_type_service)):
    return await service.get(interview_type_id)


@router.post("/", response_model=InterviewTypeResponse, status_code=status.HTTP_201_CREATED, summary="Create an interview type")
async def create_interview_type(
    payload: InterviewTypeCreate,
    service: InterviewTypeService = Depends(get_interview_type_service),
    _: dict = Depends(get_current_user),
):
    return await service.create(payload)


@router.put("/{interview_type_id}", response_model=InterviewTypeResponse, summary="Update an interview type")
async def update_interview_type(
    interview_type_id: str,
    payload: InterviewTypeUpdate,
    service: InterviewTypeService = Depends(get_interview_type_service),
    _: dict = Depends(get_current_user),
):
    return await service.update(interview_type_id, payload)


@router.delete("/{interview_type_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an interview type")
async def delete_interview_type(
    interview_type_id: str,
    service: InterviewTypeService = Depends(get_interview_type_service),
    _: dict = Depends(get_current_user),
):
    await service.delete(interview_type_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
