"""Unit tests for pure job recommendation score calculations."""

import unittest

from app.services.job_recommendation_service import (
    JobRecommendationService,
    RecommendationFilters,
    calculate_job_match,
)


def complete_job(**overrides):
    """Return a fully eligible job fixture with deterministic requirements."""
    job = {
        "title": "Frontend Engineer",
        "location": "Bengaluru",
        "workplace_type": "remote",
        "employment_type": "full-time",
        "required_skills": ["React", "TypeScript"],
        "preferred_skills": ["GraphQL"],
        "min_cgpa": 7.0,
        "min_experience": 1.0,
        "eligibility_departments": ["Computer Science"],
        "eligible_passing_years": [2026],
    }
    job.update(overrides)
    return job


def complete_profile(**overrides):
    """Return a profile satisfying every fixture requirement and preference."""
    profile = {
        "skills": ["React", "TypeScript", "GraphQL"],
        "preferred_roles": ["Frontend Engineer"],
        "preferred_locations": ["Bengaluru"],
        "preferred_workplace_types": ["remote"],
        "preferred_employment_types": ["full-time"],
        "cgpa": 8.5,
        "experience": 2,
        "department": "Computer Science",
        "passing_year": 2026,
    }
    profile.update(overrides)
    return profile


class CalculateJobMatchTests(unittest.TestCase):
    """Exercise deterministic score categories and compulsory eligibility."""

    def test_exact_skill_match_is_case_insensitive_and_deduplicated(self):
        result = calculate_job_match(
            complete_profile(skills=[" react ", "REACT", "typescript", "graphql"]),
            complete_job(),
        )
        self.assertEqual(result["score_breakdown"]["required_skills"], 40)
        self.assertEqual(result["matched_skills"], ["React", "TypeScript"])

    def test_partial_skill_match(self):
        result = calculate_job_match(
            complete_profile(skills=["React", "GraphQL"]), complete_job()
        )
        self.assertEqual(result["score_breakdown"]["required_skills"], 20)
        self.assertEqual(result["eligibility_status"], "ineligible")

    def test_missing_skills_are_reported(self):
        result = calculate_job_match(complete_profile(skills=[]), complete_job())
        self.assertEqual(result["score_breakdown"]["required_skills"], 0)
        self.assertEqual(result["missing_required_skills"], ["React", "TypeScript"])

    def test_cgpa_below_requirement_is_ineligible(self):
        result = calculate_job_match(complete_profile(cgpa=6.9), complete_job())
        self.assertEqual(result["score_breakdown"]["cgpa_eligibility"], 0)
        self.assertEqual(result["eligibility_status"], "ineligible")
        self.assertTrue(any("CGPA" in reason for reason in result["eligibility_reasons"]))

    def test_wrong_department_is_ineligible(self):
        result = calculate_job_match(
            complete_profile(department="Mechanical Engineering"), complete_job()
        )
        self.assertEqual(result["score_breakdown"]["department_eligibility"], 0)
        self.assertEqual(result["eligibility_status"], "ineligible")

    def test_remote_preference_match(self):
        result = calculate_job_match(complete_profile(), complete_job())
        self.assertEqual(result["score_breakdown"]["workplace_preference"], 3)

    def test_empty_user_profile_is_handled(self):
        result = calculate_job_match({}, complete_job())
        self.assertEqual(result["eligibility_status"], "ineligible")
        self.assertGreaterEqual(result["match_score"], 0)

    def test_maximum_score_boundary(self):
        result = calculate_job_match(complete_profile(), complete_job())
        self.assertEqual(result["match_score"], 100)
        self.assertEqual(result["eligibility_status"], "eligible")

    def test_score_always_remains_in_range(self):
        cases = [
            ({}, complete_job()),
            (complete_profile(), complete_job()),
            (complete_profile(), complete_job(required_skills=[])),
        ]
        for profile, job in cases:
            with self.subTest(profile=profile, job=job):
                score = calculate_job_match(profile, job)["match_score"]
                self.assertGreaterEqual(score, 0)
                self.assertLessEqual(score, 100)


class FakeCursor:
    """Minimal async Motor cursor replacement used by service tests."""

    def __init__(self, documents):
        self.documents = documents

    async def to_list(self, length=None):
        return list(self.documents)


class FakeCollection:
    """Minimal collection recording service queries."""

    def __init__(self, documents=None, one=None):
        self.documents = documents or []
        self.one = one
        self.last_query = None

    async def find_one(self, query, projection=None):
        self.last_query = query
        return self.one

    def find(self, query):
        self.last_query = query
        return FakeCursor(self.documents)


class FakeDatabase:
    def __init__(self, jobs, preference=None):
        self.collections = {
            "jobs": FakeCollection(jobs),
            "user_job_preferences": FakeCollection(one=preference),
        }

    def __getitem__(self, name):
        return self.collections[name]


class JobRecommendationServiceTests(unittest.IsolatedAsyncioTestCase):
    """Verify sorting, filtering, preference loading, and pagination behavior."""

    async def test_eligible_jobs_sort_before_higher_scoring_ineligible_jobs(self):
        eligible = complete_job(
            _id="eligible", title="Backend Engineer", required_skills=["Python"],
            preferred_skills=[], min_cgpa=None, eligibility_departments=[],
            eligible_passing_years=[], min_experience=0,
        )
        ineligible = complete_job(_id="ineligible", title="Frontend Engineer")
        database = FakeDatabase(
            [ineligible, eligible],
            {"preferred_roles": ["Frontend Engineer"], "preferred_workplace_types": ["remote"]},
        )
        result = await JobRecommendationService(database).get_recommendations(
            {"id": "user-1", "skills": ["Python"]}
        )
        self.assertEqual(result["items"][0]["job"]["id"], "eligible")
        self.assertEqual(result["items"][1]["eligibility_status"], "ineligible")

    async def test_minimum_score_filter_and_pagination(self):
        jobs = [
            complete_job(
                _id=str(index), title=f"Role {index}", required_skills=["Python"],
                preferred_skills=[], min_cgpa=None, min_experience=0,
                eligibility_departments=[], eligible_passing_years=[],
            )
            for index in range(3)
        ]
        database = FakeDatabase(jobs)
        result = await JobRecommendationService(database).get_recommendations(
            {"id": "user-1", "skills": ["Python"]},
            RecommendationFilters(minimum_match_score=70), page=2, page_size=2,
        )
        self.assertEqual(result["pagination"]["total_items"], 3)
        self.assertEqual(result["pagination"]["total_pages"], 2)
        self.assertEqual(len(result["items"]), 1)

    async def test_query_filters_are_forwarded_to_mongodb(self):
        database = FakeDatabase([])
        filters = RecommendationFilters(
            search="C++ (Platform)", location="Remote", workplace_type="remote",
            employment_type="contract", skills=("Python",),
        )
        await JobRecommendationService(database).get_recommendations(
            {"id": "user-1"}, filters
        )
        query = database.collections["jobs"].last_query
        self.assertTrue(query["is_active"])
        self.assertEqual(query["workplace_type"], "remote")
        self.assertEqual(query["employment_type"], "contract")
        self.assertIn("$or", query)
        self.assertIn("$and", query)


if __name__ == "__main__":
    unittest.main()
