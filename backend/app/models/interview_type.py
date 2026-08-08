"""MongoDB document definition for interview type records."""

from datetime import datetime

from pydantic import BaseModel


class InterviewTypeDocument(BaseModel):
    name: str
    name_normalized: str
    description: str
    duration_minutes: int
    difficulty_level: str
    total_questions: int
    passing_score: int
    display_order: int
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
