"""Async orchestration for student and institution placement analytics."""

from __future__ import annotations

import asyncio
from collections import Counter
from datetime import datetime, timedelta, timezone
from statistics import median
from typing import Any, Mapping

from app.utils.analytics_calculator import (
    calculate_placement_rate, calculate_readiness, calculate_recruitment_funnel,
    calculate_skill_gap, generate_suggestions, normalize_skills,
)

APPLICATION_STATUSES = ("saved", "applied", "screening", "interview", "selected", "rejected", "withdrawn")


def build_funnel(status_counts: Mapping[str, int]) -> list[dict[str, Any]]:
    total = sum(max(0, int(status_counts.get(status, 0))) for status in APPLICATION_STATUSES)
    values = (
        ("applications", "Applications Tracked", total),
        ("screening", "Recruiter Screening", sum(max(0, int(status_counts.get(s, 0))) for s in ("screening", "interview", "selected"))),
        ("interview", "Interviews", sum(max(0, int(status_counts.get(s, 0))) for s in ("interview", "selected"))),
        ("selected", "Selected", max(0, int(status_counts.get("selected", 0)))),
    )
    return [{"stage": key, "label": label, "count": count, "percentage": round(count / total * 100, 2) if total else 0.0} for key, label, count in values]


def calculate_selection_rate(status_counts: Mapping[str, int]) -> float:
    total = sum(max(0, int(status_counts.get(status, 0))) for status in APPLICATION_STATUSES)
    return round(max(0, int(status_counts.get("selected", 0))) / total * 100, 2) if total else 0.0


def build_skill_gaps(recommendations: list[Mapping[str, Any]], limit: int = 6) -> list[dict[str, Any]]:
    missing, display = Counter(), {}
    for item in recommendations:
        for raw in item.get("missing_required_skills", []):
            key = str(raw).strip().casefold()
            if key:
                display.setdefault(key, str(raw).strip()); missing[key] += 1
    denominator = max(len(recommendations), 1)
    return [{"skill": display[key], "missing_from_jobs": count,
             "readiness_percentage": round(max(0, 100 - count / denominator * 100), 2),
             "severity": "high" if count / denominator > .5 else "medium" if count / denominator > .25 else "low"}
            for key, count in missing.most_common(limit)]


def _profile_completion(user: Mapping[str, Any]) -> float:
    fields = ("name", "email", "skills", "education", "portfolio_links", "profile_image_url", "resume_url")
    return round(sum(bool(user.get(field)) for field in fields) / len(fields) * 100, 2)


def _first_number(source: Mapping[str, Any], *paths: str) -> float | None:
    for path in paths:
        value: Any = source
        for key in path.split("."):
            value = value.get(key) if isinstance(value, Mapping) else None
        if value is not None:
            try: return float(value)
            except (TypeError, ValueError): pass
    return None


