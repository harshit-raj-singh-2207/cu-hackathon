from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class CommunicationAnalysisDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    analysis_id: str
    interview_id: str
    session_id: str
    user_id: str
    speaking_speed: float  # e.g., words per minute
    grammar_score: float  # Range: 0-100
    confidence_score: float  # Range: 0-100
    clarity_score: float  # Range: 0-100
    pause_count: int
    filler_words: List[str]
    vocabulary_score: float  # Range: 0-100
    pronunciation_score: float  # Range: 0-100
    overall_score: float  # Range: 0-100
    remarks: str
    created_at: datetime
    updated_at: datetime
