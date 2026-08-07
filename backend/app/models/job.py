"""MongoDB document models for job recommendations and applications."""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


def utc_now() -> datetime:
    """Return an aware UTC timestamp for MongoDB date fields."""
    return datetime.now(timezone.utc)


class WorkplaceType(str, Enum):
    """Supported workplace arrangements."""

    REMOTE = "remote"
    HYBRID = "hybrid"
    ONSITE = "onsite"


class EmploymentType(str, Enum):
    """Supported employment arrangements."""

    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    INTERNSHIP = "internship"
    CONTRACT = "contract"
    FREELANCE = "freelance"


class JobApplicationStatus(str, Enum):
    """Supported states in a user's job-application pipeline."""

    SAVED = "saved"
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    SELECTED = "selected"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class MongoDocument(BaseModel):
    """Base model matching the project's string-based MongoDB ID convention."""

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[str] = Field(default=None, alias="_id")


class JobDB(MongoDocument):
    """MongoDB representation of a job available for recommendation."""

    seed_key: str
    title: str
    normalized_title: str
    company: str
    normalized_company: str
    company_logo: Optional[str] = None
    company_logo_url: Optional[str] = None
    summary: str
    description: str
    location: str
    normalized_location: str
    city: str
    state: str
    country: str = "India"
    workplace_type: WorkplaceType
    employment_type: EmploymentType
    experience_level: str
    required_skills: list[str]
    preferred_skills: list[str] = Field(default_factory=list)
    normalized_skills: list[str] = Field(default_factory=list)
    missing_skill_suggestions: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    min_cgpa: Optional[float] = None
    min_experience: float = 0
    max_experience: float = 0
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    salary_period: Optional[str] = None
    eligibility_departments: list[str] = Field(default_factory=list)
    eligible_passing_years: list[int] = Field(default_factory=list)
    application_url: str
    application_deadline: Optional[datetime] = None
    openings: int = 1
    posted_at: datetime = Field(default_factory=utc_now)
    search_terms: list[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class JobApplicationDB(MongoDocument):
    """MongoDB representation of a user's interaction with a job."""

    user_id: str
    job_id: str
    status: JobApplicationStatus = JobApplicationStatus.APPLIED
    notes: Optional[str] = None
    resume_id: Optional[str] = None
    match_score_at_application: Optional[float] = None
    applied_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class UserJobPreferenceDB(MongoDocument):
    """MongoDB representation of a user's job recommendation preferences."""

    user_id: str
    preferred_roles: list[str] = Field(default_factory=list)
    preferred_companies: list[str] = Field(default_factory=list)
    preferred_locations: list[str] = Field(default_factory=list)
    preferred_workplace_types: list[WorkplaceType] = Field(default_factory=list)
    preferred_employment_types: list[EmploymentType] = Field(default_factory=list)
    expected_salary_min: Optional[float] = None
    expected_salary_max: Optional[float] = None
    experience_level: Optional[str] = None
    willing_to_relocate: bool = False
    preferred_skills: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
