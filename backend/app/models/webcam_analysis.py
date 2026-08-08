from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class WebcamSessionDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    interview_session_id: str
    status: str  # e.g., "started", "stopped"
    camera_started_at: Optional[datetime] = None
    camera_stopped_at: Optional[datetime] = None
    duration: Optional[float] = None  # in seconds
    created_at: datetime
    updated_at: datetime


class BodyLanguageAnalysisDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    timestamp: float  # event/frame relative time in seconds
    eye_contact_score: float  # Range: 0-100
    eye_contact_status: str  # e.g. "Good", "Lost"
    smile_score: float  # Range: 0-100
    smile_detected: bool
    head_pose: str  # e.g., "Forward", "Left", "Right", "Down"
    posture_score: float  # Range: 0-100
    hand_movement_score: float  # Range: 0-100
    attention_score: float  # Range: 0-100
    distraction_detected: bool
    confidence_score: float  # Range: 0-100
    face_visible: bool
    multiple_faces_detected: bool
    camera_off: bool
    frame_number: int
    created_at: datetime


class BodyLanguageSummaryDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
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


class TimelineEventDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    event_type: str  # e.g., "Eye Contact Lost", "Slouching", etc.
    event_time: float  # timestamp in seconds
    severity: str  # e.g., "low", "medium", "high"
    confidence: float  # Range: 0-100
    description: str
    created_at: datetime
