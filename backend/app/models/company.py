from datetime import datetime
from typing import List
from pydantic import BaseModel

class CompanyDocument(BaseModel):
    name: str
    name_normalized: str
    logo: str | None = None
    difficulty_level: str
    interview_pattern: List[str]
    hr_round: str
    technical_round: str
    coding_round: str
    behavioral_round: str
    created_at: datetime
    updated_at: datetime