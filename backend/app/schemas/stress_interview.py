from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.stress_interview import PressureLevel


class StressSessionStart(BaseModel):
    interview_session_id: str = Field(..., min_length=1)
    pressure_level: PressureLevel = PressureLevel.MEDIUM
    challenge_mode: bool = False
    rapid_question_mode: bool = False
    interrupt_mode: bool = False
    counter_question_mode: bool = False
    time_limit_seconds: int = Field(30, ge=5, le=300)


class StressSessionConfigure(BaseModel):
    session_id: str = Field(..., min_length=1)
    pressure_level: Optional[PressureLevel] = None
    challenge_mode: Optional[bool] = None
    rapid_question_mode: Optional[bool] = None
    interrupt_mode: Optional[bool] = None
    counter_question_mode: Optional[bool] = None
    time_limit_seconds: Optional[int] = Field(None, ge=5, le=300)


class StressSessionResponse(BaseModel):
    id: str = Field(..., alias="id")
    user_id: str
    interview_session_id: str
    mode_enabled: bool
    pressure_level: PressureLevel
    challenge_mode: bool
    rapid_question_mode: bool
    interrupt_mode: bool
    counter_question_mode: bool
    time_limit_seconds: int
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class StressEventCreate(BaseModel):
    session_id: str = Field(..., min_length=1)
    event_type: str = Field(..., min_length=1)
    event_time: float = Field(..., ge=0)
    question_id: Optional[str] = None
    candidate_response_time: Optional[float] = Field(None, ge=0)
    interrupt_triggered: bool = False
    followup_generated: bool = False
    counter_question_generated: bool = False
    difficulty_level: str = "Medium"
    severity: str = "medium"
    notes: Optional[str] = None


class StressEventResponse(BaseModel):
    id: str
    session_id: str
    event_type: str
    event_time: float
    question_id: Optional[str] = None
    candidate_response_time: Optional[float] = None
    interrupt_triggered: bool
    followup_generated: bool
    counter_question_generated: bool
    difficulty_level: str
    severity: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StressReportResponse(BaseModel):
    session_id: str
    total_interruptions: int
    rapid_questions: int
    counter_questions: int
    average_response_time: float
    long_pauses: int
    hesitation_count: int
    recovery_time: float
    calmness_score: float
    stress_score: float
    pressure_handling_score: float
    confidence_under_pressure: float
    overall_rating: str
    recommendations: List[str]
    timeline_summary: List[StressEventResponse]
    strengths: List[str]
    weaknesses: List[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StressHistoryResponse(BaseModel):
    items: List[StressSessionResponse]
    total: int
    page: int
    limit: int
