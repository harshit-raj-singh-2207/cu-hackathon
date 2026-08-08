from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.database import get_database, get_resumes_collection
from app.schemas.analyzer import AnalysisResponse, AnalyzeRequest, SkillMatch, FormatCheck
from app.services.ai import analyze_resume, AnalysisResult
from app.api.deps import get_current_user

router = APIRouter()


def _result_to_response(result: AnalysisResult) -> AnalysisResponse:
    """Convert the service dataclass into the Pydantic response schema."""
    return AnalysisResponse(
        score=result.score,
        extracted_skills=[
            SkillMatch(name=s.name, relevance=s.relevance)
            for s in result.extracted_skills
        ],
        missing_keywords=result.missing_keywords,
        suggestions=result.suggestions,
        checks=[
            FormatCheck(label=c.label, passed=c.passed, detail=c.detail)
            for c in result.checks
        ],
        resume_filename=result.resume_filename,
    )


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    body: AnalyzeRequest = AnalyzeRequest(),
    current_user: dict = Depends(get_current_user),
):
    """
    Analyse the authenticated user's uploaded resume.

    - Fetches parsed resume text from the `resumes` collection.
    - Runs heuristic ATS scoring (7 checks, skill detection, metrics regex).
    - Optionally enriches results via Gemini/OpenAI if an API key is configured.
    - Persists the report back to the resume document.
    - Accepts an optional `job_description` body field for keyword-gap analysis.
    """
    user_id = current_user["id"]

    # ── Fetch resume text ────────────────────────────────────────────────────
    resumes_col = get_resumes_collection()
    resume_doc = await resumes_col.find_one({"user_id": user_id})

    if not resume_doc or not resume_doc.get("raw_text"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No parsed resume text found. "
                "Upload a resume first — the file must be processed before analysis."
            ),
        )

    raw_text: str = resume_doc["raw_text"]
    resume_filename: str = resume_doc.get("original_filename")

    # ── Run analysis ─────────────────────────────────────────────────────────
    try:
        result: AnalysisResult = await analyze_resume(
            text=raw_text,
            job_description=body.job_description,
            resume_filename=resume_filename,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {exc}",
        )

    # ── Persist report to resume document ────────────────────────────────────
    report_dict = _result_to_response(result).model_dump()
    await resumes_col.update_one(
        {"user_id": user_id},
        {"$set": {"last_analysis": report_dict}},
    )

    return report_dict


@router.get("/report", response_model=AnalysisResponse)
async def get_last_report(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the most recent analysis report for the authenticated user.
    Returns an empty scaffold if no analysis has been run yet.
    """
    user_id = current_user["id"]
    resumes_col = get_resumes_collection()
    resume_doc = await resumes_col.find_one({"user_id": user_id})

    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found. Upload a resume to get started.",
        )

    report = resume_doc.get("last_analysis")
    if not report:
        return AnalysisResponse(
            score=0,
            extracted_skills=[],
            missing_keywords=[],
            suggestions=["Upload and analyze your resume to view ATS formatting checks and keyword tips."],
            checks=[
                FormatCheck(label="Contact details present", passed=False),
                FormatCheck(label="Education section detected", passed=False),
                FormatCheck(label="Work experience section detected", passed=False),
                FormatCheck(label="Quantified achievements present", passed=False),
                FormatCheck(label="Action verbs used", passed=False),
                FormatCheck(label="LinkedIn profile linked", passed=False),
                FormatCheck(label="Resume length appropriate", passed=False),
            ],
        )

    return report
