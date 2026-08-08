"""Thin JWT-protected routes for the complete Job Recommendations backend."""

from datetime import datetime, timezone
from typing import Literal, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from app.api.deps import get_current_user
from app.database import get_database
from app.models.job import EmploymentType, WorkplaceType
from app.schemas.job import JobApplicationCreate, JobApplicationResponse, JobApplicationStatusUpdate, UserJobPreferenceCreate, UserJobPreferenceUpdate
from app.services.job_insights_service import JobInsightsService
from app.services.job_search_service import JobSearchService

router = APIRouter()


def _database():
    database = get_database()
    if database is None:
        raise HTTPException(status_code=500, detail="Database connection is unavailable")
    return database


def _object_id(value: str, field: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field}")
    return ObjectId(value)


def _application_response(document: dict) -> dict:
    result = dict(document)
    result["id"] = str(result.pop("_id"))
    return result


@router.get("/autocomplete")
async def autocomplete(q: str = Query(min_length=1, max_length=100), limit: int = Query(10, ge=1, le=25), current_user: dict = Depends(get_current_user)):
    """Return safe role, company, location, and skill prefix suggestions."""
    return await JobSearchService(_database()).autocomplete(q.strip(), limit)


@router.get("/filter-options")
async def filter_options(current_user: dict = Depends(get_current_user)):
    """Return dynamic filter values from active jobs."""
    return await JobSearchService(_database()).filter_options()


@router.get("/recommendations")
async def recommendations(
    search: Optional[str] = None, role: Optional[str] = None, company: Optional[str] = None,
    location: Optional[str] = None, workplace_type: Optional[WorkplaceType] = None,
    employment_type: Optional[EmploymentType] = None, experience_level: Optional[str] = None,
    min_salary: Optional[float] = Query(None, ge=0), max_salary: Optional[float] = Query(None, ge=0),
    min_match_score: float = Query(0, ge=0, le=100), skills: Optional[list[str]] = Query(None),
    sort_by: Literal["match_score", "salary", "latest", "deadline", "company", "title"] = "match_score",
    sort_order: Literal["asc", "desc"] = "desc", page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=300), current_user: dict = Depends(get_current_user),
):
    """Search and rank active jobs for the authenticated user."""
    filters = {"search": search, "role": role, "company": company, "location": location, "workplace_type": workplace_type.value if workplace_type else None, "employment_type": employment_type.value if employment_type else None, "experience_level": experience_level, "min_salary": min_salary, "max_salary": max_salary, "min_match_score": min_match_score, "skills": skills or [], "sort_by": sort_by, "sort_order": sort_order}
    return await JobSearchService(_database()).recommendations(current_user, filters, page, limit)


