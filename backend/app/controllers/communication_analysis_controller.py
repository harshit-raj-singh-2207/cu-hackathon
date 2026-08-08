from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.communication_analysis_service import CommunicationAnalysisService
from app.schemas.communication_analysis import (
    CommunicationAnalysisCreate,
    CommunicationAnalysisUpdate,
)


class CommunicationAnalysisController:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.service = CommunicationAnalysisService(database)

    async def create_analysis(self, user_id: str, payload: CommunicationAnalysisCreate) -> dict:
        return await self.service.create_analysis(user_id, payload)

    async def get_analysis(self, analysis_id: str, user_id: str) -> dict:
        return await self.service.get_analysis(analysis_id, user_id)

    async def get_latest_analysis(self, user_id: str) -> dict:
        return await self.service.get_latest_analysis(user_id)

    async def list_analyses(
        self,
        user_id: str,
        interview_id: Optional[str] = None,
        session_id: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.service.list_user_analyses(
            user_id=user_id,
            interview_id=interview_id,
            session_id=session_id,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            limit=limit,
        )

    async def update_analysis(
        self, analysis_id: str, user_id: str, payload: CommunicationAnalysisUpdate
    ) -> dict:
        return await self.service.update_analysis(analysis_id, user_id, payload)

    async def delete_analysis(self, analysis_id: str, user_id: str) -> None:
        await self.service.delete_analysis(analysis_id, user_id)

    async def get_statistics(self, user_id: str) -> dict:
        return await self.service.get_statistics(user_id)
