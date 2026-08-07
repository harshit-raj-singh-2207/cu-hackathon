"""Unit tests for safe job search and autocomplete behavior."""

import re
import unittest
from app.services.job_search_service import JobSearchService, build_search_query, format_salary
from app.utils.search_normalization import normalize_search_text, prefix_pattern
from app.utils.skill_normalization import normalize_skill, normalize_skills


class Cursor:
    def __init__(self, rows): self.rows = rows
    def limit(self, value): self.rows = self.rows[:value]; return self
    async def to_list(self, length=None): return self.rows[:length] if length else self.rows


class Collection:
    def __init__(self, rows): self.rows = rows; self.query = None
    def find(self, query, projection=None): self.query = query; return Cursor(list(self.rows))


class Database:
    def __init__(self, rows): self.collection = Collection(rows)
    def __getitem__(self, name): return self.collection


class NormalizationTests(unittest.TestCase):
    def test_case_and_spaces_are_normalized(self):
        self.assertEqual(normalize_search_text("  REACT   Developer "), "react developer")

    def test_skill_aliases(self):
        self.assertEqual(normalize_skill("React.js"), "react")
        self.assertEqual(normalize_skills(["React", "react.js", " REACT "]), ["react"])

    def test_regex_characters_are_escaped(self):
        pattern = prefix_pattern("C++ (Platform)")
        re.compile(pattern)
        self.assertIn(r"\+", pattern)


class QueryBuilderTests(unittest.TestCase):
    def test_multiple_search_words_create_and_clauses(self):
        query = build_search_query({"search": "react bengaluru"})
        self.assertEqual(len(query["$and"]), 2)

    def test_location_and_remote_filters(self):
        query = build_search_query({"location": "Bengaluru", "workplace_type": "remote"})
        self.assertEqual(query["workplace_type"], "remote")
        self.assertIn("normalized_location", query)

    def test_salary_and_employment_filters(self):
        query = build_search_query({"min_salary": 800000, "max_salary": 1800000, "employment_type": "full-time"})
        self.assertEqual(query["salary_max"]["$gte"], 800000)
        self.assertEqual(query["salary_min"]["$lte"], 1800000)
        self.assertEqual(query["employment_type"], "full-time")

    def test_skill_filter_uses_all(self):
        query = build_search_query({"skills": ["React", "TypeScript"]})
        self.assertEqual(query["normalized_skills"]["$all"], ["react", "typescript"])

    def test_formatted_indian_salary(self):
        self.assertEqual(format_salary({"salary_min": 800000, "salary_max": 1800000, "salary_currency": "INR", "salary_period": "year"}), "₹8L – ₹18L per year")


class AutocompleteTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.rows = [{"title": "React Developer", "company": "Amazon", "location": "Bengaluru", "required_skills": ["React", "Redux"], "preferred_skills": ["TypeScript"]}, {"title": "Software Engineer", "company": "Microsoft", "location": "Remote India", "required_skills": ["Java"], "preferred_skills": []}]

    async def test_role_and_skill_prefix(self):
        result = await JobSearchService(Database(self.rows)).autocomplete("re", 10)
        values = {(item["value"], item["type"]) for item in result["suggestions"]}
        self.assertIn(("React Developer", "role"), values)
        self.assertIn(("React", "skill"), values)
        self.assertIn(("Redux", "skill"), values)

    async def test_company_prefix(self):
        result = await JobSearchService(Database(self.rows)).autocomplete("ama", 10)
        self.assertEqual(result["suggestions"][0]["value"], "Amazon")

    async def test_location_prefix(self):
        result = await JobSearchService(Database(self.rows)).autocomplete("bang", 10)
        self.assertEqual(result["suggestions"][0]["value"], "Bengaluru")

    async def test_limit_is_respected(self):
        result = await JobSearchService(Database(self.rows)).autocomplete("re", 2)
        self.assertLessEqual(len(result["suggestions"]), 2)


if __name__ == "__main__":
    unittest.main()
