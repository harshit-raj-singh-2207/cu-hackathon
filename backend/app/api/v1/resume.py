import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from bson import ObjectId
from app.database import get_database, get_resumes_collection
from app.api.deps import get_current_user
from app.services import parser

router = APIRouter()

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Receive a resume file, validate type formats (PDF/DOCX), save on disk, and link MongoDB."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not supported. Upload only PDF or DOCX formats."
        )

    filename = f"{current_user['id']}_resume{ext}"
    upload_dir = os.path.join("static", "resumes")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save resume file on server: {e}"
        )

    db = get_database()

    resume_url = f"/static/resumes/{filename}"
    await db["users"].update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {
            "resume_url": resume_url,
            "resume_filename": file.filename
        }}
    )

    # ── Parse resume and save to `resumes` collection ──
    try:
        raw_text = parser.extract_text(file_path)
    except Exception as e:
        # If extraction fails, we still let the upload succeed but warn in logs
        raw_text = ""
        print(f"Failed to parse resume text: {e}")

    resumes_col = get_resumes_collection()
    await resumes_col.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "original_filename": file.filename,
            "raw_text": raw_text
        }},
        upsert=True
    )

    return {
        "message": "Resume uploaded successfully",
        "resume_url": resume_url,
        "resume_filename": file.filename
    }

@router.get("/download")
async def download_resume(current_user: dict = Depends(get_current_user)):
    """Fetch the resume location on disk and stream back as a download attachment."""
    db = get_database()

    user = await db["users"].find_one({"_id": ObjectId(current_user["id"])})
    if not user or not user.get("resume_url"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found for this user. Upload a resume first."
        )

    filename = os.path.basename(user["resume_url"])
    file_path = os.path.join("static", "resumes", filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file does not exist on disk"
        )

    original_name = user.get("resume_filename", "resume.pdf")
    return FileResponse(
        path=file_path,
        filename=original_name,
        media_type="application/octet-stream"
    )

@router.delete("/")
async def delete_resume(current_user: dict = Depends(get_current_user)):
    """Delete physical resume files from disk and reset database references to None."""
    db = get_database()

    user = await db["users"].find_one({"_id": ObjectId(current_user["id"])})
    if not user or not user.get("resume_url"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found to delete"
        )

    filename = os.path.basename(user["resume_url"])
    file_path = os.path.join("static", "resumes", filename)

    # Delete physical file from disk
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not remove resume file from disk: {e}"
            )

    # Reset database references
    await db["users"].update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {
            "resume_url": None,
            "resume_filename": None
        }}
    )

    return {"message": "Resume deleted successfully"}
