from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator


# ─── Request Schemas ───────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Payload for user registration."""
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be blank")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 bytes")
        return v


class UserLogin(BaseModel):
    """JSON-based login payload (alternative to OAuth2 form)."""
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    """Payload to exchange a refresh token for a new access token."""
    refresh_token: str


# ─── Response Schemas ──────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """Safe public representation of a user — no password fields."""
    id: Optional[str] = None
    name: str
    email: EmailStr
    is_active: bool
    created_at: Optional[datetime] = None
    skills: Optional[List[str]] = []
    education: Optional[str] = None
    portfolio_links: Optional[List[str]] = []
    profile_image_url: Optional[str] = None
    resume_url: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT access token response."""
    access_token: str
    token_type: str = "bearer"


class TokenPair(BaseModel):
    """Access + refresh token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded JWT payload data."""
    email: Optional[str] = None


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
