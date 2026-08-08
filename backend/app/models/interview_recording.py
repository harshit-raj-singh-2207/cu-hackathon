from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class RecordingStatus(str, Enum):
    CREATED = "CREATED"
    INITIALIZING = "INITIALIZING"
    RECORDING = "RECORDING"
    PAUSED = "PAUSED"
    RESUMED = "RESUMED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


class ReplayEventType(str, Enum):
    RECORDING_STARTED = "Recording Started"
    RECORDING_PAUSED = "Recording Paused"
    RECORDING_RESUMED = "Recording Resumed"
    RECORDING_STOPPED = "Recording Stopped"
    QUESTION_STARTED = "Question Started"
    ANSWER_STARTED = "Answer Started"
    ANSWER_ENDED = "Answer Ended"
    TRANSCRIPT_UPDATED = "Transcript Updated"
    BOOKMARK_ADDED = "Bookmark Added"
    MISTAKE_ADDED = "Mistake Added"
    AI_COMMENT_ADDED = "AI Comment Added"
    REPLAY_VIEWED = "Replay Viewed"



class InterviewRecordingDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    interview_session_id: str
    recording_status: RecordingStatus
    recording_type: str  # video, audio
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    transcript_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None  # in seconds
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ReplayEventDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    recording_id: str
    timestamp: float  # offset in seconds from start of recording
    event_type: ReplayEventType
    title: str
    description: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class MistakeMarkerDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    recording_id: str
    timestamp: float
    category: str  # Communication, Technical, Behavioral, Grammar, Confidence, Coding
    severity: str  # low, medium, high
    title: str
    description: str
    recommendation: str
    created_at: datetime


class AICommentDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    recording_id: str
    timestamp: float
    category: str
    comment: str
    importance: str  # low, medium, high
    created_at: datetime


class BookmarkDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    recording_id: str
    timestamp: float
    title: str
    note: Optional[str] = None
    created_at: datetime


class RecordingAnalyticsDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    recording_id: str
    total_events: int = 0
    mistake_count: int = 0
    bookmark_count: int = 0
    important_moments: int = 0
    average_response_time: float = 0.0
    session_duration: float = 0.0
    created_at: datetime
