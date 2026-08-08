from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Sub-schemas
# ---------------------------------------------------------------------------

class FormatCheck(BaseModel):
    """A single ATS formatting check result."""
    label: str = Field(..., description="Human-readable name of the check")
    passed: bool = Field(..., description="Whether the resume passed this check")
    detail: Optional[str] = Field(None, description="Optional explanation or tip for this check")


class SkillMatch(BaseModel):
    """A skill extracted from the resume with an optional relevance score."""
    name: str = Field(..., description="Skill name, e.g. 'Python', 'React'")
    relevance: Optional[float] = Field(
        None, ge=0.0, le=1.0,
        description="Relevance score between 0 and 1 (populated when a job description is provided)"
    )


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    """
    Optional body for the /analyze endpoint.
    If job_description is provided, the analysis will include keyword-match scoring.
    """
    job_description: Optional[str] = Field(
        None,
        max_length=5000,
        description="Paste the target job description to enable keyword-gap analysis"
    )


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class AnalysisResponse(BaseModel):
    """Full resume analysis report returned by POST /analyze and GET /report."""

    score: int = Field(
        ..., ge=0, le=100,
        description="Overall ATS compatibility score (0–100)"
    )
    extracted_skills: List[SkillMatch] = Field(
        default_factory=list,
        description="Skills detected in the resume"
    )
    missing_keywords: List[str] = Field(
        default_factory=list,
        description="Important keywords from the job description that are absent in the resume"
    )
    suggestions: List[str] = Field(
        default_factory=list,
        description="Actionable improvement tips ordered by priority"
    )
    checks: List[FormatCheck] = Field(
        default_factory=list,
        description="Detailed ATS formatting checks"
    )
    resume_filename: Optional[str] = Field(
        None,
        description="Name of the resume file that was analysed"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "score": 86,
                "extracted_skills": [
                    {"name": "React", "relevance": 0.95},
                    {"name": "Python", "relevance": 0.80}
                ],
                "missing_keywords": ["GraphQL", "Docker"],
                "suggestions": [
                    "Replace passive phrases with action verbs (e.g. 'Led' instead of 'Responsible for').",
                    "Quantify achievements: add percentage or numeric impact metrics."
                ],
                "checks": [
                    {"label": "Standard Sans-Serif font", "passed": True, "detail": None},
                    {"label": "Single-column ATS layout", "passed": True, "detail": None},
                    {"label": "Contact details present", "passed": True, "detail": None},
                    {"label": "Quantified metrics present", "passed": False,
                     "detail": "Add at least 2 measurable results to boost your score."}
                ],
                "resume_filename": "john_doe_resume.pdf"
            }
        }


class AnalysisHistoryItem(BaseModel):
    """A lightweight summary entry used when listing past analyses."""
    score: int
    resume_filename: Optional[str] = None
    analyzed_at: Optional[str] = Field(None, description="ISO-8601 timestamp of when the analysis ran")


class AnalysisHistoryResponse(BaseModel):
    """Paginated list of past analysis reports."""
    total: int
    items: List[AnalysisHistoryItem]
