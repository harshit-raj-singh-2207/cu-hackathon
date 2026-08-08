from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Embedded sub-documents
# ---------------------------------------------------------------------------

class SkillMatchDB(BaseModel):
    """A skill extracted from the resume, stored inside the resume document."""
    name: str
    relevance: Optional[float] = None  # 0.0 – 1.0, populated when JD is provided


class FormatCheckDB(BaseModel):
    """Result of a single ATS formatting check, stored inside the resume document."""
    label: str
    passed: bool
    detail: Optional[str] = None


class AnalysisReportDB(BaseModel):
    """
    Embedded analysis snapshot stored directly on the Resume document.
    Written by the analyzer service; read back by GET /analyzer/report.
    """
    score: int = Field(..., ge=0, le=100)
    extracted_skills: List[SkillMatchDB] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    checks: List[FormatCheckDB] = Field(default_factory=list)
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Root document model  →  "resumes" collection
# ---------------------------------------------------------------------------

class ResumeDB(BaseModel):
    """
    Represents one document in the 'resumes' MongoDB collection.

    One resume document per user (upserted on every upload).
    The 'last_analysis' field is overwritten each time the analyzer runs.
    """
    id: Optional[str] = Field(default=None, alias="_id")

    # ── Ownership ────────────────────────────────────────────────────────────
    user_id: str = Field(..., description="ObjectId string of the owning user")

    # ── File metadata ────────────────────────────────────────────────────────
    original_filename: str = Field(..., description="Original name as uploaded by the user")
    stored_filename: str = Field(..., description="Filename as saved on disk, e.g. '<user_id>_resume.pdf'")
    file_path: str = Field(..., description="Relative path on disk, e.g. 'static/resumes/<stored_filename>'")
    file_url: str = Field(..., description="URL path served to the client, e.g. '/static/resumes/<stored_filename>'")
    file_size_bytes: Optional[int] = Field(None, description="Size of the uploaded file in bytes")
    mime_type: Optional[str] = Field(
        None,
        description="MIME type of the uploaded file, e.g. 'application/pdf'"
    )

    # ── Parsed text ──────────────────────────────────────────────────────────
    raw_text: Optional[str] = Field(
        None,
        description="Plain text extracted from the PDF/DOCX by the parser service"
    )

    # ── Analysis ─────────────────────────────────────────────────────────────
    last_analysis: Optional[AnalysisReportDB] = Field(
        None,
        description="Most recent analysis report; overwritten on each /analyze call"
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True       # allow both "_id" and "id"
        arbitrary_types_allowed = True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def resume_document(
    user_id: str,
    original_filename: str,
    stored_filename: str,
    file_path: str,
    file_url: str,
    file_size_bytes: Optional[int] = None,
    mime_type: Optional[str] = None,
    raw_text: Optional[str] = None,
) -> dict:
    """
    Build a plain dict ready for db['resumes'].insert_one() / update_one($set).

    Usage in resume API:
        doc = resume_document(user_id=..., original_filename=..., ...)
        await db['resumes'].update_one(
            {'user_id': user_id},
            {'$set': doc},
            upsert=True
        )
    """
    return ResumeDB(
        user_id=user_id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        file_url=file_url,
        file_size_bytes=file_size_bytes,
        mime_type=mime_type,
        raw_text=raw_text,
        uploaded_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    ).model_dump(exclude={"id"})
