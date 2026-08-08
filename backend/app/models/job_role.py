from datetime import datetime
from typing import List
from pydantic import BaseModel


class JobRoleDocument(BaseModel):
    role_name: str
    role_code: str
    department: str
    description: str
    experience_level: str
    required_skills: List[str]
    interview_duration: int
    is_active: bool = True
    created_at: datetime
    updated_at: datetime