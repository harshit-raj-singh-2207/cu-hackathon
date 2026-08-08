from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator

DifficultyLevel = Literal["Easy", "Medium", "Hard"]

class CompanyBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    logo: Optional[str] = Field(default=None, max_length=500)
    difficulty_level: DifficultyLevel
    interview_pattern: List[str] = Field(min_length=1, max_length=10)
    hr_round: str = Field(min_length=2, max_length=1000)
    technical_round: str = Field(min_length=2, max_length=1000)
    coding_round: str = Field(min_length=2, max_length=1000)
    behavioral_round: str = Field(min_length=2, max_length=1000)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value: raise ValueError("Company name must not be blank")
        return value

    @field_validator("interview_pattern")
    @classmethod
    def clean_pattern(cls, value: List[str]) -> List[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if not cleaned: raise ValueError("Interview pattern must contain at least one round")
        return cleaned

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    logo: Optional[str] = Field(default=None, max_length=500)
    difficulty_level: Optional[DifficultyLevel] = None
    interview_pattern: Optional[List[str]] = Field(default=None, min_length=1, max_length=10)
    hr_round: Optional[str] = Field(default=None, min_length=2, max_length=1000)
    technical_round: Optional[str] = Field(default=None, min_length=2, max_length=1000)
    coding_round: Optional[str] = Field(default=None, min_length=2, max_length=1000)
    behavioral_round: Optional[str] = Field(default=None, min_length=2, max_length=1000)

    @field_validator("name")
    @classmethod
    def clean_optional_name(cls, value: Optional[str]) -> Optional[str]:
        return " ".join(value.split()) if value is not None else value

class CompanyResponse(CompanyBase):
    id: str
    created_at: datetime
    updated_at: datetime

class CompanyListResponse(BaseModel):
    items: List[CompanyResponse]
    total: int