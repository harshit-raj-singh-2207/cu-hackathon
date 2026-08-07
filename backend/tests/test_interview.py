import unittest
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user
from app.database import get_database

class MockCollection:
    def __init__(self):
        self.docs = []

    async def insert_one(self, doc):
        doc = dict(doc)
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.docs.append(doc)
        class Result:
            inserted_id = doc["_id"]
        return Result()

    async def find_one(self, query):
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
            if match:
                return dict(doc)
        return None

    async def replace_one(self, query, replacement):
        for i, doc in enumerate(self.docs):
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
            if match:
                self.docs[i] = dict(replacement)
                break
        class Result:
            modified_count = 1
        return Result()


class MockDatabase:
    def __init__(self):
        self.collections = {
            "interview_sessions": MockCollection()
        }

    def __getitem__(self, name):
        return self.collections[name]


class InterviewApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = MockDatabase()
        from app.database import db_helper
        db_helper.db = cls.db
        app.dependency_overrides[get_current_user] = lambda: {"id": "test-user-123", "email": "test@example.com"}
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        from app.database import db_helper
        db_helper.db = None
        app.dependency_overrides.clear()

    def test_interview_session_workflow(self):
        # 1. Start an interview session
        payload = {
            "company": "Google",
            "job_role": "Software Engineer",
            "experience_level": "Mid (3-5 years)",
            "interview_type": "Technical DSA",
            "question_count": 3
        }
        response = self.client.post("/api/v1/interviews/sessions", json=payload)
        if response.status_code != 201:
            print("ERROR RESP:", response.text)
        self.assertEqual(response.status_code, 201)
        session_data = response.json()
        self.assertEqual(session_data["company"], "Google")
        self.assertEqual(session_data["job_role"], "Software Engineer")
        self.assertEqual(session_data["status"], "in_progress")
        self.assertEqual(session_data["question_count"], 3)
        self.assertEqual(session_data["answered_count"], 0)
        self.assertIsNotNone(session_data["current_question"])
        session_id = session_data["id"]

        # 2. Get the interview session details
        get_response = self.client.get(f"/api/v1/interviews/sessions/{session_id}")
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_response.json()["id"], session_id)

        # 3. Submit answers to all questions
        for i in range(3):
            # Fetch current question ID from session
            session_state = self.client.get(f"/api/v1/interviews/sessions/{session_id}").json()
            curr_q = session_state["current_question"]
            self.assertIsNotNone(curr_q)
            q_id = curr_q["id"]

            ans_payload = {
                "question_id": q_id,
                "answer": f"For question {q_id}, here is a detailed technical code structure solution using time and space complexity."
            }
            ans_response = self.client.post(f"/api/v1/interviews/sessions/{session_id}/answers", json=ans_payload)
            self.assertEqual(ans_response.status_code, 200)
            res_data = ans_response.json()
            self.assertIsNotNone(res_data["live_evaluation"])

        # 4. Once finished, session status should be completed, and report should be available
        final_state = self.client.get(f"/api/v1/interviews/sessions/{session_id}").json()
        self.assertEqual(final_state["status"], "completed")
        self.assertEqual(final_state["answered_count"], 3)
        self.assertIsNone(final_state["current_question"])

        # 5. Fetch final report
        report_response = self.client.get(f"/api/v1/interviews/sessions/{session_id}/report")
        self.assertEqual(report_response.status_code, 200)
        report_data = report_response.json()
        self.assertIn("overall_score", report_data)
        self.assertIn("question_feedback", report_data)
