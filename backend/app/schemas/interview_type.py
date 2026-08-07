"""Request and response schemas for interview type APIs."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


DifficultyLevel = Literal["Easy", "Medium", "Hard"]


class InterviewTypeBase(BaseModel):
    name: str = Field(min_length=2, max_length=100, examples=["Technical Interview"])
    description: str = Field(min_length=2, max_length=2000)
    duration_minutes: int = Field(ge=1, le=480, examples=[60])
    difficulty_level: DifficultyLevel
    total_questions: int = Field(ge=1, le=500, examples=[10])
    passing_score: int = Field(ge=0, le=100, examples=[60])
    display_order: int = Field(ge=0, le=10000, examples=[1])
    is_active: bool = True

    @field_validator("name", "description")
    @classmethod
    def clean_text(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value:
            raise ValueError("Value must not be blank")
        return value


class InterviewTypeCreate(InterviewTypeBase):
    pass


class InterviewTypeUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, min_length=2, max_length=2000)
    duration_minutes: Optional[int] = Field(default=None, ge=1, le=480)
    difficulty_level: Optional[DifficultyLevel] = None
    total_questions: Optional[int] = Field(default=None, ge=1, le=500)
    passing_score: Optional[int] = Field(default=None, ge=0, le=100)
    display_order: Optional[int] = Field(default=None, ge=0, le=10000)
    is_active: Optional[bool] = None

    @field_validator("name", "description")
    @classmethod
    def clean_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = " ".join(value.split())
        if not value:
            raise ValueError("Value must not be blank")
        return value


class InterviewTypeResponse(InterviewTypeBase):
    id: str
    created_at: datetime
    updated_at: datetime


class InterviewTypeListResponse(BaseModel):
    items: list[InterviewTypeResponse]
    total: int
