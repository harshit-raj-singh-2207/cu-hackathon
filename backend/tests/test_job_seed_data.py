"""Determinism and completeness tests for the realistic job seed dataset."""

import unittest
from seed_jobs import COMPANIES, JOBS, LOCATIONS, TITLE_PROFILES, build_seed_jobs


class JobSeedDataTests(unittest.TestCase):
    def test_contains_at_least_250_jobs(self):
        self.assertGreaterEqual(len(JOBS), 250)

    def test_seed_keys_are_unique(self):
        self.assertEqual(len({job["seed_key"] for job in JOBS}), len(JOBS))

    def test_generation_is_deterministic(self):
        first, second = build_seed_jobs(), build_seed_jobs()
        self.assertEqual(first, second)

    def test_every_job_has_search_fields(self):
        for job in JOBS:
            self.assertTrue(job["normalized_title"])
            self.assertTrue(job["normalized_company"])
            self.assertTrue(job["normalized_location"])
            self.assertTrue(job["normalized_skills"])
            self.assertTrue(job["search_terms"])

    def test_required_catalog_values_are_represented(self):
        self.assertTrue(set(COMPANIES).issubset({job["company"] for job in JOBS}))
        self.assertTrue({title for title, _, _ in TITLE_PROFILES}.issubset({job["title"] for job in JOBS}))
        self.assertTrue({location for location, _, _ in LOCATIONS}.issubset({job["location"] for job in JOBS}))

    def test_salary_ranges_are_realistic_and_ordered(self):
        for job in JOBS:
            self.assertGreaterEqual(job["salary_min"], 0)
            self.assertGreaterEqual(job["salary_max"], job["salary_min"])
            self.assertLessEqual(job["salary_max"], 4000000)


if __name__ == "__main__":
    unittest.main()
