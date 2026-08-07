from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.interview_recording import RecordingStatus, ReplayEventType


class InterviewRecordingCreate(BaseModel):
    interview_session_id: str = Field(..., min_length=1)
    recording_type: str = Field(..., description="e.g. video, audio")
    recording_status: RecordingStatus = Field(RecordingStatus.CREATED)
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    transcript_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = Field(None, ge=0)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class InterviewRecordingUpdate(BaseModel):
    recording_status: Optional[RecordingStatus] = None
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    transcript_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = Field(None, ge=0)
    ended_at: Optional[datetime] = None


class InterviewRecordingResponse(BaseModel):
    id: str = Field(..., alias="id")
    user_id: str
    interview_session_id: str
    recording_status: RecordingStatus
    recording_type: str
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    transcript_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ReplayEventCreate(BaseModel):
    timestamp: float = Field(..., ge=0)
    event_type: ReplayEventType
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ReplayEventResponse(BaseModel):
    id: str
    recording_id: str
    timestamp: float
    event_type: ReplayEventType
    title: str
    description: str
    metadata: dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MistakeMarkerCreate(BaseModel):
    timestamp: float = Field(..., ge=0)
    category: str = Field(..., description="Communication, Technical, Behavioral, Grammar, Confidence, Coding")
    severity: str = Field(..., description="low, medium, high")
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    recommendation: str = Field(..., min_length=1)


class MistakeMarkerResponse(BaseModel):
    id: str
    recording_id: str
    timestamp: float
    category: str
    severity: str
    title: str
    description: str
    recommendation: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AICommentCreate(BaseModel):
    timestamp: float = Field(..., ge=0)
    category: str = Field(..., min_length=1)
    comment: str = Field(..., min_length=1)
    importance: str = Field(..., description="low, medium, high")


class AICommentResponse(BaseModel):
    id: str
    recording_id: str
    timestamp: float
    category: str
    comment: str
    importance: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookmarkCreate(BaseModel):
    timestamp: float = Field(..., ge=0)
    title: str = Field(..., min_length=1)
    note: Optional[str] = None


class BookmarkResponse(BaseModel):
    id: str
    recording_id: str
    timestamp: float
    title: str
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecordingAnalyticsResponse(BaseModel):
    id: str
    recording_id: str
    total_events: int
    mistake_count: int
    bookmark_count: int
    important_moments: int
    average_response_time: float
    session_duration: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
