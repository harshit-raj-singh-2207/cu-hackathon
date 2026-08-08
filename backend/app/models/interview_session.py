"""MongoDB document definition for interview-session records."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class InterviewSessionStatus(str, Enum):
    SCHEDULED = "Scheduled"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    PAUSED = "Paused"


class InterviewSessionDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    user_id: str
    company_id: str
    job_role_id: str
    interview_type_id: str
    resume_id: Optional[str] = None
    job_description_id: Optional[str] = None
    interview_name: str
    difficulty: str
    total_questions: int
    answered_questions: int = 0
    duration_minutes: int
    remaining_time: int
    current_question_index: int = 0
    interview_status: InterviewSessionStatus = InterviewSessionStatus.SCHEDULED
    score: Optional[float] = None
    percentage: float = 0
    feedback_generated: bool = False
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
