from datetime import datetime, timezone
from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.webcam_analysis import (
    WebcamSessionDocument,
    BodyLanguageAnalysisDocument,
    BodyLanguageSummaryDocument,
    TimelineEventDocument,
)


class WebcamAnalysisRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.sessions = database["webcam_sessions"]
        self.analyses = database["body_language_analyses"]
        self.summaries = database["body_language_summaries"]
        self.events = database["timeline_events"]

    @staticmethod
    def _serialize(document: dict) -> dict:
        if not document:
            return document
        doc = dict(document)
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    # --- Sessions ---
    async def create_session(self, doc: WebcamSessionDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.sessions.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_session(self, session_id: str) -> Optional[dict]:
        doc = await self.sessions.find_one({"session_id": session_id})
        return self._serialize(doc) if doc else None

    async def get_active_session_for_interview(self, interview_session_id: str) -> Optional[dict]:
        doc = await self.sessions.find_one({
            "interview_session_id": interview_session_id,
            "status": "started"
        })
        return self._serialize(doc) if doc else None

    async def list_sessions(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        query = {"user_id": user_id}
        cursor = (
            self.sessions.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * limit)
            .limit(limit)
        )
        total = await self.sessions.count_documents(query)
        items = [self._serialize(doc) for doc in await cursor.to_list(length=limit)]
        return items, total

    async def update_session(self, session_id: str, updates: dict) -> Optional[dict]:
        result = await self.sessions.find_one_and_update(
            {"session_id": session_id},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_session(self, session_id: str) -> bool:
        # Cascade deletion of related session files/records
        await self.analyses.delete_many({"session_id": session_id})
        await self.summaries.delete_many({"session_id": session_id})
        await self.events.delete_many({"session_id": session_id})
        result = await self.sessions.delete_one({"session_id": session_id})
        return result.deleted_count > 0

    # --- Frame Analyses ---
    async def create_analysis(self, doc: BodyLanguageAnalysisDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.analyses.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def batch_create_analyses(self, docs: List[BodyLanguageAnalysisDocument]) -> List[dict]:
        if not docs:
            return []
        data_list = [doc.model_dump(exclude={"id"}) for doc in docs]
        result = await self.analyses.insert_many(data_list)
        for data, inserted_id in zip(data_list, result.inserted_ids):
            data["_id"] = inserted_id
        return [self._serialize(data) for data in data_list]

    async def get_analyses_for_session(self, session_id: str) -> List[dict]:
        cursor = self.analyses.find({"session_id": session_id}).sort("timestamp", 1)
        # Using a higher limit to fetch all frames for computation. Usually webcam frames are not infinite.
        # But we could stream them or batch them. Let's fetch them with a high limit.
        return [self._serialize(doc) for doc in await cursor.to_list(length=50000)]

    # --- Timeline Events ---
    async def create_event(self, doc: TimelineEventDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.events.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_events_for_session(self, session_id: str) -> List[dict]:
        cursor = self.events.find({"session_id": session_id}).sort("event_time", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=1000)]

    # --- Summaries ---
    async def create_summary(self, doc: BodyLanguageSummaryDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        # Upsert summary
        result = await self.summaries.find_one_and_update(
            {"session_id": doc.session_id},
            {"$set": data},
            upsert=True,
            return_document=True,
        )
        return self._serialize(result)

    async def get_summary(self, session_id: str) -> Optional[dict]:
        doc = await self.summaries.find_one({"session_id": session_id})
        return self._serialize(doc) if doc else None
