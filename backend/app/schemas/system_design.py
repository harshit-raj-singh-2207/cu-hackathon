from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.models.system_design import DifficultyLevel, SessionStatus


# --- Session ---
class SystemDesignSessionCreate(BaseModel):
    interview_title: str = Field(..., min_length=2, max_length=150)
    company: Optional[str] = Field(None, max_length=100)
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    interview_id: Optional[str] = None


class SystemDesignSessionUpdate(BaseModel):
    interview_title: Optional[str] = Field(None, min_length=2, max_length=150)
    company: Optional[str] = Field(None, max_length=100)
    difficulty: Optional[DifficultyLevel] = None
    status: Optional[SessionStatus] = None
    duration: Optional[int] = None


class SystemDesignSessionResponse(BaseModel):
    session_id: str
    user_id: str
    interview_id: Optional[str] = None
    interview_title: str
    company: Optional[str] = None
    difficulty: DifficultyLevel
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Whiteboard ---
class WhiteboardMetadataSave(BaseModel):
    whiteboard_id: str = Field(..., min_length=1)
    canvas_version: int = Field(default=1, ge=1)


class WhiteboardMetadataResponse(BaseModel):
    session_id: str
    whiteboard_id: str
    canvas_version: int
    last_updated_time: datetime

    class Config:
        from_attributes = True


# --- Architecture Notes ---
class ArchitectureNotesCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: str
    notes: str
    version: int = Field(default=1, ge=1)


class ArchitectureNotesUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    notes: Optional[str] = None
    version: Optional[int] = Field(None, ge=1)


class ArchitectureNotesResponse(BaseModel):
    note_id: str
    session_id: str
    title: str
    description: str
    notes: str
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Diagram Metadata ---
class DiagramMetadataCreate(BaseModel):
    diagram_name: str = Field(..., min_length=1, max_length=150)
    diagram_type: str
    storage_path: str = Field(..., min_length=1)
    thumbnail_url: Optional[str] = None
    version: int = Field(default=1, ge=1)


class DiagramMetadataUpdate(BaseModel):
    diagram_name: Optional[str] = Field(None, min_length=1, max_length=150)
    diagram_type: Optional[str] = None
    storage_path: Optional[str] = None
    thumbnail_url: Optional[str] = None
    version: Optional[int] = Field(None, ge=1)


class DiagramMetadataResponse(BaseModel):
    diagram_id: str
    session_id: str
    diagram_name: str
    diagram_type: str
    storage_path: str
    thumbnail_url: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- API Design ---
class APIDesignCreate(BaseModel):
    api_name: str = Field(..., min_length=1, max_length=150)
    http_method: str = Field(..., min_length=3, max_length=10)
    endpoint: str = Field(..., min_length=1)
    description: str
    request_format: str
    response_format: str
    authentication_required: bool = True
    notes: str


class APIDesignUpdate(BaseModel):
    api_name: Optional[str] = Field(None, min_length=1, max_length=150)
    http_method: Optional[str] = Field(None, min_length=3, max_length=10)
    endpoint: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    request_format: Optional[str] = None
    response_format: Optional[str] = None
    authentication_required: Optional[bool] = None
    notes: Optional[str] = None


class APIDesignResponse(BaseModel):
    api_design_id: str
    session_id: str
    api_name: str
    http_method: str
    endpoint: str
    description: str
    request_format: str
    response_format: str
    authentication_required: bool
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Database Design ---
class DatabaseDesignCreate(BaseModel):
    database_type: str = Field(..., min_length=1)
    collections_or_tables: str
    relationships: str
    primary_keys: str
    foreign_keys: str
    indexes: str
    notes: str


class DatabaseDesignUpdate(BaseModel):
    database_type: Optional[str] = Field(None, min_length=1)
    collections_or_tables: Optional[str] = None
    relationships: Optional[str] = None
    primary_keys: Optional[str] = None
    foreign_keys: Optional[str] = None
    indexes: Optional[str] = None
    notes: Optional[str] = None


class DatabaseDesignResponse(BaseModel):
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

    class Config:
        from_attributes = True


# --- Scaling Discussion ---
class ScalingDiscussionCreate(BaseModel):
    topic: str = Field(..., min_length=1, max_length=150)
    description: str
    pros: str
    cons: str
    notes: str


class ScalingDiscussionUpdate(BaseModel):
    topic: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    notes: Optional[str] = None


class ScalingDiscussionResponse(BaseModel):
    scaling_id: str
    session_id: str
    topic: str
    description: str
    pros: str
    cons: str
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Evaluation Criteria ---
class EvaluationCriteriaSave(BaseModel):
    architecture_score: float = Field(..., ge=0, le=100)
    api_design_score: float = Field(..., ge=0, le=100)
    database_design_score: float = Field(..., ge=0, le=100)
    scalability_score: float = Field(..., ge=0, le=100)
    communication_score: float = Field(..., ge=0, le=100)
    overall_score: float = Field(..., ge=0, le=100)
    reviewer_notes: str


class EvaluationCriteriaResponse(BaseModel):
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

    class Config:
        from_attributes = True


# --- Recording Metadata ---
class SessionRecordingMetadataSave(BaseModel):
    recording_url: str = Field(..., min_length=1)
    transcript_url: str = Field(..., min_length=1)
    duration: int = Field(..., ge=0)
    file_size: int = Field(..., ge=0)
    recording_status: str = Field(..., min_length=1)


class SessionRecordingMetadataResponse(BaseModel):
    session_id: str
    recording_url: str
    transcript_url: str
    duration: int
    file_size: int
    recording_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
