from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.database import get_database
from app.schemas.job_description import JobDescriptionParseRequest, JobDescriptionResponse
from app.services.job_description_service import JobDescriptionService

router = APIRouter()


def get_job_description_service() -> JobDescriptionService:
    database = get_database()
    if database is None:
        raise HTTPException(status_code=500, detail="Database connection is unavailable")
    return JobDescriptionService(database)


@router.post("/parse", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED, summary="Parse a job description")
async def parse_job_description(payload: JobDescriptionParseRequest, current_user: dict = Depends(get_current_user), service: JobDescriptionService = Depends(get_job_description_service)):
    return await service.create(current_user["id"], payload)


@router.get("/{job_description_id}", response_model=JobDescriptionResponse, summary="Get a parsed job description")
async def get_job_description(job_description_id: str, current_user: dict = Depends(get_current_user), service: JobDescriptionService = Depends(get_job_description_service)):
    return await service.get(job_description_id, current_user["id"])
