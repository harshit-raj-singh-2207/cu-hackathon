"""Unit tests for pure placement analytics calculations."""

import unittest
from app.services.placement_analytics_service import build_funnel, build_skill_gaps, calculate_selection_rate


class PlacementAnalyticsCalculationTests(unittest.TestCase):
    def test_cumulative_funnel(self):
        funnel = build_funnel({"applied": 4, "screening": 3, "interview": 2, "selected": 1, "rejected": 2})
        self.assertEqual([stage["count"] for stage in funnel], [12, 6, 3, 1])
        self.assertEqual(funnel[0]["percentage"], 100)

    def test_empty_funnel(self):
        self.assertTrue(all(stage["percentage"] == 0 for stage in build_funnel({})))
        self.assertEqual(calculate_selection_rate({}), 0)

    def test_selection_rate(self):
        self.assertEqual(calculate_selection_rate({"applied": 8, "selected": 2}), 20)

    def test_negative_counts_do_not_reduce_totals(self):
        self.assertEqual(calculate_selection_rate({"applied": -10, "selected": 1}), 100)

    def test_skill_gaps_are_deduplicated_and_ranked(self):
        recommendations = [
            {"missing_required_skills": [" TypeScript ", "GraphQL"]},
            {"missing_required_skills": ["typescript", "Docker"]},
        ]
        gaps = build_skill_gaps(recommendations)
        self.assertEqual(gaps[0]["skill"], "TypeScript")
        self.assertEqual(gaps[0]["missing_from_jobs"], 2)
        self.assertEqual(gaps[0]["severity"], "high")

    def test_skill_gap_limit(self):
        recommendations = [{"missing_required_skills": [f"Skill {index}" for index in range(10)]}]
        self.assertEqual(len(build_skill_gaps(recommendations, limit=3)), 3)


if __name__ == "__main__":
    unittest.main()
