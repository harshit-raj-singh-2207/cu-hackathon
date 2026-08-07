from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class RoadmapType(str, Enum):
    CRASH_7 = "7-Day Crash Plan"
    PLAN_14 = "14-Day Plan"
    PLAN_30 = "30-Day Plan"
    PLAN_60 = "60-Day Plan"
    PLAN_90 = "90-Day Plan"
    CUSTOM = "Custom Roadmap"


class RoadmapStatus(str, Enum):
    DRAFT = "Draft"
    GENERATED = "Generated"
    ACTIVE = "Active"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    ARCHIVED = "Archived"


class TaskType(str, Enum):
    STUDY = "Study"
    PRACTICE = "Practice"
    CODING = "Coding"
    READING = "Reading"
    PROJECT = "Project"
    QUIZ = "Quiz"
    MOCK_INTERVIEW = "Mock Interview"
    REVISION = "Revision"
    ASSESSMENT = "Assessment"


class TaskPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class LearningRoadmapDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    analysis_id: Optional[str] = None
    goal_text: Optional[str] = None
    target_role: str
    roadmap_name: str
    roadmap_type: RoadmapType
    duration_days: int
    overall_progress: float = 0.0  # Percentage 0-100
    status: RoadmapStatus
    start_date: Optional[datetime] = None
    expected_completion: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class RoadmapPhaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    roadmap_id: str
    phase_number: int
    title: str
    description: str
    estimated_days: int
    progress: float = 0.0
    status: str = "pending"  # pending, in_progress, completed
    order: int


class LearningTaskDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    phase_id: str
    title: str
    description: str
    task_type: TaskType
    priority: TaskPriority
    estimated_time: str  # e.g., "2 hours"
    difficulty: str  # Beginner, Intermediate, Advanced
    status: str = "pending"  # pending, in_progress, completed
    completed_at: Optional[datetime] = None
    order: int


class LearningTopicDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    task_id: str
    topic_name: str
    skill_name: str
    importance: str  # e.g., High, Medium, Low
    estimated_hours: float
    status: str = "pending"  # pending, completed


class ProjectRecommendationDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    roadmap_id: str
    project_name: str
    description: str
    difficulty: str
    estimated_duration: str
    skills_covered: List[str]
    status: str = "pending"  # pending, completed


class AssessmentDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    roadmap_id: str
    title: str
    assessment_type: str  # Quiz, Challenge, Coding Test
    passing_score: float = 70.0
    attempts: int = 0
    status: str = "pending"  # pending, passed, failed


class ProgressTrackerDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    roadmap_id: str
    completed_tasks: int = 0
    pending_tasks: int = 0
    completion_percentage: float = 0.0
    study_hours: float = 0.0
    last_activity: Optional[datetime] = None
    current_streak: int = 0
