from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CommunicationAnalysisCreate(BaseModel):
    interview_id: str = Field(..., min_length=1)
    session_id: str = Field(..., min_length=1)
    speaking_speed: float = Field(..., ge=0)
    grammar_score: float = Field(..., ge=0, le=100)
    confidence_score: float = Field(..., ge=0, le=100)
    clarity_score: float = Field(..., ge=0, le=100)
    pause_count: int = Field(..., ge=0)
    filler_words: List[str]
    vocabulary_score: float = Field(..., ge=0, le=100)
    pronunciation_score: float = Field(..., ge=0, le=100)
    overall_score: float = Field(..., ge=0, le=100)
    remarks: str


class CommunicationAnalysisUpdate(BaseModel):
    speaking_speed: Optional[float] = Field(None, ge=0)
    grammar_score: Optional[float] = Field(None, ge=0, le=100)
    confidence_score: Optional[float] = Field(None, ge=0, le=100)
    clarity_score: Optional[float] = Field(None, ge=0, le=100)
    pause_count: Optional[int] = Field(None, ge=0)
    filler_words: Optional[List[str]] = None
    vocabulary_score: Optional[float] = Field(None, ge=0, le=100)
    pronunciation_score: Optional[float] = Field(None, ge=0, le=100)
    overall_score: Optional[float] = Field(None, ge=0, le=100)
    remarks: Optional[str] = None


class CommunicationAnalysisResponse(BaseModel):
    analysis_id: str
    interview_id: str
    session_id: str
    user_id: str
    speaking_speed: float
    grammar_score: float
    confidence_score: float
    clarity_score: float
    pause_count: int
    filler_words: List[str]
    vocabulary_score: float
    pronunciation_score: float
    overall_score: float
    remarks: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommunicationAnalysisStatsResponse(BaseModel):
    average_speaking_speed: float
    average_confidence: float
    average_grammar: float
    average_clarity: float
    average_overall_score: float
    total_interviews: int
