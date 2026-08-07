"""Pure, defensive calculations used by placement analytics services."""

from __future__ import annotations

import math
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Iterable, Mapping

READINESS_WEIGHTS = {
    "resume_score": 0.20,
    "ats_score": 0.20,
    "coding_score": 0.25,
    "mock_interview_score": 0.25,
    "profile_completion": 0.10,
}

SKILL_ALIASES = {
    "js": "javascript", "react.js": "react", "reactjs": "react",
    "node.js": "nodejs", "node js": "nodejs", "mongo db": "mongodb",
    "mongo": "mongodb", "express.js": "express", "expressjs": "express",
    "ml": "machine learning", "ts": "typescript",
}


def clamp_score(value: Any) -> float | None:
    """Normalize a finite numeric value to the inclusive 0-100 range."""
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return round(min(100.0, max(0.0, number)), 2) if math.isfinite(number) else None


def readiness_level(score: float) -> str:
    if score < 40:
        return "Needs Major Improvement"
    if score < 60:
        return "Developing"
    if score < 75:
        return "Almost Ready"
    if score < 90:
        return "Placement Ready"
    return "Highly Placement Ready"


def calculate_readiness(scores: Mapping[str, Any]) -> dict[str, Any]:
    """Calculate readiness using available metrics and proportionally adjusted weights."""
    normalized = {key: clamp_score(scores.get(key)) for key in READINESS_WEIGHTS}
    missing = [key for key, value in normalized.items() if value is None]
    available_weight = sum(READINESS_WEIGHTS[key] for key in READINESS_WEIGHTS if normalized[key] is not None)
    score = (
        sum(normalized[key] * READINESS_WEIGHTS[key] for key in READINESS_WEIGHTS if normalized[key] is not None)
        / available_weight if available_weight else 0.0
    )
    score = round(score, 2)
    display = {key: (value if value is not None else 0.0) for key, value in normalized.items()}
    available = {key: value for key, value in normalized.items() if value is not None}
    label = lambda key: key.replace("_score", "").replace("_", " ").title()
    return {
        "readiness_score": score,
        "readiness_level": readiness_level(score),
        "component_scores": display,
        "weights": READINESS_WEIGHTS,
        "strongest_area": label(max(available, key=available.get)) if available else None,
        "weakest_area": label(min(available, key=available.get)) if available else None,
        "missing_metrics": missing,
        "last_updated": datetime.now(timezone.utc),
    }


def normalize_skill(value: Any) -> str:
    cleaned = re.sub(r"\s+", " ", str(value or "").strip().casefold())
    return SKILL_ALIASES.get(cleaned, cleaned)


def normalize_skills(values: Iterable[Any] | None) -> list[str]:
    return sorted({skill for skill in (normalize_skill(v) for v in values or []) if skill})


def calculate_skill_gap(student_skills: Iterable[Any], jobs: Iterable[Mapping[str, Any]]) -> dict[str, Any]:
    """Compare normalized student skills with unique requirements from each job."""
    students = set(normalize_skills(student_skills))
    job_list = list(jobs)
    demand: Counter[str] = Counter()
    job_wise = []
    for job in job_list:
        required = set(normalize_skills([*job.get("required_skills", []), *job.get("preferred_skills", [])]))
        for skill in required:
            demand[skill] += 1
        matched, missing = sorted(students & required), sorted(required - students)
        job_wise.append({
            "job_id": str(job.get("id") or job.get("_id") or ""),
            "job_title": str(job.get("title") or "Untitled job"),
            "matched_skills": matched, "missing_skills": missing,
            "match_percentage": round(len(matched) / len(required) * 100, 2) if required else 100.0,
        })
    count = len(job_list)
    required_skills = []
    missing_skills = []
    for skill, occurrences in sorted(demand.items(), key=lambda item: (-item[1], item[0])):
        percentage = round(occurrences / count * 100, 2) if count else 0.0
        required_skills.append({"skill": skill, "demand_count": occurrences, "demand_percentage": percentage})
        if skill not in students:
            priority = "high" if percentage >= 60 else "medium" if percentage >= 30 else "low"
            missing_skills.append({"skill": skill, "priority": priority, "required_by_jobs": occurrences, "demand_percentage": percentage})
    union = set(demand)
    return {
        "student_skills": sorted(students), "required_skills": required_skills,
        "matched_skills": sorted(students & union), "missing_skills": missing_skills,
        "skill_match_percentage": round(len(students & union) / len(union) * 100, 2) if union else 0.0,
        "job_wise_gap": job_wise,
    }


