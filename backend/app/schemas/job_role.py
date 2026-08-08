from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator

ExperienceLevel = Literal["Fresher", "Junior", "Mid", "Senior", "Lead"]
SortField = Literal["role_name", "created_at", "updated_at"]
SortOrder = Literal["asc", "desc"]

class JobRoleBase(BaseModel):
    role_name: str = Field(min_length=2, max_length=100, examples=["Backend Developer"])
    role_category: str = Field(min_length=2, max_length=100, examples=["Engineering"])
    required_skills: List[str] = Field(min_length=1, max_length=50, examples=[["Python", "REST APIs"]])
    preferred_skills: List[str] = Field(default_factory=list, max_length=50)
    programming_languages: List[str] = Field(default_factory=list, max_length=30)
    frameworks: List[str] = Field(default_factory=list, max_length=30)
    databases: List[str] = Field(default_factory=list, max_length=30)
    interview_topics: List[str] = Field(min_length=1, max_length=50, examples=[["API design", "Authentication"]])
    experience_level: ExperienceLevel = Field(examples=["Junior"])
    expected_duration: str = Field(min_length=2, max_length=100, examples=["45-60 minutes"])
    is_active: bool = True

    @field_validator("role_name", "role_category", "expected_duration")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value: raise ValueError("Value must not be blank")
        return value

    @field_validator("required_skills", "preferred_skills", "programming_languages", "frameworks", "databases", "interview_topics")
    @classmethod
    def validate_lists(cls, value: List[str]) -> List[str]:
        cleaned = list(dict.fromkeys(item.strip() for item in value if item and item.strip()))
        if value and not cleaned: raise ValueError("List values must not be empty")
        return cleaned

class JobRoleCreate(JobRoleBase): pass

class JobRoleUpdate(BaseModel):
    role_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    role_category: Optional[str] = Field(default=None, min_length=2, max_length=100)
    required_skills: Optional[List[str]] = Field(default=None, min_length=1, max_length=50)
    preferred_skills: Optional[List[str]] = Field(default=None, max_length=50)
    programming_languages: Optional[List[str]] = Field(default=None, max_length=30)
    frameworks: Optional[List[str]] = Field(default=None, max_length=30)
    databases: Optional[List[str]] = Field(default=None, max_length=30)
    interview_topics: Optional[List[str]] = Field(default=None, min_length=1, max_length=50)
    experience_level: Optional[ExperienceLevel] = None
    expected_duration: Optional[str] = Field(default=None, min_length=2, max_length=100)
    is_active: Optional[bool] = None

    @field_validator("role_name", "role_category", "expected_duration")
    @classmethod
    def validate_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None: return None
        value = " ".join(value.split())
        if not value: raise ValueError("Value must not be blank")
        return value

    @field_validator("required_skills", "preferred_skills", "programming_languages", "frameworks", "databases", "interview_topics")
    @classmethod
    def validate_optional_lists(cls, value: Optional[List[str]]) -> Optional[List[str]]:
        if value is None: return None
        cleaned = list(dict.fromkeys(item.strip() for item in value if item and item.strip()))
        if value and not cleaned: raise ValueError("List values must not be empty")
        return cleaned

class JobRoleResponse(JobRoleBase):
    role_id: str
    created_at: datetime
    updated_at: datetime

class JobRoleListResponse(BaseModel):
    items: List[JobRoleResponse]
    total: int
    page: int
    page_size: int