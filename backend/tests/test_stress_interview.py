import asyncio
import unittest
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from app.controllers.stress_interview_controller import StressInterviewController
from app.services.stress_interview_service import StressInterviewService
from app.schemas.stress_interview import (
    StressSessionStart,
    StressSessionConfigure,
    StressEventCreate,
)

# --- Lightweight Async In-Memory MongoDB Mock ---
class MockCursor:
    def __init__(self, data, sort_key=None, sort_dir=-1):
        self.data = data
        if sort_key:
            self.data = sorted(
                self.data,
                key=lambda x: x.get(sort_key) if x.get(sort_key) is not None else 0,
                reverse=(sort_dir == -1)
            )

    def sort(self, key, direction=-1):
        return MockCursor(self.data, sort_key=key, sort_dir=direction)

    def skip(self, num):
        self.data = self.data[num:]
        return self

    def limit(self, num):
        self.data = self.data[:num]
        return self

    async def to_list(self, length=None):
        return self.data


class MockCollection:
    def __init__(self, name):
        self.name = name
        self.docs = []

    async def insert_one(self, doc):
        doc = dict(doc)
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.docs.append(doc)
        class Result:
            inserted_id = doc["_id"]
        return Result()

    async def insert_many(self, docs):
        inserted_ids = []
        for doc in docs:
            if "_id" not in doc:
                doc["_id"] = ObjectId()
            inserted_ids.append(doc["_id"])
            self.docs.append(doc)
        class Result:
            self.inserted_ids = inserted_ids
        return Result()

    async def find_one(self, query, sort=None):
        matches = self._find_matches(query)
        if not matches:
            return None
        if sort:
            sort_key, direction = sort[0]
            matches = sorted(matches, key=lambda x: x.get(sort_key, 0), reverse=(direction == -1))
        return dict(matches[0])

    async def find_one_and_update(self, query, updates, upsert=False, return_document=True):
        doc = await self.find_one(query)
        set_vals = updates.get("$set", {})
        if not doc:
            if upsert:
                doc = {"_id": ObjectId(), **query, **set_vals}
                self.docs.append(doc)
                return doc
            return None
        doc.update(set_vals)
        for d in self.docs:
            if d["_id"] == doc["_id"]:
                d.update(set_vals)
        return doc

    def find(self, query):
        matches = self._find_matches(query)
        return MockCursor(matches)

    async def count_documents(self, query):
        return len(self._find_matches(query))

    async def delete_one(self, query):
        doc = await self.find_one(query)
        if doc:
            self.docs = [d for d in self.docs if d["_id"] != doc["_id"]]
            class Result:
                deleted_count = 1
            return Result()
        class Result:
            deleted_count = 0
        return Result()

    async def delete_many(self, query):
        matches = self._find_matches(query)
        match_ids = {m["_id"] for m in matches}
        self.docs = [d for d in self.docs if d["_id"] not in match_ids]
        class Result:
            deleted_count = len(match_ids)
        return Result()

    async def create_index(self, *args, **kwargs):
        pass

    def _find_matches(self, query):
        matches = []
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if k == "$or":
                    or_match = False
                    for cond in v:
                        cond_match = True
                        for ck, cv in cond.items():
                            if doc.get(ck) != cv:
                                cond_match = False
                        if cond_match:
                            or_match = True
                            break
                    if not or_match:
                        match = False
                elif doc.get(k) != v:
                    match = False
            if match:
                matches.append(doc)
        return matches


class MockDatabase:
    def __init__(self):
        self.collections = {}

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]


class StressInterviewTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.mock_db = MockDatabase()
        
        # Seed a test user
        self.user_id = str(ObjectId())
        self.mock_db["users"].docs.append({
            "_id": ObjectId(self.user_id),
            "email": "stress-test@copilot.dev",
            "is_active": True,
        })
        
        # Seed a test interview session
        self.mock_db["interview_sessions"].docs.append({
            "session_id": "test-interview-stress-123",
            "user_id": self.user_id,
        })

        self.ctrl = StressInterviewController(self.mock_db)

    async def test_session_lifecycle_and_configuration(self):
        # 1. Start Session
        start_payload = StressSessionStart(
            interview_session_id="test-interview-stress-123",
            pressure_level="Medium",
            challenge_mode=False
        )
        session_data = await self.ctrl.start_session(self.user_id, start_payload)
        self.assertEqual(session_data["status"], "started")
        self.assertEqual(session_data["pressure_level"], "Medium")
        session_id = session_data["session_id"]

        # 2. Prevent Duplicate Active Session
        with self.assertRaises(HTTPException) as ctx:
            await self.ctrl.start_session(self.user_id, start_payload)
        self.assertEqual(ctx.exception.status_code, 400)

        # 3. Configure/Modify Settings
        config_payload = StressSessionConfigure(
            session_id=session_id,
            pressure_level="High",
            challenge_mode=True
        )
        configured_session = await self.ctrl.configure_session(self.user_id, config_payload)
        self.assertEqual(configured_session["pressure_level"], "High")
        self.assertTrue(configured_session["challenge_mode"])
        # High pressure auto-toggled configurations
        self.assertTrue(configured_session["rapid_question_mode"])
        self.assertTrue(configured_session["interrupt_mode"])
        self.assertTrue(configured_session["counter_question_mode"])

        # 4. Stop Session
        stopped_session = await self.ctrl.stop_session(self.user_id, session_id)
        self.assertEqual(stopped_session["status"], "stopped")

    async def test_events_and_report_compilation(self):
        # Start Session
        start_payload = StressSessionStart(
            interview_session_id="test-interview-stress-123",
            pressure_level="High"
        )
        session_data = await self.ctrl.start_session(self.user_id, start_payload)
        session_id = session_data["session_id"]

        # Log some events
        events = [
            StressEventCreate(session_id=session_id, event_type="Question Interrupted", event_time=5.0, candidate_response_time=2.5, interrupt_triggered=True),
            StressEventCreate(session_id=session_id, event_type="Candidate Hesitated", event_time=12.0, candidate_response_time=4.5),
            StressEventCreate(session_id=session_id, event_type="Long Pause", event_time=25.0, candidate_response_time=8.0),
            StressEventCreate(session_id=session_id, event_type="Response Timeout", event_time=40.0, candidate_response_time=None)
        ]
        for event in events:
            await self.ctrl.store_event(self.user_id, event)

        # Stop session to trigger report calculation
        await self.ctrl.stop_session(self.user_id, session_id)

        # Get Report
        report = await self.ctrl.get_report(session_id, self.user_id)
        
        self.assertEqual(report["total_interruptions"], 1)
        self.assertEqual(report["long_pauses"], 1)
        self.assertEqual(report["hesitation_count"], 1)
        
        # Verify Calmness score: 100 - (hesitation*5 + long_pause*8 + timeout*15) = 100 - 28 = 72
        self.assertEqual(report["calmness_score"], 72.0)
        self.assertEqual(report["average_response_time"], 5.0)  # (2.5 + 4.5 + 8.0) / 3 = 5.0
        self.assertTrue(len(report["recommendations"]) > 0)


if __name__ == "__main__":
    unittest.main()
