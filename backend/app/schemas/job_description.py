from datetime import datetime
from typing import List

from pydantic import BaseModel, Field, field_validator


class JobDescriptionParseRequest(BaseModel):
    job_description: str = Field(min_length=40, max_length=20_000, description="Raw job-description text to parse")

    @field_validator("job_description")
    @classmethod
    def normalize_description(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Job description must not be blank")
        return value


class JobDescriptionResponse(BaseModel):
    id: str
    skills: List[str]
    technologies: List[str]
    experience: List[str]
    responsibilities: List[str]
    qualifications: List[str]
    keywords: List[str]
    created_at: datetime
    updated_at: datetime
