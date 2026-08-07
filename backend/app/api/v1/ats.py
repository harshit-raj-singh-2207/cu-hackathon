from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.database import get_ats_results_collection, get_resumes_collection
from app.schemas.ats import (
    ATSCheckRequest,
    ATSCheckResponse,
    ATSHistoryItem,
    ATSHistoryResponse,
    KeywordMatch,
    SectionScore,
)
from app.services.ats import ATSResult, check_ats

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _result_to_response(result: ATSResult) -> ATSCheckResponse:
    """Convert the service dataclass into the Pydantic response schema."""
    return ATSCheckResponse(
        overall_score=result.overall_score,
        match_level=result.match_level,
        job_title=result.job_title,
        keyword_matches=[
            KeywordMatch(
                keyword=km.keyword,
                found=km.found,
                context=km.context,
            )
            for km in result.keyword_matches
        ],
        matched_count=result.matched_count,
        total_keywords=result.total_keywords,
        match_percentage=result.match_percentage,
        section_scores=[
            SectionScore(
                section=ss.section,
                score=ss.score,
                feedback=ss.feedback,
            )
            for ss in result.section_scores
        ],
        missing_keywords=result.missing_keywords,
        recommendations=result.recommendations,
        passes_ats_threshold=result.passes_ats_threshold,
    )


def _build_db_document(
    user_id: str,
    request: ATSCheckRequest,
    result: ATSResult,
    resume_filename: Optional[str],
) -> dict:
    """Build a MongoDB-ready dict for the ats_results collection."""
    return {
        "user_id": user_id,
        "job_title": request.job_title,
        "job_description_snippet": request.job_description[:300],  # store only a preview
        "overall_score": result.overall_score,
        "match_level": result.match_level,
        "matched_count": result.matched_count,
        "total_keywords": result.total_keywords,
        "match_percentage": result.match_percentage,
        "missing_keywords": result.missing_keywords,
        "recommendations": result.recommendations,
        "passes_ats_threshold": result.passes_ats_threshold,
        "resume_filename": resume_filename,
        "checked_at": datetime.now(timezone.utc),
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/check", response_model=ATSCheckResponse, status_code=status.HTTP_200_OK)
async def run_ats_check(
    body: ATSCheckRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Run an ATS compatibility check of the user's uploaded resume against the
    supplied job description.

    - Extracts up to 60 keywords from the JD.
    - Matches each keyword against the resume text with context snippets.
    - Scores 5 resume sections independently.
    - Optionally enriches recommendations via Gemini / OpenAI.
    - Persists the result to the `ats_results` collection.

    Requires the user to have a resume uploaded (POST /resume/upload).
    """
    user_id = current_user["id"]

    # ── 1. Fetch the resume document ─────────────────────────────────────────
    resumes_col = get_resumes_collection()
    resume_doc = await resumes_col.find_one({"user_id": user_id})

    if not resume_doc or not resume_doc.get("raw_text"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No parsed resume text found. "
                "Please upload a resume and ensure it has been processed before running an ATS check."
            ),
        )

    resume_text: str = resume_doc["raw_text"]
    resume_filename: Optional[str] = resume_doc.get("original_filename")

    # ── 2. Run ATS check ─────────────────────────────────────────────────────
    try:
        result: ATSResult = await check_ats(
            resume_text=resume_text,
            job_description=body.job_description,
            job_title=body.job_title,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ATS analysis failed: {exc}",
        )

    # ── 3. Persist result to MongoDB ─────────────────────────────────────────
    try:
        ats_col = get_ats_results_collection()
        await ats_col.insert_one(_build_db_document(user_id, body, result, resume_filename))
    except Exception as exc:
        # Non-fatal — log the error but still return the result to the user
        import logging
        logging.getLogger(__name__).warning("Could not persist ATS result: %s", exc)

    return _result_to_response(result)


@router.get("/history", response_model=ATSHistoryResponse, status_code=status.HTTP_200_OK)
async def get_ats_history(
    current_user: dict = Depends(get_current_user),
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=10, ge=1, le=50, description="Results per page (max 50)"),
):
    """
    Return a paginated list of past ATS check results for the authenticated user,
    ordered newest-first.
    """
    user_id = current_user["id"]
    ats_col = get_ats_results_collection()

    total = await ats_col.count_documents({"user_id": user_id})
    skip = (page - 1) * page_size

    cursor = (
        ats_col.find({"user_id": user_id})
        .sort("checked_at", -1)
        .skip(skip)
        .limit(page_size)
    )
    docs = await cursor.to_list(length=page_size)

    items = [
        ATSHistoryItem(
            id=str(doc["_id"]),
            job_title=doc.get("job_title"),
            overall_score=doc["overall_score"],
            match_level=doc["match_level"],
            passes_ats_threshold=doc["passes_ats_threshold"],
            checked_at=doc["checked_at"].isoformat() if doc.get("checked_at") else None,
        )
        for doc in docs
    ]

    return ATSHistoryResponse(total=total, items=items)


@router.get("/history/{result_id}", response_model=ATSCheckResponse, status_code=status.HTTP_200_OK)
async def get_ats_result(
    result_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve a single ATS result by its MongoDB document ID.
    Only the owner of the result can access it.
    """
    try:
        oid = ObjectId(result_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid result ID format.",
        )

    ats_col = get_ats_results_collection()
    doc = await ats_col.find_one({"_id": oid})

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ATS result not found.",
        )

    # Ownership check
    if doc.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this result.",
        )

    # Stored docs have a subset of fields — reconstruct response with available data
    return ATSCheckResponse(
        overall_score=doc["overall_score"],
        match_level=doc["match_level"],
        job_title=doc.get("job_title"),
        keyword_matches=[],          # not stored in history (space saving)
        matched_count=doc.get("matched_count", 0),
        total_keywords=doc.get("total_keywords", 0),
        match_percentage=doc.get("match_percentage", 0.0),
        section_scores=[],           # not stored in history
        missing_keywords=doc.get("missing_keywords", []),
        recommendations=doc.get("recommendations", []),
        passes_ats_threshold=doc["passes_ats_threshold"],
    )


@router.delete("/history/{result_id}", status_code=status.HTTP_200_OK)
async def delete_ats_result(
    result_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Permanently delete a single ATS result by ID.
    Only the owner can delete their own results.
    """
    try:
        oid = ObjectId(result_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid result ID format.",
        )

    ats_col = get_ats_results_collection()
    doc = await ats_col.find_one({"_id": oid}, {"user_id": 1})

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ATS result not found.",
        )

    if doc.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this result.",
        )

    await ats_col.delete_one({"_id": oid})
    return {"message": "ATS result deleted successfully."}
