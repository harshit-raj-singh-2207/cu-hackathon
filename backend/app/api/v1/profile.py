import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from bson import ObjectId
from app.database import get_database
from app.schemas.profile import ProfileUpdate, ProfileResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=ProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Retrieve details for the logged-in user profile."""
    return current_user

@router.put("/", response_model=ProfileResponse)
async def update_profile(
    profile_in: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update profile attributes like name, technical skills, and education info in MongoDB."""
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable"
        )

    update_data = {}
    if profile_in.name is not None:
        update_data["name"] = profile_in.name
    if profile_in.skills is not None:
        update_data["skills"] = profile_in.skills
    if profile_in.education is not None:
        update_data["education"] = profile_in.education
    if profile_in.portfolio_links is not None:
        update_data["portfolio_links"] = profile_in.portfolio_links

    if update_data:
        # Update user document in MongoDB using ObjectID mapping
        await db["users"].update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": update_data}
        )
        # Update current user state values to return correct response
        for key, val in update_data.items():
            current_user[key] = val

    return current_user

@router.post("/image", response_model=ProfileResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Receive a profile picture file, store it locally on disk, and update MongoDB links."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension not supported. Upload only JPG or PNG files."
        )

    # Use user ID as the filename to prevent file naming collisions
    filename = f"{current_user['id']}{ext}"
    upload_dir = os.path.join("static", "uploads")
    
    # Ensure directory folder exists
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not store image file on server: {e}"
        )

    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable"
        )

    image_url = f"/static/uploads/{filename}"
    await db["users"].update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"profile_image_url": image_url}}
    )

    current_user["profile_image_url"] = image_url
    return current_user
