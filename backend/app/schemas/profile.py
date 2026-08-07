from typing import Optional, List
from pydantic import BaseModel, EmailStr

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    skills: Optional[List[str]] = None
    education: Optional[str] = None
    portfolio_links: Optional[List[str]] = None

class ProfileResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    skills: List[str] = []
    education: Optional[str] = ""
    portfolio_links: List[str] = []
    profile_image_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
        populate_by_name = True
