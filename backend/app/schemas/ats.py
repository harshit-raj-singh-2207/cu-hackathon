from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Sub-schemas
# ---------------------------------------------------------------------------

class KeywordMatch(BaseModel):
    """A single keyword from the job description, with its match status."""
    keyword: str = Field(..., description="Keyword or skill from the job description")
    found: bool = Field(..., description="True if the keyword was found in the resume")
    context: Optional[str] = Field(
        None,
        description="Short excerpt from the resume showing where the keyword was matched"
    )


class SectionScore(BaseModel):
    """ATS score breakdown for a specific resume section."""
    section: str = Field(..., description="Section name, e.g. 'Skills', 'Experience'")
    score: int = Field(..., ge=0, le=100, description="Section-level ATS score (0–100)")
    feedback: Optional[str] = Field(None, description="Specific feedback for this section")


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class ATSCheckRequest(BaseModel):
    """
    Request body for POST /ats/check.
    The job description is required — ATS checking is always JD-driven.
    """
    job_description: str = Field(
        ...,
        min_length=50,
        max_length=8000,
        description="Full text of the job description to match the resume against"
    )
    job_title: Optional[str] = Field(
        None,
        max_length=120,
        description="Job title for display purposes, e.g. 'Senior Backend Engineer'"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "job_title": "Senior Backend Engineer",
                "job_description": "We are looking for a Python developer with FastAPI, "
                                   "Docker, and PostgreSQL experience..."
            }
        }


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ATSCheckResponse(BaseModel):
    """
    Full ATS compatibility report returned by POST /ats/check.
    Measures how well the resume matches a specific job description.
    """

    # ── Overall result ───────────────────────────────────────────────────────
    overall_score: int = Field(
        ..., ge=0, le=100,
        description="Overall ATS match score (0–100)"
    )
    match_level: str = Field(
        ...,
        description="Human-readable match tier: 'Excellent', 'Good', 'Fair', or 'Poor'"
    )
    job_title: Optional[str] = Field(
        None,
        description="The job title this report was generated against"
    )

    # ── Keyword analysis ─────────────────────────────────────────────────────
    keyword_matches: List[KeywordMatch] = Field(
        default_factory=list,
        description="Per-keyword breakdown of what was found vs. missing"
    )
    matched_count: int = Field(
        0,
        description="Number of JD keywords found in the resume"
    )
    total_keywords: int = Field(
        0,
        description="Total number of keywords extracted from the job description"
    )
    match_percentage: float = Field(
        0.0, ge=0.0, le=100.0,
        description="Keyword hit rate as a percentage"
    )

    # ── Section breakdown ────────────────────────────────────────────────────
    section_scores: List[SectionScore] = Field(
        default_factory=list,
        description="ATS score breakdown per resume section"
    )

    # ── Action items ─────────────────────────────────────────────────────────
    missing_keywords: List[str] = Field(
        default_factory=list,
        description="Important JD keywords absent from the resume"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Prioritised list of actions to improve ATS score for this JD"
    )

    # ── Pass/fail ────────────────────────────────────────────────────────────
    passes_ats_threshold: bool = Field(
        ...,
        description="True if overall_score >= the configured ATS_PASSING_SCORE (default 70)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "overall_score": 74,
                "match_level": "Good",
                "job_title": "Senior Backend Engineer",
                "keyword_matches": [
                    {"keyword": "FastAPI", "found": True, "context": "Built REST APIs using FastAPI"},
                    {"keyword": "Docker", "found": False, "context": None},
                ],
                "matched_count": 11,
                "total_keywords": 15,
                "match_percentage": 73.3,
                "section_scores": [
                    {"section": "Skills", "score": 80, "feedback": "Good keyword density"},
                    {"section": "Experience", "score": 70, "feedback": "Add more quantified results"},
                ],
                "missing_keywords": ["Docker", "Kubernetes", "CI/CD"],
                "recommendations": [
                    "Add Docker and Kubernetes to your Skills section.",
                    "Mention your CI/CD pipeline experience explicitly."
                ],
                "passes_ats_threshold": True
            }
        }


class ATSHistoryItem(BaseModel):
    """Lightweight summary of a past ATS check, used in list views."""
    id: Optional[str] = Field(None, description="MongoDB document ID of the ATS result")
    job_title: Optional[str] = None
    overall_score: int
    match_level: str
    passes_ats_threshold: bool
    checked_at: Optional[str] = Field(None, description="ISO-8601 timestamp")


class ATSHistoryResponse(BaseModel):
    """Paginated history of ATS checks for the authenticated user."""
    total: int
    items: List[ATSHistoryItem]
