import unittest

from app.services.job_description_service import JobDescriptionService


class JobDescriptionParserTests(unittest.TestCase):
    def setUp(self):
        self.service = JobDescriptionService({"job_descriptions": None})
        self.description = """Senior Backend Engineer\nResponsibilities:\n- Build scalable FastAPI services using Python and MongoDB.\n- Design REST APIs and collaborate with product teams.\nQualifications:\n- 3-5 years of experience with Python, Docker, AWS, and PostgreSQL.\n- Strong communication, system design, and problem solving skills."""

    def test_extracts_structured_job_description_data(self):
        result = self.service.parse(self.description)
        self.assertIn("python", result["technologies"])
        self.assertIn("fastapi", result["technologies"])
        self.assertIn("system design", result["skills"])
        self.assertIn("3-5 years", result["experience"])
        self.assertEqual(len(result["responsibilities"]), 2)
        self.assertEqual(len(result["qualifications"]), 2)
        self.assertIn("python", result["keywords"])
