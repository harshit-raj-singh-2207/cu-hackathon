from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class PressureLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    EXTREME = "Extreme"


class StressSessionStatus(str, Enum):
    STARTED = "started"
    STOPPED = "stopped"
    ACTIVE = "Active"
    COMPLETED = "Completed"


class StressSessionDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    user_id: str
    interview_session_id: str
    mode_enabled: bool = True
    pressure_level: PressureLevel = PressureLevel.MEDIUM
    challenge_mode: bool = False
    rapid_question_mode: bool = False
    interrupt_mode: bool = False
    counter_question_mode: bool = False
    time_limit_seconds: int = 30  # response time limit
    status: str = "started"  # e.g., "started", "stopped", "Active", "Completed"
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class StressEventDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    event_type: str  # e.g., "Question Interrupted", "Long Pause", etc.
    event_time: float  # relative timestamp in seconds
    question_id: Optional[str] = None
    candidate_response_time: Optional[float] = None
    interrupt_triggered: bool = False
    followup_generated: bool = False
    counter_question_generated: bool = False
    difficulty_level: str = "Medium"  # e.g. "Easy", "Medium", "Hard"
    severity: str = "medium"  # e.g. "low", "medium", "high"
    notes: Optional[str] = None
    created_at: datetime


class StressMetricsDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    total_interruptions: int = 0
    rapid_questions: int = 0  # also maps to total_followups
    counter_questions: int = 0  # also maps to total_counter_questions
    average_response_time: float = 0.0
    long_pauses: int = 0
    hesitation_count: int = 0
    recovery_time: float = 0.0
    calmness_score: float = 100.0  # 0-100
    stress_score: float = 0.0  # 0-100
    pressure_handling_score: float = 0.0  # 0-100
    confidence_under_pressure: float = 0.0  # 0-100
    overall_rating: str = "Good"
    recommendations: List[str] = Field(default_factory=list)
    created_at: datetime
