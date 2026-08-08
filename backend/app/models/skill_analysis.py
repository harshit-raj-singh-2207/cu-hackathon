from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class SkillLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    EXPERT = "Expert"


class SeverityLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class SkillAnalysisDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    interview_session_id: str
    overall_score: float  # Range: 0-100
    overall_grade: str  # e.g., A, B, C, D
    strength_score: float
    weakness_score: float
    readiness_score: float
    job_fit_score: float
    created_at: datetime
    updated_at: datetime


class SkillScoreDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    analysis_id: str
    skill_name: str
    category: str  # Technical, Communication, Coding, System Design, etc.
    obtained_score: float
    maximum_score: float
    percentage: float  # Range: 0-100
    level: SkillLevel
    weight: float = 1.0
    confidence: float = 100.0  # Range: 0-100
    remarks: str
    created_at: datetime


class WeakSkillDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    analysis_id: str
    skill_name: str
    gap_percentage: float
    severity: SeverityLevel
    reason: str
    recommendation: str
    priority: int  # 1 (highest) to 5 (lowest)
    created_at: datetime


class StrengthSkillDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    analysis_id: str
    skill_name: str
    percentage: float
    reason: str
    created_at: datetime


class LearningRecommendationDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    analysis_id: str
    skill_name: str
    priority: int
    recommended_topics: List[str]
    recommended_projects: List[str]
    recommended_resources: List[str]
    estimated_duration: str  # e.g. "2 weeks"
    difficulty: str  # e.g., "Intermediate"
    status: str = "pending"  # pending, in-progress, completed
    created_at: datetime


class CareerReadinessDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    analysis_id: str
    target_role: str
    readiness_percentage: float
    interview_readiness: float
    technical_readiness: float
    communication_readiness: float
    behavioral_readiness: float
    coding_readiness: float
    system_design_readiness: float
    overall_result: str  # Ready, Almost Ready, Needs Development
    created_at: datetime
