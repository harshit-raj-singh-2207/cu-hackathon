"""Pydantic request and response contracts for the job recommendation module."""

from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    field_validator,
    model_validator,
)

from app.models.job import EmploymentType, JobApplicationStatus, WorkplaceType


def _normalise_text_values(values: list[str]) -> list[str]:
    """Trim, remove empty values, and de-duplicate text while preserving order."""
    normalised: list[str] = []
    seen: set[str] = set()
    for value in values:
        cleaned = value.strip()
        key = cleaned.casefold()
        if cleaned and key not in seen:
            normalised.append(cleaned)
            seen.add(key)
    return normalised


def _as_utc(value: Optional[datetime]) -> Optional[datetime]:
    """Attach UTC to naive datetimes or convert aware datetimes to UTC."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class SchemaBase(BaseModel):
    """Shared Pydantic v2 configuration for API schemas."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class JobFields(SchemaBase):
    """Fields shared by job creation and persisted job responses."""

    title: str = Field(min_length=1, max_length=200)
    company: str = Field(min_length=1, max_length=200)
    company_logo: Optional[HttpUrl] = None
    description: str = Field(min_length=1)
    location: str = Field(min_length=1, max_length=200)
    workplace_type: WorkplaceType
    employment_type: EmploymentType
    required_skills: list[str] = Field(min_length=1)
    preferred_skills: list[str] = Field(default_factory=list)
    min_cgpa: Optional[float] = Field(default=None, ge=0, le=10)
    min_experience: float = Field(default=0, ge=0)
    salary_min: Optional[float] = Field(default=None, ge=0)
    salary_max: Optional[float] = Field(default=None, ge=0)
    salary_currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    salary_period: Optional[str] = Field(default=None, pattern=r"^(hour|month|year)$")
    eligibility_departments: list[str] = Field(default_factory=list)
    eligible_passing_years: list[int] = Field(default_factory=list)
    application_url: HttpUrl
    application_deadline: Optional[datetime] = None
    is_active: bool = True

    @field_validator("title", "company", "description", "location")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        """Reject required strings containing whitespace only."""
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("value must not be blank")
        return cleaned

    @field_validator("required_skills", "preferred_skills")
    @classmethod
    def normalise_skills(cls, values: list[str], info: Any) -> list[str]:
        """Normalise skills and ensure required skills remain non-empty."""
        normalised = _normalise_text_values(values)
        if info.field_name == "required_skills" and not normalised:
            raise ValueError("required_skills must contain at least one non-empty skill")
        return normalised

    @field_validator("eligibility_departments")
    @classmethod
    def normalise_departments(cls, values: list[str]) -> list[str]:
        """Trim and de-duplicate eligible department names."""
        return _normalise_text_values(values)

    @field_validator("eligible_passing_years")
    @classmethod
    def validate_passing_years(cls, values: list[int]) -> list[int]:
        """Reject invalid years and return a stable unique list."""
        if any(year < 1900 or year > 2200 for year in values):
            raise ValueError("eligible passing years must be between 1900 and 2200")
        return list(dict.fromkeys(values))

    @field_validator("salary_currency")
    @classmethod
    def normalise_currency(cls, value: Optional[str]) -> Optional[str]:
        """Normalise ISO-style salary currency codes to uppercase."""
        return value.strip().upper() if value is not None else None

    @field_validator("application_deadline")
    @classmethod
    def normalise_deadline(cls, value: Optional[datetime]) -> Optional[datetime]:
        """Store application deadlines as aware UTC datetimes."""
        return _as_utc(value)

    @model_validator(mode="after")
    def validate_salary_range(self) -> "JobFields":
        """Ensure complete, ordered salary data with currency and period metadata."""
        amounts = (self.salary_min, self.salary_max)
        if (amounts[0] is None) != (amounts[1] is None):
            raise ValueError("salary_min and salary_max must be provided together")
        if amounts[0] is not None and amounts[1] is not None and amounts[1] < amounts[0]:
            raise ValueError("salary_max must be greater than or equal to salary_min")
        if amounts[0] is not None and (self.salary_currency is None or self.salary_period is None):
            raise ValueError("salary_currency and salary_period are required with salary values")
        if amounts[0] is None and (self.salary_currency is not None or self.salary_period is not None):
            raise ValueError("salary values are required with salary_currency or salary_period")
        return self


