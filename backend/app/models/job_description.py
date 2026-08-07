from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class JobDescriptionDocument(BaseModel):
    """MongoDB document for one user-submitted, parsed job description."""

    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    raw_text: str
    skills: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
