"""API request and response schema exports."""

from app.schemas.job import (
    JobApplicationCreate,
    JobApplicationResponse,
    JobApplicationStatusUpdate,
    JobCreate,
    JobRecommendationResponse,
    JobResponse,
    JobUpdate,
    PaginationMetadata,
    UserJobPreferenceCreate,
    UserJobPreferenceUpdate,
)
from app.schemas.analytics import PlacementAnalyticsResponse

__all__ = [
    "JobApplicationCreate",
    "JobApplicationResponse",
    "JobApplicationStatusUpdate",
    "JobCreate",
    "JobRecommendationResponse",
    "JobResponse",
    "JobUpdate",
    "PaginationMetadata",
    "UserJobPreferenceCreate",
    "UserJobPreferenceUpdate",
    "PlacementAnalyticsResponse",
]
