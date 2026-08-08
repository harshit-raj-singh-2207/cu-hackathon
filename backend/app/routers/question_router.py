"""Authenticated Question Bank endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.api.deps import get_current_user
from app.database import get_database
from app.schemas.question import DifficultyLevel, InterviewType, QuestionCreate, QuestionListResponse, QuestionResponse, QuestionUpdate
from app.services.question_service import QuestionService

router = APIRouter()


def get_question_service() -> QuestionService:
    database = get_database()
    if database is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection is unavailable")
    return QuestionService(database)


def _list_response(items: list[dict], total: int, total_pages: int, page: int, limit: int) -> dict:
    return {"items": items, "page": page, "limit": limit, "total_records": total, "total_pages": total_pages}


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED, summary="Create question")
async def create_question(payload: QuestionCreate, _: dict = Depends(get_current_user), service: QuestionService = Depends(get_question_service)):
    return await service.create(payload)


@router.get("", response_model=QuestionListResponse, summary="Get all questions")
async def get_all_questions(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), _: dict = Depends(get_current_user), service: QuestionService = Depends(get_question_service)):
    items, total, total_pages = await service.list(page=page, limit=limit)
    return _list_response(items, total, total_pages, page, limit)


@router.get("/search", response_model=QuestionListResponse, summary="Search questions")
async def search_questions(q: str = Query(..., min_length=1, description="Search question text, topic, or keywords"), page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), _: dict = Depends(get_current_user), service: QuestionService = Depends(get_question_service)):
    items, total, total_pages = await service.list(page=page, limit=limit, search=q)
    return _list_response(items, total, total_pages, page, limit)


@router.get("/filter", response_model=QuestionListResponse, summary="Filter questions")
async def filter_questions(company_id: Optional[str] = None, job_role_id: Optional[str] = None, interview_type_id: Optional[InterviewType] = None, difficulty: Optional[DifficultyLevel] = None, topic: Optional[str] = Query(default=None, min_length=1), page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), _: dict = Depends(get_current_user), service: QuestionService = Depends(get_question_service)):
    items, total, total_pages = await service.list(page=page, limit=limit, company_id=company_id, job_role_id=job_role_id, interview_type_id=interview_type_id, difficulty=difficulty, topic=topic)
    return _list_response(items, total, total_pages, page, limit)


@router.get("/{question_id}", response_model=QuestionResponse, summary="Get question by ID")
async def get_question(question_id: str, _: dict = Depends(get_current_user), service: QuestionService = Depends(get_question_service)):
    return await service.get(question_id)


@router.put("/{question_id}", response_model=QuestionResponse, summary="Update question")
async def update_question(question_id: str, payload: QuestionUpdate, _: dict = Depends(get_current_user), service: QuestionService = Depends(get_question_service)):
    return await service.update(question_id, payload)


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete question")
async def delete_question(question_id: str, _: dict = Depends(get_current_user), service: QuestionService = Depends(get_question_service)):
    await service.delete(question_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