class JobCreate(JobFields):
    """Payload used to create a job."""


class JobUpdate(SchemaBase):
    """Partial payload used to update an existing job."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    company: Optional[str] = Field(default=None, min_length=1, max_length=200)
    company_logo: Optional[HttpUrl] = None
    description: Optional[str] = Field(default=None, min_length=1)
    location: Optional[str] = Field(default=None, min_length=1, max_length=200)
    workplace_type: Optional[WorkplaceType] = None
    employment_type: Optional[EmploymentType] = None
    required_skills: Optional[list[str]] = None
    preferred_skills: Optional[list[str]] = None
    min_cgpa: Optional[float] = Field(default=None, ge=0, le=10)
    min_experience: Optional[float] = Field(default=None, ge=0)
    salary_min: Optional[float] = Field(default=None, ge=0)
    salary_max: Optional[float] = Field(default=None, ge=0)
    salary_currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    salary_period: Optional[str] = Field(default=None, pattern=r"^(hour|month|year)$")
    eligibility_departments: Optional[list[str]] = None
    eligible_passing_years: Optional[list[int]] = None
    application_url: Optional[HttpUrl] = None
    application_deadline: Optional[datetime] = None
    is_active: Optional[bool] = None

    @field_validator("title", "company", "description", "location")
    @classmethod
    def strip_optional_text(cls, value: Optional[str]) -> Optional[str]:
        """Trim supplied optional text fields and reject blank updates."""
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("value must not be blank")
        return cleaned

    @field_validator("required_skills", "preferred_skills")
    @classmethod
    def normalise_optional_skills(
        cls, values: Optional[list[str]], info: Any
    ) -> Optional[list[str]]:
        """Normalise supplied skill updates."""
        if values is None:
            return None
        normalised = _normalise_text_values(values)
        if info.field_name == "required_skills" and not normalised:
            raise ValueError("required_skills must contain at least one non-empty skill")
        return normalised

    @field_validator("eligibility_departments")
    @classmethod
    def normalise_optional_departments(
        cls, values: Optional[list[str]]
    ) -> Optional[list[str]]:
        """Normalise supplied department updates."""
        return None if values is None else _normalise_text_values(values)

    @field_validator("eligible_passing_years")
    @classmethod
    def validate_optional_years(cls, values: Optional[list[int]]) -> Optional[list[int]]:
        """Validate supplied passing-year updates."""
        if values is None:
            return None
        if any(year < 1900 or year > 2200 for year in values):
            raise ValueError("eligible passing years must be between 1900 and 2200")
        return list(dict.fromkeys(values))

    @field_validator("salary_currency")
    @classmethod
    def normalise_optional_currency(cls, value: Optional[str]) -> Optional[str]:
        """Normalise a supplied salary currency code."""
        return value.strip().upper() if value is not None else None

    @field_validator("application_deadline")
    @classmethod
    def normalise_optional_deadline(cls, value: Optional[datetime]) -> Optional[datetime]:
        """Normalise a supplied deadline to UTC."""
        return _as_utc(value)

    @model_validator(mode="after")
    def validate_supplied_salary_range(self) -> "JobUpdate":
        """Validate range ordering when both salary bounds are supplied."""
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_max < self.salary_min
        ):
            raise ValueError("salary_max must be greater than or equal to salary_min")
        return self


class JobResponse(JobFields):
    """Public representation of a stored job."""

    id: str
    created_at: datetime
    updated_at: datetime

    @field_validator("created_at", "updated_at")
    @classmethod
    def normalise_job_timestamps(cls, value: datetime) -> datetime:
        """Return job timestamps in UTC."""
        return _as_utc(value)  # type: ignore[return-value]


class UserJobPreferenceFields(SchemaBase):
    """Fields accepted when creating or updating job preferences."""

    preferred_roles: list[str] = Field(default_factory=list)
    preferred_companies: list[str] = Field(default_factory=list)
    preferred_locations: list[str] = Field(default_factory=list)
    preferred_workplace_types: list[WorkplaceType] = Field(default_factory=list)
    preferred_employment_types: list[EmploymentType] = Field(default_factory=list)
    expected_salary_min: Optional[float] = Field(default=None, ge=0)
    expected_salary_max: Optional[float] = Field(default=None, ge=0)
    experience_level: Optional[str] = None
    willing_to_relocate: bool = False
    preferred_skills: list[str] = Field(default_factory=list)

    @field_validator("preferred_roles", "preferred_companies", "preferred_locations", "preferred_skills")
    @classmethod
    def normalise_preference_text(cls, values: list[str]) -> list[str]:
        """Trim and de-duplicate free-text preference values."""
        return _normalise_text_values(values)


class UserJobPreferenceCreate(UserJobPreferenceFields):
    """Payload used to create a user's job preferences."""


