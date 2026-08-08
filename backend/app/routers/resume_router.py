from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.api.deps import get_current_user
from app.database import get_database
from app.schemas.resume import ResumeDeleteResponse, ResumeUploadResponse
from app.services.resume_service import ResumeService

router = APIRouter()


def get_resume_service() -> ResumeService:
    database = get_database()
    if database is None:
        raise HTTPException(status_code=500, detail="Database connection is unavailable")
    return ResumeService(database)


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED, summary="Upload resume")
async def upload_resume(file: UploadFile = File(..., description="PDF or DOCX resume, maximum 5 MB"), current_user: dict = Depends(get_current_user), service: ResumeService = Depends(get_resume_service)):
    resume = await service.upload(current_user["id"], file)
    return {"message": "Resume uploaded successfully", "resume": resume}


@router.get("", response_class=FileResponse, summary="Retrieve current resume")
async def get_resume(current_user: dict = Depends(get_current_user), service: ResumeService = Depends(get_resume_service)):
    file_path, metadata = await service.get_file(current_user["id"])
    return FileResponse(path=file_path, filename=metadata["original_name"], media_type=metadata["file_type"])


@router.delete("", response_model=ResumeDeleteResponse, summary="Delete current resume")
async def delete_resume(current_user: dict = Depends(get_current_user), service: ResumeService = Depends(get_resume_service)):
    await service.delete(current_user["id"])
    return {"message": "Resume deleted successfully"}


@router.put("/replace", response_model=ResumeUploadResponse, summary="Replace current resume")
async def replace_resume(file: UploadFile = File(..., description="PDF or DOCX resume, maximum 5 MB"), current_user: dict = Depends(get_current_user), service: ResumeService = Depends(get_resume_service)):
    resume = await service.upload(current_user["id"], file, replace=True)
    return {"message": "Resume replaced successfully", "resume": resume}
