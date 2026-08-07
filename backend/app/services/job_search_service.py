"""Efficient MongoDB search, autocomplete, filtering, and job presentation."""

from __future__ import annotations
import math
import re
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Mapping, Optional
from bson import ObjectId
from app.services.job_recommendation_service import calculate_job_match
from app.utils.search_normalization import normalize_search_text, prefix_pattern, search_tokens

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorDatabase


def format_salary(job: Mapping[str, Any]) -> str:
    """Return a stable Indian salary display string."""
    minimum, maximum = job.get("salary_min"), job.get("salary_max")
    if minimum is None or maximum is None:
        return "Not disclosed"
    if job.get("salary_currency", "INR") == "INR" and job.get("salary_period") == "year":
        return f"₹{minimum / 100000:g}L – ₹{maximum / 100000:g}L per year"
    return f"{job.get('salary_currency', '')} {minimum:g} – {maximum:g} per {job.get('salary_period', 'year')}"


def build_search_query(filters: Mapping[str, Any]) -> dict[str, Any]:
    """Build a safe MongoDB query so filtering occurs before scoring/pagination."""
    query: dict[str, Any] = {"is_active": True}
    clauses: list[dict[str, Any]] = []
    search = normalize_search_text(filters.get("search"))
    for token in search_tokens(search):
        pattern = re.compile(prefix_pattern(token), re.IGNORECASE)
        clauses.append({"$or": [{"normalized_title": pattern}, {"normalized_company": pattern}, {"normalized_location": pattern}, {"normalized_skills": pattern}, {"search_terms": pattern}]})
    exact_fields = {
        "role": "normalized_title", "company": "normalized_company",
        "location": "normalized_location", "workplace_type": "workplace_type",
        "employment_type": "employment_type", "experience_level": "experience_level",
    }
    for source, target in exact_fields.items():
        value = normalize_search_text(filters.get(source))
        if value:
            query[target] = re.compile(prefix_pattern(value), re.IGNORECASE) if source in {"role", "company", "location"} else value
    skills = filters.get("skills") or []
    if isinstance(skills, str):
        skills = [part.strip() for part in skills.split(",")]
    normalized_skills = [normalize_search_text(skill) for skill in skills if normalize_search_text(skill)]
    if normalized_skills:
        query["normalized_skills"] = {"$all": normalized_skills}
    if filters.get("min_salary") is not None:
        query["salary_max"] = {"$gte": float(filters["min_salary"])}
    if filters.get("max_salary") is not None:
        query.setdefault("salary_min", {})["$lte"] = float(filters["max_salary"])
    if clauses:
        query["$and"] = clauses
    return query


