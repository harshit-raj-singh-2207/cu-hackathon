"""Analytics business-rule tests; no live MongoDB is required."""

import unittest
from fastapi import HTTPException
from app.api.v1.analytics import _require_admin
from app.utils.analytics_calculator import (
    calculate_placement_rate, calculate_readiness, calculate_recruitment_funnel,
    calculate_skill_gap, generate_suggestions, normalize_skill, readiness_level,
)


class AnalyticsCalculatorTests(unittest.TestCase):
    def test_readiness_weighted_formula(self):
        result = calculate_readiness({"resume_score": 82, "ats_score": 74, "coding_score": 69,
            "mock_interview_score": 78, "profile_completion": 90})
        self.assertEqual(result["readiness_score"], 76.95)
        self.assertEqual(result["readiness_level"], "Placement Ready")

    def test_readiness_levels(self):
        self.assertEqual([readiness_level(v) for v in (0, 40, 60, 75, 90, 100)], [
            "Needs Major Improvement", "Developing", "Almost Ready", "Placement Ready",
            "Highly Placement Ready", "Highly Placement Ready"])

    def test_missing_readiness_metrics_adjust_weights_and_clamp(self):
        result = calculate_readiness({"resume_score": 120, "ats_score": -5})
        self.assertEqual(result["readiness_score"], 50)
        self.assertIn("coding_score", result["missing_metrics"])

    def test_skill_normalization(self):
        for raw, expected in ((" JS ", "javascript"), ("React.js", "react"),
            ("node.js", "nodejs"), ("Mongo DB", "mongodb"), ("ML", "machine learning")):
            with self.subTest(raw=raw): self.assertEqual(normalize_skill(raw), expected)

    def test_skill_gap_demand_priority_and_job_match(self):
        result = calculate_skill_gap(["JS", "React"], [
            {"id": "1", "title": "Frontend", "required_skills": ["JavaScript", "React", "Node.js"]},
            {"id": "2", "title": "Backend", "required_skills": ["Node JS", "Mongo DB"]}])
        node = next(row for row in result["missing_skills"] if row["skill"] == "nodejs")
        self.assertEqual(node["priority"], "high")
        self.assertEqual(node["demand_percentage"], 100)
        self.assertEqual(result["job_wise_gap"][0]["match_percentage"], 66.67)

    def test_skill_gap_empty_jobs_is_safe(self):
        result = calculate_skill_gap(["python"], [])
        self.assertEqual(result["skill_match_percentage"], 0)
        self.assertEqual(result["missing_skills"], [])

    def test_suggestion_rules_are_prioritized(self):
        readiness = calculate_readiness({"resume_score": 50, "ats_score": 40, "coding_score": 30,
            "mock_interview_score": 20, "profile_completion": 50})
        rows = generate_suggestions(readiness, {"missing_skills": [{"skill": "nodejs", "priority": "high"}]},
            {"has_resume": False, "has_projects": False, "application_count": 0})
        self.assertEqual(rows[0]["priority"], "high")
        self.assertTrue({"ATS", "Coding", "Interview", "Profile"}.issubset({row["category"] for row in rows}))
        self.assertEqual([row["id"] for row in rows], [f"suggestion_{i}" for i in range(1, len(rows)+1)])

    def test_department_placement_rate_and_zero_division(self):
        self.assertEqual(calculate_placement_rate(84, 110), 76.36)
        self.assertEqual(calculate_placement_rate(10, 0), 0)

    def test_recruitment_funnel_conversions_and_largest_drop(self):
        result = calculate_recruitment_funnel({"registered": 500, "resume_uploaded": 420,
            "applied": 310, "interviewed": 180, "offer_received": 105, "placed": 92})
        self.assertEqual(result["funnel"][2]["conversion_from_previous_stage"], 73.81)
        self.assertEqual(result["largest_drop_off"]["from_stage"], "Applied")
        self.assertEqual(result["overall_placement_conversion"], 18.4)

    def test_empty_recruitment_funnel_is_safe(self):
        self.assertTrue(all(row["percentage_of_registered"] == 0 for row in calculate_recruitment_funnel({})["funnel"]))

    def test_student_role_rejected_and_admin_roles_allowed(self):
        with self.assertRaises(HTTPException) as error: _require_admin({"role": "student"})
        self.assertEqual(error.exception.status_code, 403)
        for role in ("admin", "placement_officer", "placement_cell"): _require_admin({"role": role})


if __name__ == "__main__":
    unittest.main()
