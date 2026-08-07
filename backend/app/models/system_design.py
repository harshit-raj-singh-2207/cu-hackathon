from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class DifficultyLevel(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


class SessionStatus(str, Enum):
    PENDING = "Pending"
    ACTIVE = "Active"
    COMPLETED = "Completed"


class SystemDesignSessionDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    user_id: str
    interview_id: Optional[str] = None
    interview_title: str
    company: Optional[str] = None
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    status: SessionStatus = SessionStatus.PENDING
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration: int = 0  # In seconds
    created_at: datetime
    updated_at: datetime


class WhiteboardMetadataDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    whiteboard_id: str
    canvas_version: int = 1
    last_updated_time: datetime


class ArchitectureNotesDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    note_id: str
    session_id: str
    title: str
    description: str
    notes: str
    version: int = 1
    created_at: datetime
    updated_at: datetime


class DiagramMetadataDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    diagram_id: str
    session_id: str
    diagram_name: str
    diagram_type: str
    storage_path: str
    thumbnail_url: Optional[str] = None
    version: int = 1
    created_at: datetime
    updated_at: datetime


class APIDesignDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    api_design_id: str
    session_id: str
    api_name: str
    http_method: str
    endpoint: str
    description: str
    request_format: str
    response_format: str
    authentication_required: bool = True
    notes: str
    created_at: datetime
    updated_at: datetime


class DatabaseDesignDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    db_design_id: str
    session_id: str
    database_type: str
    collections_or_tables: str
    relationships: str
    primary_keys: str
    foreign_keys: str
    indexes: str
    notes: str
    created_at: datetime
    updated_at: datetime


class ScalingDiscussionDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    scaling_id: str
    session_id: str
    topic: str
    description: str
    pros: str
    cons: str
    notes: str
    created_at: datetime
    updated_at: datetime


class EvaluationCriteriaDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    architecture_score: float
    api_design_score: float
    database_design_score: float
    scalability_score: float
    communication_score: float
    overall_score: float
    reviewer_notes: str
    created_at: datetime
    updated_at: datetime


class SessionRecordingMetadataDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    recording_url: str
    transcript_url: str
    duration: int  # in seconds
    file_size: int  # in bytes
    recording_status: str
    created_at: datetime
    updated_at: datetime
