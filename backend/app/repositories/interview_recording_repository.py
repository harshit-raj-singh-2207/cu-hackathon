from datetime import datetime, timezone
from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.interview_recording import (
    InterviewRecordingDocument,
    ReplayEventDocument,
    MistakeMarkerDocument,
    AICommentDocument,
    BookmarkDocument,
    RecordingAnalyticsDocument,
)


class InterviewRecordingRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.recordings = database["interview_recordings"]
        self.events = database["replay_events"]
        self.mistakes = database["mistake_markers"]
        self.comments = database["ai_comments"]
        self.bookmarks = database["bookmarks"]
        self.analytics = database["recording_analytics"]

    @staticmethod
    def _serialize(document: dict) -> dict:
        if not document:
            return document
        doc = dict(document)
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    # --- Recording ---
    async def create_recording(self, doc: InterviewRecordingDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.recordings.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_recording(self, recording_id: str) -> Optional[dict]:
        doc = await self.recordings.find_one({"_id": self._object_id(recording_id)})
        if not doc:
            # Fallback to string search if stored as string ID
            doc = await self.recordings.find_one({"recording_id": recording_id})
        return self._serialize(doc) if doc else None

    async def get_recording_by_session(self, interview_session_id: str) -> Optional[dict]:
        doc = await self.recordings.find_one({"interview_session_id": interview_session_id})
        return self._serialize(doc) if doc else None

    async def list_recordings(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        query = {"user_id": user_id}
        cursor = (
            self.recordings.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * limit)
            .limit(limit)
        )
        total = await self.recordings.count_documents(query)
        items = [self._serialize(doc) for doc in await cursor.to_list(length=limit)]
        return items, total

    async def update_recording(self, recording_id: str, updates: dict) -> Optional[dict]:
        result = await self.recordings.find_one_and_update(
            {"_id": self._object_id(recording_id)},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_recording(self, recording_id: str) -> bool:
        # Business Rule: Deleting an interview session should never automatically delete recordings.
        # But deleting a recording itself can cascade clean its own bookmarks, events, comments, mistakes, and analytics.
        await self.events.delete_many({"recording_id": recording_id})
        await self.mistakes.delete_many({"recording_id": recording_id})
        await self.comments.delete_many({"recording_id": recording_id})
        await self.bookmarks.delete_many({"recording_id": recording_id})
        await self.analytics.delete_many({"recording_id": recording_id})
        result = await self.recordings.delete_one({"_id": self._object_id(recording_id)})
        return result.deleted_count > 0

    # --- Replay Events ---
    async def create_event(self, doc: ReplayEventDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.events.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_events_for_recording(self, recording_id: str) -> List[dict]:
        # Chronological sorting constraint
        cursor = self.events.find({"recording_id": recording_id}).sort("timestamp", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=2000)]

    # --- Mistakes ---
    async def create_mistake(self, doc: MistakeMarkerDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.mistakes.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_mistakes_for_recording(self, recording_id: str) -> List[dict]:
        cursor = self.mistakes.find({"recording_id": recording_id}).sort("timestamp", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=1000)]

    # --- Comments ---
    async def create_comment(self, doc: AICommentDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.comments.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_comments_for_recording(self, recording_id: str) -> List[dict]:
        cursor = self.comments.find({"recording_id": recording_id}).sort("timestamp", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=1000)]

    # --- Bookmarks ---
    async def create_bookmark(self, doc: BookmarkDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.bookmarks.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_bookmark(self, bookmark_id: str) -> Optional[dict]:
        doc = await self.bookmarks.find_one({"_id": self._object_id(bookmark_id)})
        return self._serialize(doc) if doc else None

    async def get_bookmark_by_timestamp(self, recording_id: str, timestamp: float) -> Optional[dict]:
        doc = await self.bookmarks.find_one({"recording_id": recording_id, "timestamp": timestamp})
        return self._serialize(doc) if doc else None

    async def get_bookmarks_for_recording(self, recording_id: str) -> List[dict]:
        cursor = self.bookmarks.find({"recording_id": recording_id}).sort("timestamp", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=500)]

    async def delete_bookmark(self, bookmark_id: str) -> bool:
        result = await self.bookmarks.delete_one({"_id": self._object_id(bookmark_id)})
        return result.deleted_count > 0

    # --- Analytics ---
    async def create_analytics(self, doc: RecordingAnalyticsDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.analytics.find_one_and_update(
            {"recording_id": doc.recording_id},
            {"$set": data},
            upsert=True,
            return_document=True,
        )
        return self._serialize(result)

    async def get_analytics(self, recording_id: str) -> Optional[dict]:
        doc = await self.analytics.find_one({"recording_id": recording_id})
        return self._serialize(doc) if doc else None

    # --- Helper ---
    def _object_id(self, val: str):
        from bson import ObjectId
        if ObjectId.is_valid(val):
            return ObjectId(val)
        return val
