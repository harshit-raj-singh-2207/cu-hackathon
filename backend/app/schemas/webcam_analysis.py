from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class WebcamSessionStart(BaseModel):
    interview_session_id: str = Field(..., min_length=1, description="ID of the interview session")


class WebcamSessionStop(BaseModel):
    session_id: str = Field(..., min_length=1, description="ID of the webcam analysis session")


class WebcamSessionResponse(BaseModel):
    id: str = Field(..., alias="id")
    user_id: str
    interview_session_id: str
    status: str
    camera_started_at: Optional[datetime] = None
    camera_stopped_at: Optional[datetime] = None
    duration: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class BodyLanguageAnalysisCreate(BaseModel):
    session_id: str = Field(..., min_length=1)
    timestamp: float = Field(..., ge=0, description="Relative timestamp in seconds")
    eye_contact_score: float = Field(..., ge=0, le=100)
    eye_contact_status: str = Field(..., min_length=1)
    smile_score: float = Field(..., ge=0, le=100)
    smile_detected: bool
    head_pose: str = Field(..., min_length=1)
    posture_score: float = Field(..., ge=0, le=100)
    hand_movement_score: float = Field(..., ge=0, le=100)
    attention_score: float = Field(..., ge=0, le=100)
    distraction_detected: bool
    confidence_score: float = Field(..., ge=0, le=100)
    face_visible: bool
    multiple_faces_detected: bool
    camera_off: bool
    frame_number: int = Field(..., ge=0)


class BodyLanguageAnalysisResponse(BaseModel):
    id: str
    session_id: str
    timestamp: float
    eye_contact_score: float
    eye_contact_status: str
    smile_score: float
    smile_detected: bool
    head_pose: str
    posture_score: float
    hand_movement_score: float
    attention_score: float
    distraction_detected: bool
    confidence_score: float
    face_visible: bool
    multiple_faces_detected: bool
    camera_off: bool
    frame_number: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TimelineEventCreate(BaseModel):
    event_type: str = Field(..., min_length=1)
    event_time: float = Field(..., ge=0)
    severity: str = Field(..., min_length=1)
    confidence: float = Field(..., ge=0, le=100)
    description: str = Field(..., min_length=1)


class TimelineEventResponse(BaseModel):
    id: str
    session_id: str
    event_type: str
    event_time: float
    severity: str
    confidence: float
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BodyLanguageSummaryResponse(BaseModel):
    id: str
    session_id: str
    average_eye_contact: float
    average_posture: float
    average_attention: float
    average_smile: float
    average_confidence: float
    total_distractions: int
    total_camera_off_events: int
    overall_score: float
    remarks: str
    recommendations: List[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WebcamReportResponse(BaseModel):
    session_id: str
    average_eye_contact: float
    average_posture: float
    average_attention: float
    average_smile: float
    average_confidence: float
    total_distractions: int
    total_camera_off_events: int
    overall_score: float
    remarks: str
    recommendations: List[str]
    timeline_summary: List[TimelineEventResponse]
    strengths: List[str]
    weaknesses: List[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WebcamHistoryResponse(BaseModel):
    items: List[WebcamSessionResponse]
    total: int
    page: int
    limit: int
