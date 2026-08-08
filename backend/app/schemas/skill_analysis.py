from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.skill_analysis import SkillLevel, SeverityLevel


class SkillScoreInput(BaseModel):
    skill_name: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    obtained_score: float = Field(..., ge=0)
    maximum_score: float = Field(..., gt=0)
    weight: float = Field(1.0, ge=0)
    confidence: float = Field(100.0, ge=0, le=100)
    remarks: str = Field("", description="Evaluator feedback")


class SkillAnalysisCreate(BaseModel):
    interview_session_id: str = Field(..., min_length=1)
    custom_scores: Optional[List[SkillScoreInput]] = None


class SkillAnalysisResponse(BaseModel):
    id: str = Field(..., alias="id")
    user_id: str
    interview_session_id: str
    overall_score: float
    overall_grade: str
    strength_score: float
    weakness_score: float
    readiness_score: float
    job_fit_score: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SkillScoreResponse(BaseModel):
    id: str
    analysis_id: str
    skill_name: str
    category: str
    obtained_score: float
    maximum_score: float
    percentage: float
    level: SkillLevel
    weight: float
    confidence: float
    remarks: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WeakSkillResponse(BaseModel):
    id: str
    analysis_id: str
    skill_name: str
    gap_percentage: float
    severity: SeverityLevel
    reason: str
    recommendation: str
    priority: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StrengthSkillResponse(BaseModel):
    id: str
    analysis_id: str
    skill_name: str
    percentage: float
    reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LearningRecommendationResponse(BaseModel):
    id: str
    analysis_id: str
    skill_name: str
    priority: int
    recommended_topics: List[str]
    recommended_projects: List[str]
    recommended_resources: List[str]
    estimated_duration: str
    difficulty: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CareerReadinessResponse(BaseModel):
    id: str
    analysis_id: str
    target_role: str
    readiness_percentage: float
    interview_readiness: float
    technical_readiness: float
    communication_readiness: float
    behavioral_readiness: float
    coding_readiness: float
    system_design_readiness: float
    overall_result: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
