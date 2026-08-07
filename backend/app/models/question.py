"""MongoDB document definition for Question Bank records."""

from datetime import datetime
from typing import List

from pydantic import BaseModel


class QuestionDocument(BaseModel):
    question: str
    expected_answer: str
    difficulty: str
    topic: str
    keywords: List[str]
    company_id: str
    job_role_id: str
    interview_type_id: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
