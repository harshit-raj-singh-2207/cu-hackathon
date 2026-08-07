import asyncio
import unittest
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from app.controllers.interview_recording_controller import InterviewRecordingController
from app.services.interview_recording_service import InterviewRecordingService
from app.models.interview_recording import RecordingStatus, ReplayEventType
from app.schemas.interview_recording import (
    InterviewRecordingCreate,
    InterviewRecordingUpdate,
    ReplayEventCreate,
    MistakeMarkerCreate,
    AICommentCreate,
    BookmarkCreate,
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


class InterviewRecordingTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.mock_db = MockDatabase()
        
        # Seed a test user
        self.user_id = str(ObjectId())
        self.mock_db["users"].docs.append({
            "_id": ObjectId(self.user_id),
            "email": "recording-test@copilot.dev",
            "is_active": True,
        })
        
        # Seed a test interview session
        self.mock_db["interview_sessions"].docs.append({
            "session_id": "test-session-rec-123",
            "user_id": self.user_id,
        })

        self.ctrl = InterviewRecordingController(self.mock_db)

    async def test_recording_lifecycle_and_transitions(self):
        # 1. Create Recording
        create_payload = InterviewRecordingCreate(
            interview_session_id="test-session-rec-123",
            recording_type="video",
            recording_status=RecordingStatus.CREATED,
            video_url="http://storage.copilot.dev/rec1.mp4"
        )
        rec = await self.ctrl.create_recording(self.user_id, create_payload)
        self.assertEqual(rec["recording_status"], RecordingStatus.CREATED)
        recording_id = rec["id"]

        # 2. Prevent Duplicate Recording for the same session
        with self.assertRaises(HTTPException) as ctx:
            await self.ctrl.create_recording(self.user_id, create_payload)
        self.assertEqual(ctx.exception.status_code, 409)

        # 3. Update Status (Valid: CREATED -> INITIALIZING)
        update_payload = InterviewRecordingUpdate(recording_status=RecordingStatus.INITIALIZING)
        updated = await self.ctrl.update_recording(recording_id, self.user_id, update_payload)
        self.assertEqual(updated["recording_status"], RecordingStatus.INITIALIZING)

        # 4. Update Status (Invalid: INITIALIZING -> CREATED)
        invalid_payload = InterviewRecordingUpdate(recording_status=RecordingStatus.CREATED)
        with self.assertRaises(HTTPException) as ctx:
            await self.ctrl.update_recording(recording_id, self.user_id, invalid_payload)
        self.assertEqual(ctx.exception.status_code, 400)

    async def test_timeline_events_mistakes_bookmarks_and_analytics(self):
        # Create Recording
        create_payload = InterviewRecordingCreate(
            interview_session_id="test-session-rec-123",
            recording_type="video",
            recording_status=RecordingStatus.CREATED,
            duration=300.0
        )
        rec = await self.ctrl.create_recording(self.user_id, create_payload)
        recording_id = rec["id"]

        # 1. Add Chronological Timeline Events
        # Add event at timestamp 30
        e1 = ReplayEventCreate(
            timestamp=30.0,
            event_type=ReplayEventType.QUESTION_STARTED,
            title="Introduce yourself",
            description="Interviewer asked user to introduce themselves",
            metadata={"response_time": "5.0"}
        )
        await self.ctrl.store_event(recording_id, self.user_id, e1)

        # Add event at timestamp 10 (chronologically earlier, but added later)
        e2 = ReplayEventCreate(
            timestamp=10.0,
            event_type=ReplayEventType.RECORDING_STARTED,
            title="Warm greet",
            description="Candidate smiled warmly at start",
            metadata={}
        )
        await self.ctrl.store_event(recording_id, self.user_id, e2)

        # Get Events and assert timestamp sorted order
        events = await self.ctrl.get_events(recording_id, self.user_id)
        self.assertEqual(len(events), 2)
        self.assertEqual(events[0]["timestamp"], 10.0)
        self.assertEqual(events[1]["timestamp"], 30.0)

        # 2. Add Mistakes & Comments
        m1 = MistakeMarkerCreate(
            timestamp=45.0,
            category="Technical",
            severity="medium",
            title="Incorrect Big O complexity",
            description="Stated sorting took O(N) instead of O(N log N)",
            recommendation="Review standard sorting complexity charts."
        )
        await self.ctrl.store_mistake(recording_id, self.user_id, m1)

        c1 = AICommentCreate(
            timestamp=50.0,
            category="Confidence",
            comment="Composed and structured reply",
            importance="high"
        )
        await self.ctrl.store_comment(recording_id, self.user_id, c1)

        # 3. Add Bookmarks (checking uniqueness of timestamps)
        b1 = BookmarkCreate(timestamp=15.0, title="Key explanation")
        await self.ctrl.store_bookmark(recording_id, self.user_id, b1)

        b2 = BookmarkCreate(timestamp=15.0, title="Duplicate timestamp bookmark")
        with self.assertRaises(HTTPException) as ctx:
            await self.ctrl.store_bookmark(recording_id, self.user_id, b2)
        self.assertEqual(ctx.exception.status_code, 400)

        # 4. Fetch Replay State & Analytics
        replay_state = await self.client_get_replay(recording_id)
        self.assertEqual(len(replay_state["events"]), 2)
        self.assertEqual(len(replay_state["mistakes"]), 1)
        self.assertEqual(len(replay_state["bookmarks"]), 1)

        analytics = replay_state["analytics"]
        self.assertEqual(analytics["total_events"], 2)
        self.assertEqual(analytics["mistake_count"], 1)
        self.assertEqual(analytics["bookmark_count"], 1)
        self.assertEqual(analytics["average_response_time"], 5.0)
        self.assertEqual(analytics["session_duration"], 300.0)

    async def client_get_replay(self, recording_id: str):
        # Helper representing the aggregate endpoint loader
        recording = await self.ctrl.get_recording(recording_id, self.user_id)
        events = await self.ctrl.get_events(recording_id, self.user_id)
        mistakes = await self.ctrl.get_mistakes(recording_id, self.user_id)
        comments = await self.ctrl.get_comments(recording_id, self.user_id)
        bookmarks = await self.ctrl.get_bookmarks(recording_id, self.user_id)
        analytics = await self.ctrl.get_analytics(recording_id, self.user_id)
        return {
            "recording": recording,
            "events": events,
            "mistakes": mistakes,
            "comments": comments,
            "bookmarks": bookmarks,
            "analytics": analytics,
        }


if __name__ == "__main__":
    unittest.main()