@router.get("/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    document = await _database()["job_preferences"].find_one({"user_id": current_user["id"]})
    if not document:
        return {"user_id": current_user["id"], "preferred_roles": [], "preferred_companies": [], "preferred_locations": [], "preferred_workplace_types": [], "preferred_employment_types": [], "expected_salary_min": None, "expected_salary_max": None, "preferred_skills": [], "experience_level": None, "willing_to_relocate": False}
    document["id"] = str(document.pop("_id"))
    return document


@router.put("/preferences")
async def update_preferences(payload: UserJobPreferenceCreate | UserJobPreferenceUpdate, current_user: dict = Depends(get_current_user)):
    database, now = _database(), datetime.now(timezone.utc)
    update = payload.model_dump(exclude_unset=True, mode="json") | {"updated_at": now}
    await database["job_preferences"].update_one({"user_id": current_user["id"]}, {"$set": update, "$setOnInsert": {"user_id": current_user["id"], "created_at": now}}, upsert=True)
    document = await database["job_preferences"].find_one({"user_id": current_user["id"]})
    document["id"] = str(document.pop("_id"))
    return document


@router.get("/saved")
async def saved_jobs(current_user: dict = Depends(get_current_user)):
    """Return only the authenticated user's active saved jobs."""
    pipeline = [{"$match": {"user_id": current_user["id"]}}, {"$addFields": {"job_object_id": {"$convert": {"input": "$job_id", "to": "objectId", "onError": None, "onNull": None}}}}, {"$lookup": {"from": "jobs", "localField": "job_object_id", "foreignField": "_id", "as": "job"}}, {"$unwind": "$job"}, {"$match": {"job.is_active": True}}, {"$sort": {"saved_at": -1}}, {"$project": {"_id": 0, "saved_id": {"$toString": "$_id"}, "saved_at": 1, "id": {"$toString": "$job._id"}, "title": "$job.title", "company": "$job.company", "location": "$job.location", "company_logo_url": "$job.company_logo_url", "salary_min": "$job.salary_min", "salary_max": "$job.salary_max"}}]
    return await _database()["saved_jobs"].aggregate(pipeline).to_list(length=500)


@router.get("/applications", response_model=list[JobApplicationResponse])
async def list_applications(current_user: dict = Depends(get_current_user)):
    documents = await _database()["job_applications"].find({"user_id": current_user["id"]}).sort("applied_at", -1).to_list(length=500)
    return [_application_response(document) for document in documents]


@router.post("/applications", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(payload: JobApplicationCreate, current_user: dict = Depends(get_current_user)):
    database = _database()
    job = await JobSearchService(database).details(current_user, payload.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Active job not found")
    now = datetime.now(timezone.utc)
    document = {"user_id": current_user["id"], "job_id": payload.job_id, "status": payload.status.value, "notes": payload.notes, "resume_id": payload.resume_id, "match_score_at_application": job["match_score"], "applied_at": now, "updated_at": now}
    try:
        result = await database["job_applications"].insert_one(document)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="An active application already exists for this job") from exc
    document["_id"] = result.inserted_id
    return _application_response(document)


@router.patch("/applications/{application_id}", response_model=JobApplicationResponse)
async def update_application_status(application_id: str, payload: JobApplicationStatusUpdate, current_user: dict = Depends(get_current_user)):
    document = await _database()["job_applications"].find_one_and_update({"_id": _object_id(application_id, "application_id"), "user_id": current_user["id"]}, {"$set": {"status": payload.status.value, "updated_at": datetime.now(timezone.utc)}}, return_document=ReturnDocument.AFTER)
    if not document:
        raise HTTPException(status_code=404, detail="Application not found")
    return _application_response(document)


@router.get("/insights")
async def insights(current_user: dict = Depends(get_current_user)):
    return await JobInsightsService(_database()).generate(current_user)


@router.post("/{job_id}/save")
async def save_job(job_id: str, current_user: dict = Depends(get_current_user)):
    database = _database()
    if not await database["jobs"].find_one({"_id": _object_id(job_id, "job_id"), "is_active": True}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="Active job not found")
    try:
        await database["saved_jobs"].insert_one({"user_id": current_user["id"], "job_id": job_id, "saved_at": datetime.now(timezone.utc)})
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Job is already saved") from exc
    return {"job_id": job_id, "is_saved": True}


@router.delete("/{job_id}/save")
async def unsave_job(job_id: str, current_user: dict = Depends(get_current_user)):
    _object_id(job_id, "job_id")
    result = await _database()["saved_jobs"].delete_one({"user_id": current_user["id"], "job_id": job_id})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Saved job not found")
    return {"job_id": job_id, "is_saved": False}


@router.get("/{job_id}/skill-alignment")
async def skill_alignment(job_id: str, current_user: dict = Depends(get_current_user)):
    details = await JobSearchService(_database()).details(current_user, job_id)
    if not details:
        raise HTTPException(status_code=404, detail="Active job not found")
    required = set(details["required_skills"])
    preferred = set(details["preferred_skills"])
    matching = set(details["matching_skills"])
    missing_required = sorted(required - matching)
    missing_preferred = sorted(preferred - matching)
    order = ([{"skill": skill, "priority": "High", "reason": "Required by this job"} for skill in missing_required] + [{"skill": skill, "priority": "Medium", "reason": "Preferred by this job"} for skill in missing_preferred] + [{"skill": skill, "priority": "Completed", "reason": "Already present in your profile"} for skill in sorted(matching)])
    return {"match_percentage": details["skill_alignment_percentage"], "matching_skills": sorted(matching), "missing_required_skills": missing_required, "missing_preferred_skills": missing_preferred, "recommended_learning_order": order}


@router.get("/{job_id}")
async def job_details(job_id: str, current_user: dict = Depends(get_current_user)):
    details = await JobSearchService(_database()).details(current_user, job_id)
    if not details:
        raise HTTPException(status_code=404, detail="Active job not found")
    return details
