"""Business logic for deterministic, explainable job recommendations."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Iterable, Mapping, Optional
from app.utils.skill_normalization import normalize_skill

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorDatabase


SCORE_WEIGHTS: dict[str, float] = {
    "required_skills": 40.0,
    "preferred_skills": 10.0,
    "role_relevance": 15.0,
    "location_preference": 4.0,
    "workplace_preference": 3.0,
    "employment_type_preference": 3.0,
    "cgpa_eligibility": 10.0,
    "experience_eligibility": 5.0,
    "department_eligibility": 5.0,
    "passing_year_eligibility": 5.0,
}


@dataclass(frozen=True)
class RecommendationFilters:
    """Optional filters applied before and after recommendation scoring."""

    search: Optional[str] = None
    location: Optional[str] = None
    workplace_type: Optional[str] = None
    employment_type: Optional[str] = None
    minimum_match_score: float = 0.0
    skills: tuple[str, ...] = ()


def normalise_text(value: Any) -> str:
    """Return a trimmed, case-insensitive comparison value."""
    return str(value).strip().casefold() if value is not None else ""


def normalise_values(values: Any) -> list[str]:
    """Normalise and de-duplicate a scalar or iterable while preserving order."""
    if values is None:
        return []
    if isinstance(values, str):
        values = [values]
    if not isinstance(values, Iterable):
        return []

    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        cleaned = normalise_text(value)
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)
    return result


def _display_values(values: Any) -> dict[str, str]:
    """Map normalised values to their first human-readable representation."""
    if values is None:
        return {}
    if isinstance(values, str):
        values = [values]
    if not isinstance(values, Iterable):
        return {}

    display: dict[str, str] = {}
    for value in values:
        rendered = str(value).strip()
        key = normalize_skill(rendered)
        if key and key not in display:
            display[key] = rendered
    return display


def _safe_number(value: Any) -> Optional[float]:
    """Convert profile values to finite floats without raising validation errors."""
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _proportional_score(matches: int, total: int, weight: float) -> float:
    """Award a proportional category score; an empty requirement earns full credit."""
    return weight if total == 0 else weight * matches / total


def _role_relevance(title: Any, preferred_roles: Any) -> float:
    """Calculate title relevance using exact, phrase, and token overlap."""
    title_value = normalise_text(title)
    roles = normalise_values(preferred_roles)
    if not title_value or not roles:
        return 0.0
    if title_value in roles:
        return SCORE_WEIGHTS["role_relevance"]
    if any(role in title_value or title_value in role for role in roles):
        return SCORE_WEIGHTS["role_relevance"]

    title_tokens = set(re.findall(r"[a-z0-9+#.]+", title_value))
    best_overlap = 0.0
    for role in roles:
        role_tokens = set(re.findall(r"[a-z0-9+#.]+", role))
        if role_tokens:
            best_overlap = max(best_overlap, len(title_tokens & role_tokens) / len(role_tokens))
    return SCORE_WEIGHTS["role_relevance"] * best_overlap


def _preference_score(value: Any, preferences: Any, weight: float) -> float:
    """Award a preference category when the job value matches a selected option."""
    options = set(normalise_values(preferences))
    return weight if normalise_text(value) in options and options else 0.0


def _profile_value(profile: Mapping[str, Any], *keys: str) -> Any:
    """Read the first available profile field, supporting common field aliases."""
    for key in keys:
        if profile.get(key) is not None:
            return profile[key]
    return None


def calculate_job_match(
    user_profile: Mapping[str, Any],
    job: Mapping[str, Any],
) -> dict[str, Any]:
    """Calculate a deterministic 0-100 match and compulsory eligibility result.

    Skills, academic requirements, experience, department, and passing year are
    compulsory when configured on a job. Preference categories influence ranking
    but do not make a candidate ineligible.
    """
    user_skill_display = _display_values(user_profile.get("skills"))
    required_display = _display_values(job.get("required_skills"))
    preferred_display = _display_values(job.get("preferred_skills"))

    user_skills = set(user_skill_display)
    required_skills = set(required_display)
    preferred_skills = set(preferred_display)
    matched_required = required_skills & user_skills
    missing_required = required_skills - user_skills
    matched_preferred = preferred_skills & user_skills

    breakdown: dict[str, float] = {
        "required_skills": _proportional_score(
            len(matched_required), len(required_skills), SCORE_WEIGHTS["required_skills"]
        ),
        "preferred_skills": _proportional_score(
            len(matched_preferred), len(preferred_skills), SCORE_WEIGHTS["preferred_skills"]
        ),
        "role_relevance": _role_relevance(
            job.get("title"), user_profile.get("preferred_roles")
        ),
        "location_preference": _preference_score(
            job.get("location"),
            user_profile.get("preferred_locations"),
            SCORE_WEIGHTS["location_preference"],
        ),
        "workplace_preference": _preference_score(
            job.get("workplace_type"),
            user_profile.get("preferred_workplace_types"),
            SCORE_WEIGHTS["workplace_preference"],
        ),
        "employment_type_preference": _preference_score(
            job.get("employment_type"),
            user_profile.get("preferred_employment_types"),
            SCORE_WEIGHTS["employment_type_preference"],
        ),
    }

    eligibility_reasons: list[str] = []
    if missing_required:
        eligibility_reasons.append(
            "Missing required skills: "
            + ", ".join(required_display[key] for key in sorted(missing_required))
        )

    required_cgpa = _safe_number(job.get("min_cgpa"))
    user_cgpa = _safe_number(_profile_value(user_profile, "cgpa", "current_cgpa"))
    cgpa_passed = required_cgpa is None or (
        user_cgpa is not None and user_cgpa >= required_cgpa
    )
    breakdown["cgpa_eligibility"] = (
        SCORE_WEIGHTS["cgpa_eligibility"] if cgpa_passed else 0.0
    )
    if not cgpa_passed:
        detail = "CGPA is missing" if user_cgpa is None else f"CGPA {user_cgpa:g} is below {required_cgpa:g}"
        eligibility_reasons.append(detail)

    required_experience = _safe_number(job.get("min_experience")) or 0.0
    user_experience = _safe_number(
        _profile_value(user_profile, "experience", "years_of_experience", "experience_years")
    )
    experience_passed = required_experience <= 0 or (
        user_experience is not None and user_experience >= required_experience
    )
    breakdown["experience_eligibility"] = (
        SCORE_WEIGHTS["experience_eligibility"] if experience_passed else 0.0
    )
    if not experience_passed:
        detail = (
            "Experience is missing"
            if user_experience is None
            else f"Experience {user_experience:g} is below {required_experience:g} years"
        )
        eligibility_reasons.append(detail)

    eligible_departments = set(normalise_values(job.get("eligibility_departments")))
    user_department = normalise_text(user_profile.get("department"))
    department_passed = not eligible_departments or user_department in eligible_departments
    breakdown["department_eligibility"] = (
        SCORE_WEIGHTS["department_eligibility"] if department_passed else 0.0
    )
    if not department_passed:
        eligibility_reasons.append(
            "Department is missing or not included in the job's eligible departments"
        )

    eligible_years = {str(year).strip() for year in job.get("eligible_passing_years", [])}
    raw_passing_year = user_profile.get("passing_year")
    user_passing_year = str(raw_passing_year).strip() if raw_passing_year is not None else ""
    passing_year_passed = not eligible_years or user_passing_year in eligible_years
    breakdown["passing_year_eligibility"] = (
        SCORE_WEIGHTS["passing_year_eligibility"] if passing_year_passed else 0.0
    )
    if not passing_year_passed:
        eligibility_reasons.append(
            "Passing year is missing or not included in the job's eligible years"
        )

    score = round(min(100.0, max(0.0, sum(breakdown.values()))), 2)
    eligibility_status = "eligible" if not eligibility_reasons else "ineligible"

    if eligibility_status == "eligible":
        reason = f"Eligible candidate with a transparent match score of {score:g}%."
    else:
        reason = (
            f"Match score is {score:g}%, but compulsory eligibility requirements are not met: "
            + "; ".join(eligibility_reasons)
            + "."
        )

    return {
        "match_score": score,
        "matched_skills": [required_display[key] for key in sorted(matched_required)],
        "missing_required_skills": [
            required_display[key] for key in sorted(missing_required)
        ],
        "matched_preferred_skills": [
            preferred_display[key] for key in sorted(matched_preferred)
        ],
        "eligibility_status": eligibility_status,
        "eligibility_reasons": eligibility_reasons,
        "score_breakdown": {key: round(value, 2) for key, value in breakdown.items()},
        "recommendation_reason": reason,
    }


class JobRecommendationService:
    """Load, score, filter, sort, and paginate active MongoDB jobs."""

    def __init__(self, database: "AsyncIOMotorDatabase") -> None:
        self.database = database

    @staticmethod
    def _build_job_query(filters: RecommendationFilters) -> dict[str, Any]:
        """Build an indexed MongoDB filter for fields known before scoring."""
        query: dict[str, Any] = {"is_active": True}
        if filters.location:
            query["location"] = {"$regex": re.escape(filters.location.strip()), "$options": "i"}
        if filters.workplace_type:
            query["workplace_type"] = normalise_text(filters.workplace_type)
        if filters.employment_type:
            query["employment_type"] = normalise_text(filters.employment_type)
        if filters.search:
            pattern = re.escape(filters.search.strip())
            query["$or"] = [
                {"title": {"$regex": pattern, "$options": "i"}},
                {"company": {"$regex": pattern, "$options": "i"}},
                {"description": {"$regex": pattern, "$options": "i"}},
            ]
        if filters.skills:
            patterns = [re.compile(f"^{re.escape(skill)}$", re.IGNORECASE) for skill in normalise_values(filters.skills)]
            if patterns:
                query["$and"] = [
                    {
                        "$or": [
                            {"required_skills": {"$in": patterns}},
                            {"preferred_skills": {"$in": patterns}},
                        ]
                    }
                ]
        return query

    async def get_recommendations(
        self,
        current_user: Mapping[str, Any],
        filters: Optional[RecommendationFilters] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        """Return ranked recommendations using two database queries at most.

        User preferences are loaded once, all matching active jobs are loaded in a
        single cursor operation, and score-dependent filtering/pagination happens
        after deterministic scoring.
        """
        if page < 1:
            raise ValueError("page must be at least 1")
        if page_size < 1 or page_size > 100:
            raise ValueError("page_size must be between 1 and 100")

        active_filters = filters or RecommendationFilters()
        minimum_score = min(100.0, max(0.0, active_filters.minimum_match_score))
        user_id = str(current_user.get("id") or current_user.get("_id") or "")

        preference = await self.database["user_job_preferences"].find_one(
            {"user_id": user_id}, {"_id": 0, "user_id": 0}
        )
        profile = dict(current_user)
        if preference:
            profile.update(preference)

        jobs = await self.database["jobs"].find(
            self._build_job_query(active_filters)
        ).to_list(length=None)

        recommendations: list[dict[str, Any]] = []
        for job in jobs:
            job_data = dict(job)
            job_data["id"] = str(job_data.pop("_id", job_data.get("id", "")))
            result = calculate_job_match(profile, job_data)
            if result["match_score"] >= minimum_score:
                recommendations.append({"job": job_data, **result})

        recommendations.sort(
            key=lambda item: (
                0 if item["eligibility_status"] == "eligible" else 1,
                -item["match_score"],
                normalise_text(item["job"].get("title")),
            )
        )

        total_items = len(recommendations)
        total_pages = math.ceil(total_items / page_size) if total_items else 0
        start = (page - 1) * page_size
        items = recommendations[start : start + page_size]
        return {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1 and total_pages > 0,
            },
        }
