"""Request and response schemas for the Question Bank API."""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

DifficultyLevel = Literal["Easy", "Medium", "Hard"]
InterviewType = Literal["Behavioral", "Technical DSA", "System Design"]


def _clean_text(value: str, field_name: str) -> str:
    value = " ".join(value.split())
    if not value:
        raise ValueError(f"{field_name} must not be blank")
    return value


class QuestionBase(BaseModel):
    question: str = Field(min_length=5, max_length=5000, examples=["How does dependency injection work in FastAPI?"])
    expected_answer: str = Field(min_length=1, max_length=10000)
    difficulty: DifficultyLevel
    topic: str = Field(min_length=2, max_length=200, examples=["FastAPI"])
    keywords: List[str] = Field(default_factory=list, max_length=50, examples=[["FastAPI", "dependency injection"]])
    company_id: str = Field(min_length=1)
    job_role_id: str = Field(min_length=1)
    interview_type_id: InterviewType
    is_active: bool = True

    @field_validator("question", "expected_answer", "topic", "company_id", "job_role_id")
    @classmethod
    def clean_text(cls, value: str, info) -> str:
        return _clean_text(value, info.field_name.replace("_", " ").capitalize())

    @field_validator("keywords")
    @classmethod
    def clean_keywords(cls, value: List[str]) -> List[str]:
        cleaned = list(dict.fromkeys(" ".join(item.split()) for item in value if item and item.strip()))
        if value and not cleaned:
            raise ValueError("Keywords must not contain only blank values")
        return cleaned


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    question: Optional[str] = Field(default=None, min_length=5, max_length=5000)
    expected_answer: Optional[str] = Field(default=None, min_length=1, max_length=10000)
    difficulty: Optional[DifficultyLevel] = None
    topic: Optional[str] = Field(default=None, min_length=2, max_length=200)
    keywords: Optional[List[str]] = Field(default=None, max_length=50)
    company_id: Optional[str] = Field(default=None, min_length=1)
    job_role_id: Optional[str] = Field(default=None, min_length=1)
    interview_type_id: Optional[InterviewType] = None
    is_active: Optional[bool] = None

    @field_validator("question", "expected_answer", "topic", "company_id", "job_role_id")
    @classmethod
    def clean_optional_text(cls, value: Optional[str], info) -> Optional[str]:
        return _clean_text(value, info.field_name.replace("_", " ").capitalize()) if value is not None else value

    @field_validator("keywords")
    @classmethod
    def clean_optional_keywords(cls, value: Optional[List[str]]) -> Optional[List[str]]:
        if value is None:
            return None
        cleaned = list(dict.fromkeys(" ".join(item.split()) for item in value if item and item.strip()))
        if value and not cleaned:
            raise ValueError("Keywords must not contain only blank values")
        return cleaned


class QuestionResponse(QuestionBase):
    id: str
    created_at: datetime
    updated_at: datetime


class QuestionListResponse(BaseModel):
    items: List[QuestionResponse]
    page: int
    limit: int
    total_records: int
    total_pages: int
