import asyncio
import unittest
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from app.database import get_database
from app.controllers.webcam_analysis_controller import WebcamAnalysisController
from app.services.webcam_analysis_service import WebcamAnalysisService
from app.schemas.webcam_analysis import (
    BodyLanguageAnalysisCreate,
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


class WebcamAnalysisTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.mock_db = MockDatabase()
        
        # Seed a test user
        self.user_id = str(ObjectId())
        self.mock_db["users"].docs.append({
            "_id": ObjectId(self.user_id),
            "email": "test@copilot.dev",
            "is_active": True,
        })
        
        # Seed a test interview session
        self.mock_db["interview_sessions"].docs.append({
            "session_id": "test-interview-123",
            "user_id": self.user_id,
        })

        self.ctrl = WebcamAnalysisController(self.mock_db)

    async def test_session_lifecycle(self):
        # 1. Start Session
        session_data = await self.ctrl.start_session(self.user_id, "test-interview-123")
        self.assertEqual(session_data["status"], "started")
        self.assertIn("session_id", session_data)
        session_id = session_data["session_id"]

        # 2. Prevent Duplicate Active Session
        with self.assertRaises(HTTPException) as ctx:
            await self.ctrl.start_session(self.user_id, "test-interview-123")
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("active webcam session already exists", ctx.exception.detail)

        # 3. Retrieve Session Details
        session_details = await self.ctrl.get_session(session_id, self.user_id)
        self.assertEqual(session_details["session_id"], session_id)

        # 4. Stop Session
        stopped_session = await self.ctrl.stop_session(self.user_id, session_id)
        self.assertEqual(stopped_session["status"], "stopped")
        self.assertIsNotNone(stopped_session["duration"])

    async def test_frame_ingestion_and_timeline_events(self):
        # Start session
        session_data = await self.ctrl.start_session(self.user_id, "test-interview-123")
        session_id = session_data["session_id"]

        # Ingest Normal Frame
        frame1 = BodyLanguageAnalysisCreate(
            session_id=session_id,
            timestamp=1.0,
            eye_contact_score=85.0,
            eye_contact_status="Good",
            smile_score=10.0,
            smile_detected=False,
            head_pose="Forward",
            posture_score=90.0,
            hand_movement_score=20.0,
            attention_score=95.0,
            distraction_detected=False,
            confidence_score=80.0,
            face_visible=True,
            multiple_faces_detected=False,
            camera_off=False,
            frame_number=1
        )
        await self.ctrl.store_frame_analysis(self.user_id, frame1)

        # Ingest Bad Frame (should trigger Slouching/Bad Posture, Looking Away, lost eye contact)
        frame2 = BodyLanguageAnalysisCreate(
            session_id=session_id,
            timestamp=2.0,
            eye_contact_score=15.0,
            eye_contact_status="Lost",
            smile_score=10.0,
            smile_detected=False,
            head_pose="Left",
            posture_score=30.0,
            hand_movement_score=20.0,
            attention_score=20.0,
            distraction_detected=False,
            confidence_score=80.0,
            face_visible=True,
            multiple_faces_detected=False,
            camera_off=False,
            frame_number=2
        )
        await self.ctrl.store_frame_analysis(self.user_id, frame2)

        # Get Timeline Events
        events = await self.ctrl.get_timeline(session_id, self.user_id)
        event_types = {e["event_type"] for e in events}
        self.assertIn("Eye Contact Lost", event_types)
        self.assertIn("Looking Away", event_types)
        self.assertIn("Bad Posture", event_types)

    async def test_summary_and_report_generation(self):
        # Start Session
        session_data = await self.ctrl.start_session(self.user_id, "test-interview-123")
        session_id = session_data["session_id"]

        # Ingest multiple frames to compute averages
        frames = [
            BodyLanguageAnalysisCreate(session_id=session_id, timestamp=1.0, eye_contact_score=80, eye_contact_status="Good", smile_score=10, smile_detected=False, head_pose="Forward", posture_score=90, hand_movement_score=10, attention_score=90, distraction_detected=False, confidence_score=80, face_visible=True, multiple_faces_detected=False, camera_off=False, frame_number=1),
            BodyLanguageAnalysisCreate(session_id=session_id, timestamp=2.0, eye_contact_score=60, eye_contact_status="Lost", smile_score=30, smile_detected=True, head_pose="Left", posture_score=50, hand_movement_score=20, attention_score=50, distraction_detected=True, confidence_score=70, face_visible=True, multiple_faces_detected=False, camera_off=False, frame_number=2)
        ]
        for frame in frames:
            await self.ctrl.store_frame_analysis(self.user_id, frame)

        # Stop session (triggers summary compilation)
        await self.ctrl.stop_session(self.user_id, session_id)

        # Get Report
        report = await self.ctrl.get_report(session_id, self.user_id)
        
        self.assertEqual(report["average_eye_contact"], 70.0)
        self.assertEqual(report["average_posture"], 70.0)
        self.assertEqual(report["average_attention"], 70.0)
        self.assertEqual(report["average_smile"], 20.0)
        self.assertEqual(report["average_confidence"], 75.0)
        self.assertEqual(report["total_distractions"], 1)
        self.assertEqual(report["total_camera_off_events"], 0)
        self.assertEqual(report["overall_score"], 61.0)
        self.assertTrue(len(report["weaknesses"]) > 0)


if __name__ == "__main__":
    unittest.main()
