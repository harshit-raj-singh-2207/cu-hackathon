from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.stress_interview_service import StressInterviewService
from app.schemas.stress_interview import (
    StressSessionStart,
    StressSessionConfigure,
    StressEventCreate,
)


class StressInterviewController:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.service = StressInterviewService(database)

    async def start_session(self, user_id: str, payload: StressSessionStart) -> dict:
        return await self.service.start_session(user_id, payload)

    async def stop_session(self, user_id: str, session_id: str) -> dict:
        return await self.service.stop_session(user_id, session_id)

    async def configure_session(self, user_id: str, payload: StressSessionConfigure) -> dict:
        return await self.service.configure_session(user_id, payload)

    async def store_event(self, user_id: str, payload: StressEventCreate) -> dict:
        return await self.service.store_event(user_id, payload)

    async def get_session(self, session_id: str, user_id: str) -> dict:
        return await self.service.get_session(session_id, user_id)

    async def get_events(self, session_id: str, user_id: str) -> List[dict]:
        return await self.service.get_events(session_id, user_id)

    async def get_report(self, session_id: str, user_id: str) -> dict:
        return await self.service.get_report(session_id, user_id)

    async def list_history(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.service.list_history(user_id=user_id, page=page, limit=limit)

    async def delete_session(self, session_id: str, user_id: str) -> None:
        await self.service.delete_session(session_id, user_id)