class UserJobPreferenceUpdate(SchemaBase):
    """Partial payload used to update a user's job preferences."""

    preferred_roles: Optional[list[str]] = None
    preferred_companies: Optional[list[str]] = None
    preferred_locations: Optional[list[str]] = None
    preferred_workplace_types: Optional[list[WorkplaceType]] = None
    preferred_employment_types: Optional[list[EmploymentType]] = None
    expected_salary_min: Optional[float] = Field(default=None, ge=0)
    expected_salary_max: Optional[float] = Field(default=None, ge=0)
    experience_level: Optional[str] = None
    willing_to_relocate: Optional[bool] = None
    preferred_skills: Optional[list[str]] = None

    @field_validator("preferred_roles", "preferred_companies", "preferred_locations", "preferred_skills")
    @classmethod
    def normalise_optional_preference_text(
        cls, values: Optional[list[str]]
    ) -> Optional[list[str]]:
        """Normalise supplied free-text preference updates."""
        return None if values is None else _normalise_text_values(values)


class JobApplicationCreate(SchemaBase):
    """Payload used to save or apply to a job."""

    job_id: str = Field(min_length=1)
    status: JobApplicationStatus = JobApplicationStatus.APPLIED
    notes: Optional[str] = Field(default=None, max_length=2000)
    resume_id: Optional[str] = None

    @field_validator("job_id")
    @classmethod
    def strip_job_id(cls, value: str) -> str:
        """Reject a blank job identifier."""
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("job_id must not be blank")
        return cleaned


class JobApplicationStatusUpdate(SchemaBase):
    """Payload used to transition an application to another status."""

    status: JobApplicationStatus


class JobApplicationResponse(SchemaBase):
    """Public representation of a stored job application."""

    id: str
    user_id: str
    job_id: str
    status: JobApplicationStatus
    notes: Optional[str] = None
    resume_id: Optional[str] = None
    match_score_at_application: Optional[float] = Field(default=None, ge=0, le=100)
    applied_at: datetime
    updated_at: datetime

    @field_validator("applied_at", "updated_at")
    @classmethod
    def normalise_application_timestamps(cls, value: datetime) -> datetime:
        """Return application timestamps in UTC."""
        return _as_utc(value)  # type: ignore[return-value]


class PaginationMetadata(SchemaBase):
    """Metadata accompanying a paginated API response."""

    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_items: int = Field(ge=0)
    total_pages: int = Field(ge=0)
    has_next: bool
    has_previous: bool


class JobRecommendationResponse(SchemaBase):
    """A ranked job with the user's computed skill alignment."""

    job: JobResponse
    match_score: float = Field(ge=0, le=100)
    matched_skills: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)
    matched_preferred_skills: list[str] = Field(default_factory=list)
    eligibility_status: str = Field(pattern=r"^(eligible|ineligible)$")
    eligibility_reasons: list[str] = Field(default_factory=list)
    score_breakdown: dict[str, float]
    recommendation_reason: Optional[str] = None

    @field_validator(
        "matched_skills", "missing_required_skills", "matched_preferred_skills"
    )
    @classmethod
    def normalise_recommendation_skills(cls, values: list[str]) -> list[str]:
        """Normalise skill lists returned by the recommendation engine."""
        return _normalise_text_values(values)
