from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class UserDB(BaseModel):
    """Schema representing the structure of a User record stored in MongoDB."""
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: str
    hashed_password: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Resume & profile extended fields
    skills: Optional[List[str]] = []
    education: Optional[str] = None
    portfolio_links: Optional[List[str]] = []
    profile_image_url: Optional[str] = None
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
