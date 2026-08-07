from datetime import datetime, timezone
from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.stress_interview import (
    StressSessionDocument,
    StressEventDocument,
    StressMetricsDocument,
)


class StressInterviewRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.sessions = database["stress_sessions"]
        self.events = database["stress_events"]
        self.reports = database["stress_reports"]

    @staticmethod
    def _serialize(document: dict) -> dict:
        if not document:
            return document
        doc = dict(document)
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    # --- Sessions ---
    async def create_session(self, doc: StressSessionDocument) -> dict:
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
        await self.events.delete_many({"session_id": session_id})
        await self.reports.delete_many({"session_id": session_id})
        result = await self.sessions.delete_one({"session_id": session_id})
        return result.deleted_count > 0

    # --- Events ---
    async def create_event(self, doc: StressEventDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.events.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_events_for_session(self, session_id: str) -> List[dict]:
        cursor = self.events.find({"session_id": session_id}).sort("event_time", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=2000)]

    # --- Reports ---
    async def create_report(self, doc: StressMetricsDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.reports.find_one_and_update(
            {"session_id": doc.session_id},
            {"$set": data},
            upsert=True,
            return_document=True,
        )
        return self._serialize(result)

    async def get_report(self, session_id: str) -> Optional[dict]:
        doc = await self.reports.find_one({"session_id": session_id})
        return self._serialize(doc) if doc else None