class PlacementAnalyticsService:
    """Read analytics from existing collections without creating duplicate records."""

    def __init__(self, database: Any) -> None:
        self.database = database

    async def _student_inputs(self, user: Mapping[str, Any]) -> tuple[dict, list, list, int]:
        user_id = str(user.get("id") or user.get("_id") or "")
        jobs_task = self.database["jobs"].find(
            {"is_active": True}, {"title": 1, "required_skills": 1, "preferred_skills": 1}
        ).limit(100).to_list(length=100)
        app_task = self.database["job_applications"].count_documents({"user_id": user_id})
        optional = await asyncio.gather(
            self.database["coding_scores"].find_one({"user_id": user_id}, sort=[("updated_at", -1)]),
            self.database["interview_results"].find_one({"user_id": user_id}, sort=[("updated_at", -1)]),
            jobs_task, app_task,
        )
        coding, interview, jobs, application_count = optional
        report = user.get("last_analysis_report") or {}
        scores = {
            "resume_score": _first_number(user, "resume_score", "last_analysis_report.score"),
            "ats_score": _first_number(user, "ats_score", "last_analysis_report.ats_score", "last_analysis_report.score"),
            "coding_score": _first_number(user, "coding_score") or _first_number(coding or {}, "score", "percentage"),
            "mock_interview_score": _first_number(user, "mock_interview_score", "interview_score") or _first_number(interview or {}, "score", "overall_score"),
            "profile_completion": _profile_completion(user),
        }
        skills = [*user.get("skills", []), *report.get("extracted_skills", [])]
        return scores, skills, jobs, int(application_count)

    async def readiness(self, user: Mapping[str, Any]) -> dict:
        scores, _, _, _ = await self._student_inputs(user)
        return calculate_readiness(scores)

    async def skill_gap(self, user: Mapping[str, Any]) -> dict:
        _, skills, jobs, _ = await self._student_inputs(user)
        return calculate_skill_gap(skills, jobs)

    async def student_dashboard(self, user: Mapping[str, Any]) -> dict:
        scores, skills, jobs, application_count = await self._student_inputs(user)
        readiness, gap = calculate_readiness(scores), calculate_skill_gap(skills, jobs)
        suggestions = generate_suggestions(readiness, gap, {
            "has_resume": bool(user.get("resume_url")), "has_projects": bool(user.get("projects")),
            "application_count": application_count,
        })
        user_id = str(user.get("id") or user.get("_id") or "")
        rows = await self.database["job_applications"].aggregate([
            {"$match": {"user_id": user_id}}, {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]).to_list(length=20)
        counts = {str(row["_id"]): row["count"] for row in rows}
        return {"success": True, "message": "Student analytics fetched successfully", "data": {
            "readiness": readiness, "skill_gap": gap, "suggestions": suggestions,
            "application_summary": {"total_applications": sum(counts.values()),
                "shortlisted": counts.get("screening", 0), "interviews": counts.get("interview", 0),
                "offers": counts.get("selected", 0)},
        }}

    async def suggestions(self, user: Mapping[str, Any]) -> list[dict]:
        data = await self.student_dashboard(user)
        return data["data"]["suggestions"]

    async def overview(self) -> dict:
        registered, applications, selected = await asyncio.gather(
            self.database["users"].count_documents({}), self.database["job_applications"].count_documents({}),
            self.database["job_applications"].count_documents({"status": "selected"}),
        )
        return {"total_students": registered, "total_applications": applications,
                "placed_students": selected, "placement_rate": calculate_placement_rate(selected, registered),
                "last_updated": datetime.now(timezone.utc)}

    async def department_comparison(self, filters: Mapping[str, Any]) -> dict:
        match = {key: value for key, value in filters.items() if value is not None and key in {"department", "batch", "graduation_year", "course"}}
        users = await self.database["users"].find(match, {"department": 1, "skills": 1, "readiness_score": 1,
            "ats_score": 1, "coding_score": 1, "interview_score": 1, "is_eligible": 1}).to_list(length=None)
        apps = await self.database["job_applications"].find({}, {"user_id": 1, "status": 1, "package_lpa": 1, "company": 1}).to_list(length=None)
        by_user: dict[str, list] = {}
        for row in apps: by_user.setdefault(str(row.get("user_id", "")), []).append(row)
        groups: dict[str, list] = {}
        for user in users: groups.setdefault(str(user.get("department") or "Unspecified"), []).append(user)
        departments = []
        for name, students in sorted(groups.items()):
            student_apps = [a for u in students for a in by_user.get(str(u.get("_id")), [])]
            placed_ids = {str(a.get("user_id")) for a in student_apps if a.get("status") == "selected"}
            packages = [float(a["package_lpa"]) for a in student_apps if a.get("status") == "selected" and isinstance(a.get("package_lpa"), (int, float))]
            skill_counts = Counter(skill for user in students for skill in normalize_skills(user.get("skills", [])))
            recruiters = Counter(str(a.get("company")) for a in student_apps if a.get("status") == "selected" and a.get("company"))
            eligible = sum(bool(u.get("is_eligible", True)) for u in students)
            avg = lambda field: round(sum(float(u.get(field, 0) or 0) for u in students) / len(students), 2) if students else 0
            departments.append({"department": name, "total_students": len(students), "eligible_students": eligible,
                "placed_students": len(placed_ids), "placement_rate": calculate_placement_rate(len(placed_ids), eligible),
                "total_offers": sum(a.get("status") == "selected" for a in student_apps),
                "average_package": round(sum(packages)/len(packages), 2) if packages else 0,
                "median_package": round(median(packages), 2) if packages else 0, "highest_package": max(packages, default=0),
                "average_readiness_score": avg("readiness_score"), "average_ats_score": avg("ats_score"),
                "average_coding_score": avg("coding_score"), "average_interview_score": avg("interview_score"),
                "top_skills": [{"skill": k, "student_count": v} for k,v in skill_counts.most_common(5)],
                "top_recruiters": [{"company": k, "offers": v} for k,v in recruiters.most_common(5)]})
        total, placed = sum(x["total_students"] for x in departments), sum(x["placed_students"] for x in departments)
        packages = [x["average_package"] for x in departments if x["average_package"]]
        return {"departments": departments, "overall": {"total_students": total, "placed_students": placed,
            "placement_rate": calculate_placement_rate(placed, total), "average_package": round(sum(packages)/len(packages), 2) if packages else 0,
            "highest_package": max((x["highest_package"] for x in departments), default=0)},
            "best_performing_department": max(departments, key=lambda x: x["placement_rate"])["department"] if departments else None,
            "last_updated": datetime.now(timezone.utc)}

    async def recruitment_funnel(self, filters: Mapping[str, Any]) -> dict:
        user_match = {key: value for key, value in filters.items() if value is not None and key in {"department", "batch", "graduation_year", "course"}}
        users = await self.database["users"].find(user_match, {"resume_url": 1, "placement_status": 1}).to_list(length=None)
        ids = [str(user["_id"]) for user in users]
        apps = await self.database["job_applications"].find({"user_id": {"$in": ids}}, {"user_id": 1, "status": 1}).to_list(length=None)
        applied = {str(a["user_id"]) for a in apps}
        interviewed = {str(a["user_id"]) for a in apps if a.get("status") in {"interview", "selected"}}
        offered = {str(a["user_id"]) for a in apps if a.get("status") == "selected"}
        placed = offered | {str(u["_id"]) for u in users if u.get("placement_status") in {"placed", "accepted"}}
        return calculate_recruitment_funnel({"registered": len(users), "resume_uploaded": sum(bool(u.get("resume_url")) for u in users),
            "applied": len(applied), "interviewed": len(interviewed), "offer_received": len(offered), "placed": len(placed)})

    async def admin_dashboard(self, filters: Mapping[str, Any]) -> dict:
        overview, departments, funnel = await asyncio.gather(self.overview(), self.department_comparison(filters), self.recruitment_funnel(filters))
        return {"success": True, "message": "Admin analytics fetched successfully", "data": {
            "overview": overview, "department_comparison": departments, "recruitment_funnel": funnel}}

    async def get_dashboard(self, current_user: Mapping[str, Any], period_days: int = 30) -> dict[str, Any]:
        """Backward-compatible response for the existing `/placement` endpoint."""
        if period_days not in {7, 30, 90, 365}: raise ValueError("period_days must be one of 7, 30, 90, or 365")
        now, user_id = datetime.now(timezone.utc), str(current_user.get("id") or current_user.get("_id") or "")
        rows = await self.database["job_applications"].aggregate([{"$match": {"user_id": user_id}}, {"$group": {"_id": "$status", "count": {"$sum": 1}}}]).to_list(length=20)
        counts = {row["_id"]: row["count"] for row in rows}; rate = calculate_selection_rate(counts)
        gap = await self.skill_gap(current_user)
        legacy_gaps = [{"skill": x["skill"], "missing_from_jobs": x["required_by_jobs"], "readiness_percentage": round(100-x["demand_percentage"], 2), "severity": x["priority"]} for x in gap["missing_skills"][:6]]
        return {"period": {"key": f"{period_days}d", "from_date": now-timedelta(days=period_days), "to_date": now},
            "funnel": build_funnel(counts), "metrics": {"selection_rate": {"value": rate, "unit": "percent", "benchmark": 3, "change": 0, "trend": "flat", "status": "above_benchmark" if rate >= 3 else "below_benchmark"},
            "interview_frequency": {"value": 0, "unit": "per_week", "benchmark": 1, "change": 0, "trend": "flat", "status": "below_benchmark"}},
            "status_counts": {s: counts.get(s, 0) for s in APPLICATION_STATUSES}, "skill_gaps": legacy_gaps,
            "learning_focus": [{"priority": i, "skill": x["skill"], "recommendation": f"Build and demonstrate practical proficiency in {x['skill']}."} for i,x in enumerate(legacy_gaps[:3], 1)],
            "total_applications": sum(counts.values()), "last_updated": now}
