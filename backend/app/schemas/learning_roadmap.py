from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.learning_roadmap import RoadmapType, RoadmapStatus, TaskType, TaskPriority


class LearningRoadmapCreate(BaseModel):
    analysis_id: Optional[str] = None
    goal_text: Optional[str] = None
    roadmap_type: RoadmapType = Field(RoadmapType.PLAN_30)
    start_date: Optional[datetime] = None


class GenerateRoadmapRequest(BaseModel):
    goal: str = Field(..., min_length=3, description="The user's career goal")


class LearningRoadmapUpdate(BaseModel):
    roadmap_name: Optional[str] = None
    status: Optional[RoadmapStatus] = None
    expected_completion: Optional[datetime] = None


class LearningRoadmapResponse(BaseModel):
    id: str = Field(..., alias="id")
    user_id: str
    analysis_id: Optional[str] = None
    goal_text: Optional[str] = None
    target_role: str
    roadmap_name: str
    roadmap_type: RoadmapType
    duration_days: int
    overall_progress: float
    status: RoadmapStatus
    start_date: Optional[datetime] = None
    expected_completion: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class RoadmapPhaseResponse(BaseModel):
    id: str
    roadmap_id: str
    phase_number: int
    title: str
    description: str
    estimated_days: int
    progress: float
    status: str
    order: int

    model_config = ConfigDict(from_attributes=True)


class LearningTaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    task_type: TaskType = Field(TaskType.STUDY)
    priority: TaskPriority = Field(TaskPriority.MEDIUM)
    estimated_time: str = Field("2 hours")
    difficulty: str = Field("Intermediate")


class LearningTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # pending, in_progress, completed
    priority: Optional[TaskPriority] = None


class LearningTaskResponse(BaseModel):
    id: str
    phase_id: str
    title: str
    description: str
    task_type: TaskType
    priority: TaskPriority
    estimated_time: str
    difficulty: str
    status: str
    completed_at: Optional[datetime] = None
    order: int

    model_config = ConfigDict(from_attributes=True)


class ProjectRecommendationCreate(BaseModel):
    project_name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    difficulty: str = Field("Intermediate")
    estimated_duration: str = Field("1 week")
    skills_covered: List[str] = Field(default_factory=list)


class ProjectRecommendationResponse(BaseModel):
    id: str
    roadmap_id: str
    project_name: str
    description: str
    difficulty: str
    estimated_duration: str
    skills_covered: List[str]
    status: str

    model_config = ConfigDict(from_attributes=True)


class AssessmentCreate(BaseModel):
    title: str = Field(..., min_length=1)
    assessment_type: str = Field("Quiz")
    passing_score: float = Field(70.0, ge=0, le=100)


class AssessmentResponse(BaseModel):
    id: str
    roadmap_id: str
    title: str
    assessment_type: str
    passing_score: float
    attempts: int
    status: str

    model_config = ConfigDict(from_attributes=True)


class ProgressTrackerResponse(BaseModel):
    id: str
    roadmap_id: str
    completed_tasks: int
    pending_tasks: int
    completion_percentage: float
    study_hours: float
    last_activity: Optional[datetime] = None
    current_streak: int

    model_config = ConfigDict(from_attributes=True)
