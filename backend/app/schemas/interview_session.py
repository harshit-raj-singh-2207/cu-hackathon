"""Request and response schemas for interview-session APIs."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

from app.models.interview_session import InterviewSessionStatus

DifficultyLevel = Literal["Easy", "Medium", "Hard"]


class InterviewSessionBase(BaseModel):
    company_id: str = Field(min_length=1)
    job_role_id: str = Field(min_length=1)
    interview_type_id: str = Field(min_length=1)
    resume_id: Optional[str] = Field(default=None, min_length=1)
    job_description_id: Optional[str] = Field(default=None, min_length=1)
    interview_name: str = Field(min_length=2, max_length=200)
    difficulty: DifficultyLevel
    total_questions: int = Field(ge=1, le=500)
    duration_minutes: int = Field(ge=1, le=480)
    remaining_time: Optional[int] = Field(default=None, ge=0, le=480)
    score: Optional[float] = Field(default=None, ge=0, le=100)
    feedback_generated: bool = False

    @field_validator("company_id", "job_role_id", "interview_type_id", "resume_id", "job_description_id", "interview_name")
    @classmethod
    def normalize_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = " ".join(value.split())
        if not value:
            raise ValueError("Value must not be blank")
        return value


class InterviewSessionCreate(InterviewSessionBase):
    pass


class InterviewSessionUpdate(BaseModel):
    company_id: Optional[str] = Field(default=None, min_length=1)
    job_role_id: Optional[str] = Field(default=None, min_length=1)
    interview_type_id: Optional[str] = Field(default=None, min_length=1)
    resume_id: Optional[str] = Field(default=None, min_length=1)
    job_description_id: Optional[str] = Field(default=None, min_length=1)
    interview_name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    difficulty: Optional[DifficultyLevel] = None
    total_questions: Optional[int] = Field(default=None, ge=1, le=500)
    duration_minutes: Optional[int] = Field(default=None, ge=1, le=480)
    remaining_time: Optional[int] = Field(default=None, ge=0, le=480)
    score: Optional[float] = Field(default=None, ge=0, le=100)
    feedback_generated: Optional[bool] = None

    @field_validator("company_id", "job_role_id", "interview_type_id", "resume_id", "job_description_id", "interview_name")
    @classmethod
    def normalize_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = " ".join(value.split())
        if not value:
            raise ValueError("Value must not be blank")
        return value


class CurrentQuestionUpdate(BaseModel):
    current_question_index: int = Field(ge=0)


class RemainingTimeUpdate(BaseModel):
    remaining_time: int = Field(ge=0)


class AnsweredQuestionIncrement(BaseModel):
    increment: int = Field(default=1, ge=1)


class InterviewSessionResponse(BaseModel):
    session_id: str
    user_id: str
    company_id: str
    job_role_id: str
    interview_type_id: str
    resume_id: Optional[str]
    job_description_id: Optional[str]
    interview_name: str
    difficulty: DifficultyLevel
    total_questions: int
    answered_questions: int
    duration_minutes: int
    remaining_time: int
    current_question_index: int
    interview_status: InterviewSessionStatus
    score: Optional[float]
    percentage: float
    feedback_generated: bool
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class InterviewSessionListResponse(BaseModel):
    items: list[InterviewSessionResponse]
    total: int
    page: int
    page_size: int