def calculate_placement_rate(placed: Any, eligible: Any) -> float:
    placed_count, eligible_count = max(0, int(placed or 0)), max(0, int(eligible or 0))
    return round(placed_count / eligible_count * 100, 2) if eligible_count else 0.0


def calculate_recruitment_funnel(counts: Mapping[str, Any]) -> dict[str, Any]:
    """Build conversions and the largest adjacent drop-off without zero division."""
    stages = [("Registered", "registered"), ("Resume Uploaded", "resume_uploaded"),
              ("Applied", "applied"), ("Interviewed", "interviewed"),
              ("Offer Received", "offer_received"), ("Placed", "placed")]
    registered = max(0, int(counts.get("registered", 0) or 0))
    funnel, drops = [], []
    previous = registered
    for index, (label, key) in enumerate(stages):
        count = max(0, int(counts.get(key, 0) or 0))
        conversion = 100.0 if index == 0 and registered else (round(count / previous * 100, 2) if previous else 0.0)
        funnel.append({"stage": label, "count": count,
                       "percentage_of_registered": round(count / registered * 100, 2) if registered else 0.0,
                       "conversion_from_previous_stage": conversion})
        if index:
            drop = max(0, previous - count)
            drops.append({"from_stage": stages[index-1][0], "to_stage": label,
                          "drop_off_count": drop,
                          "drop_off_percentage": round(drop / previous * 100, 2) if previous else 0.0})
        previous = count
    largest = max(drops, key=lambda row: row["drop_off_count"], default=None)
    return {"funnel": funnel, "largest_drop_off": largest,
            "overall_placement_conversion": round(funnel[-1]["percentage_of_registered"], 2),
            "last_updated": datetime.now(timezone.utc)}


def generate_suggestions(readiness: Mapping[str, Any], skill_gap: Mapping[str, Any], context: Mapping[str, Any]) -> list[dict[str, Any]]:
    """Generate deterministic, prioritized and actionable recommendations."""
    scores = readiness.get("component_scores", {})
    rows: list[dict[str, Any]] = []
    def add(category, title, description, priority, gain, url, reason):
        rows.append({"id": "", "category": category, "title": title, "description": description,
                     "priority": priority, "impact": "high" if gain >= 6 else "medium",
                     "estimated_score_gain": gain, "action_url": url, "reason": reason,
                     "status": "pending", "current_score": scores.get(category.casefold() + "_score", 100)})
    if scores.get("ats_score", 0) < 60:
        add("ATS", "Improve ATS keywords", f"Your ATS score is {scores.get('ats_score', 0):g}. Add role-specific keywords from matched jobs.", "high", 8, "/ats-score-checker", "ATS score is below 60")
    if scores.get("resume_score", 0) < 65:
        add("Resume", "Strengthen resume achievements", "Use a clear structure and add measurable outcomes to experience and project bullets.", "high", 7, "/resume", "Resume score is below 65")
    if scores.get("coding_score", 0) < 60:
        add("Coding", "Practice core DSA topics", "Practice arrays, strings, hashing and timed interview questions consistently.", "high", 8, "/coding", "Coding score is below 60")
    if scores.get("mock_interview_score", 0) < 60:
        add("Interview", "Complete two mock interviews", "Run two mock interviews and review technical clarity and communication feedback.", "high", 8, "/interview", "Mock interview score is below 60")
    if scores.get("profile_completion", 0) < 80:
        add("Profile", "Complete your profile", "Add missing education, skills, portfolio links and profile details.", "medium", 4, "/profile", "Profile completion is below 80")
    high_missing = [row["skill"] for row in skill_gap.get("missing_skills", []) if row.get("priority") == "high"]
    if high_missing:
        add("Skills", "Build projects with high-demand skills", "Demonstrate " + ", ".join(high_missing[:5]) + " in a portfolio project.", "high", 6, "/roadmap", "High-demand skills are missing")
    if not context.get("has_resume"):
        add("Resume", "Upload a resume", "Upload and analyze a resume to unlock evidence-based ATS and resume scoring.", "high", 10, "/resume", "No resume is uploaded")
    if not context.get("has_projects"):
        add("Projects", "Add at least two projects", "Add two role-relevant projects with stack, outcomes and source links.", "medium", 5, "/profile", "No projects are recorded")
    if not context.get("application_count"):
        add("Applications", "Apply to matched jobs", "Start with active jobs where your skill match is at least 70%.", "medium", 3, "/jobs", "No job applications are recorded")
    order = {"high": 0, "medium": 1, "low": 2}
    rows.sort(key=lambda row: (order[row["priority"]], -row["estimated_score_gain"], row["current_score"]))
    for index, row in enumerate(rows, 1):
        row["id"] = f"suggestion_{index}"
        row.pop("current_score", None)
    return rows