class JobSearchService:
    """Search active jobs and enrich results with user-specific state."""

    def __init__(self, database: "AsyncIOMotorDatabase") -> None:
        self.database = database

    async def _profile(self, user: Mapping[str, Any]) -> dict[str, Any]:
        user_id = str(user.get("id") or user.get("_id") or "")
        preference = await self.database["job_preferences"].find_one({"user_id": user_id}, {"_id": 0, "user_id": 0})
        if preference is None:  # backward-compatible collection used by the earlier module
            preference = await self.database["user_job_preferences"].find_one({"user_id": user_id}, {"_id": 0, "user_id": 0})
        return {**dict(user), **(preference or {})}

    async def autocomplete(self, query: str, limit: int = 10) -> dict[str, Any]:
        """Return grouped prefix suggestions from a bounded projected result set."""
        normalized = normalize_search_text(query)
        pattern = re.compile(prefix_pattern(normalized), re.IGNORECASE)
        mongo_query = {"is_active": True, "$or": [{"normalized_title": pattern}, {"normalized_company": pattern}, {"normalized_location": pattern}, {"normalized_skills": pattern}, {"search_terms": pattern}]}
        projection = {"_id": 0, "title": 1, "company": 1, "location": 1, "required_skills": 1, "preferred_skills": 1}
        rows = await self.database["jobs"].find(mongo_query, projection).limit(min(100, limit * 10)).to_list(length=min(100, limit * 10))
        candidates: dict[tuple[str, str], dict[str, str]] = {}
        for row in rows:
            groups = (("role", [row.get("title")]), ("company", [row.get("company")]), ("location", [row.get("location")]), ("skill", [*row.get("required_skills", []), *row.get("preferred_skills", [])]))
            for kind, values in groups:
                for value in filter(None, values):
                    norm = normalize_search_text(value)
                    searchable = [norm, *( ["bangalore"] if norm == "bengaluru" else [])]
                    if any(text.startswith(normalized) or any(token.startswith(normalized) for token in text.split()) for text in searchable):
                        candidates[(kind, norm)] = {"value": value, "type": kind, "label": value}
        ordered = sorted(candidates.values(), key=lambda item: (0 if normalize_search_text(item["value"]).startswith(normalized) else 1, item["type"], normalize_search_text(item["value"])))
        return {"query": normalized, "suggestions": ordered[:limit]}

    async def recommendations(self, user: Mapping[str, Any], filters: Mapping[str, Any], page: int, limit: int) -> dict[str, Any]:
        """Filter in MongoDB, score deterministically, batch-load state, sort, and paginate."""
        profile = await self._profile(user)
        projection = {"content_hash": 0, "search_terms": 0, "created_at": 0, "updated_at": 0}
        jobs = await self.database["jobs"].find(build_search_query(filters), projection).to_list(length=5000)
        user_id = str(user.get("id") or user.get("_id") or "")
        job_ids = [str(job["_id"]) for job in jobs]
        saved_rows = await self.database["saved_jobs"].find({"user_id": user_id, "job_id": {"$in": job_ids}}, {"job_id": 1}).to_list(length=len(job_ids)) if job_ids else []
        application_rows = await self.database["job_applications"].find({"user_id": user_id, "job_id": {"$in": job_ids}}, {"job_id": 1, "status": 1}).to_list(length=len(job_ids)) if job_ids else []
        saved = {row["job_id"] for row in saved_rows}
        applications = {row["job_id"]: row["status"] for row in application_rows}
        items = []
        for job in jobs:
            job_id = str(job["_id"])
            score = calculate_job_match(profile, job)
            if score["match_score"] < float(filters.get("min_match_score") or 0):
                continue
            items.append(self._card(job, job_id, score, job_id in saved, job_id in applications))
        sort_by, order = filters.get("sort_by", "match_score"), filters.get("sort_order", "desc")
        reverse = order == "desc"
        sort_fields = {"match_score": "match_score", "salary": "salary_max", "latest": "posted_at", "deadline": "application_deadline", "company": "company", "title": "title"}
        field = sort_fields.get(sort_by, "match_score")
        items.sort(key=lambda item: (item.get(field) is not None, item.get(field) or ""), reverse=reverse)
        if sort_by == "match_score":
            items.sort(key=lambda item: (-item["match_score"], -(item.get("posted_at") or datetime.min.replace(tzinfo=timezone.utc)).timestamp(), normalize_search_text(item["title"])))
        total = len(items)
        start = (page - 1) * limit
        return {"total": total, "page": page, "limit": limit, "total_pages": math.ceil(total / limit) if total else 0, "items": items[start:start + limit]}

    @staticmethod
    def _card(job: Mapping[str, Any], job_id: str, score: Mapping[str, Any], is_saved: bool, has_applied: bool) -> dict[str, Any]:
        raw = score["score_breakdown"]
        breakdown = {"required_skills": raw["required_skills"], "preferred_skills": raw["preferred_skills"], "role": raw["role_relevance"], "preferences": raw["location_preference"] + raw["workplace_preference"] + raw["employment_type_preference"], "cgpa": raw["cgpa_eligibility"], "experience": raw["experience_eligibility"], "department": raw["department_eligibility"], "passing_year": raw["passing_year_eligibility"]}
        matching = list(dict.fromkeys([*score["matched_skills"], *score["matched_preferred_skills"]]))
        return {"id": job_id, "title": job["title"], "company": job["company"], "company_logo_url": job.get("company_logo_url"), "location": job["location"], "workplace_type": job["workplace_type"], "employment_type": job["employment_type"], "experience_level": job.get("experience_level"), "salary_min": job.get("salary_min"), "salary_max": job.get("salary_max"), "formatted_salary": format_salary(job), "match_score": score["match_score"], "matching_skills": matching, "matched_preferred_skills": score["matched_preferred_skills"], "missing_skills": score["missing_required_skills"], "required_skills": job.get("required_skills", []), "preferred_skills": job.get("preferred_skills", []), "short_description": job.get("summary") or job.get("description", "")[:220], "posted_at": job.get("posted_at"), "application_deadline": job.get("application_deadline"), "is_saved": is_saved, "has_applied": has_applied, "eligibility_status": score["eligibility_status"], "score_breakdown": {"total_score": score["match_score"], "breakdown": breakdown}}

    async def details(self, user: Mapping[str, Any], job_id: str) -> dict[str, Any] | None:
        """Return a complete selected-job panel with user alignment."""
        if not ObjectId.is_valid(job_id):
            return None
        job = await self.database["jobs"].find_one({"_id": ObjectId(job_id), "is_active": True})
        if not job:
            return None
        profile = await self._profile(user)
        score = calculate_job_match(profile, job)
        user_id = str(user.get("id") or user.get("_id") or "")
        saved, application = await self.database["saved_jobs"].find_one({"user_id": user_id, "job_id": job_id}), await self.database["job_applications"].find_one({"user_id": user_id, "job_id": job_id})
        card = self._card(job, job_id, score, bool(saved), bool(application))
        return {**card, "openings": job.get("openings", 1), "summary": job.get("summary"), "full_description": job.get("description"), "responsibilities": job.get("responsibilities", []), "match_score_breakdown": card["score_breakdown"], "skill_alignment_percentage": round(len(score["matched_skills"]) / max(len(job.get("required_skills", [])), 1) * 100, 2), "eligibility_reasons": score["eligibility_reasons"], "application_status": application.get("status") if application else None}

    async def filter_options(self) -> dict[str, Any]:
        """Aggregate dynamic active-job filters entirely in MongoDB."""
        pipeline = [{"$match": {"is_active": True}}, {"$facet": {
            "locations": [{"$group": {"_id": "$location", "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}],
            "companies": [{"$group": {"_id": "$company", "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}],
            "roles": [{"$group": {"_id": "$title", "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}],
            "skills": [{"$unwind": "$required_skills"}, {"$group": {"_id": "$required_skills", "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}],
            "workplace_types": [{"$group": {"_id": "$workplace_type", "count": {"$sum": 1}}}],
            "employment_types": [{"$group": {"_id": "$employment_type", "count": {"$sum": 1}}}],
            "experience_levels": [{"$group": {"_id": "$experience_level", "count": {"$sum": 1}}}],
            "salary": [{"$group": {"_id": None, "minimum": {"$min": "$salary_min"}, "maximum": {"$max": "$salary_max"}}}],
        }}]
        rows = await self.database["jobs"].aggregate(pipeline).to_list(1)
        data = rows[0] if rows else {}
        option = lambda values: [{"value": row["_id"], "label": row["_id"], "count": row["count"]} for row in values if row.get("_id")]
        return {key: option(data.get(key, [])) for key in ("locations", "companies", "roles", "skills", "workplace_types", "employment_types", "experience_levels")} | {"salary_range": (data.get("salary") or [{"minimum": 0, "maximum": 0}])[0]}
