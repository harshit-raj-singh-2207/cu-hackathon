"""Deterministic insights calculated from real recommendation results."""

from collections import Counter
from typing import TYPE_CHECKING, Any, Mapping
from app.services.job_search_service import JobSearchService

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorDatabase


class JobInsightsService:
    def __init__(self, database: "AsyncIOMotorDatabase") -> None:
        self.database = database

    async def generate(self, user: Mapping[str, Any]) -> dict[str, Any]:
        """Generate claims exclusively from current active jobs and scores."""
        result = await JobSearchService(self.database).recommendations(user, {}, 1, 500)
        items = result["items"]
        scores = [item["match_score"] for item in items]
        roles, locations, missing = Counter(), Counter(), Counter()
        for item in items:
            roles[item["title"]] += item["match_score"]
            locations[item["location"]] += 1
            missing.update(skill.casefold() for skill in item["missing_skills"])
        best_role = roles.most_common(1)[0][0] if roles else ""
        best_location = locations.most_common(1)[0][0] if locations else ""
        top_missing = [{"skill": skill, "jobs_count": count} for skill, count in missing.most_common(5)]
        eligible = sum(item["eligibility_status"] == "eligible" for item in items)
        high = sum(item["match_score"] >= 75 for item in items)
        average = round(sum(scores) / len(scores), 2) if scores else 0
        actions = [f"Learn {entry['skill']} to improve alignment with {entry['jobs_count']} evaluated jobs." for entry in top_missing[:3]]
        summary = f"You are eligible for {eligible} of {len(items)} evaluated active jobs with an average match score of {average}%."
        return {"summary": summary, "best_role": best_role, "best_location": best_location, "eligible_jobs_count": eligible, "high_match_jobs_count": high, "average_match_score": average, "top_missing_skills": top_missing, "recommended_actions": actions}
