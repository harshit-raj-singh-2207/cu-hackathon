from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.skill_analysis_service import SkillAnalysisService
from app.schemas.skill_analysis import (
    SkillAnalysisCreate,
)


class SkillAnalysisController:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.service = SkillAnalysisService(database)

    async def create_analysis(self, user_id: str, payload: SkillAnalysisCreate) -> dict:
        return await self.service.create_analysis(user_id, payload)

    async def get_analysis(self, analysis_id: str, user_id: str) -> dict:
        return await self.service.get_analysis(analysis_id, user_id)

    async def list_analyses(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.service.list_analyses_for_user(user_id=user_id, page=page, limit=limit)

    async def delete_analysis(self, analysis_id: str, user_id: str) -> None:
        await self.service.delete_analysis(analysis_id, user_id)

    async def get_scores(self, analysis_id: str, user_id: str) -> List[dict]:
        return await self.service.get_scores(analysis_id, user_id)

    async def get_strengths(self, analysis_id: str, user_id: str) -> List[dict]:
        return await self.service.get_strengths(analysis_id, user_id)

    async def get_weaknesses(self, analysis_id: str, user_id: str) -> List[dict]:
        return await self.service.get_weaknesses(analysis_id, user_id)

    async def get_recommendations(self, analysis_id: str, user_id: str) -> List[dict]:
        return await self.service.get_recommendations(analysis_id, user_id)

    async def get_readiness(self, analysis_id: str, user_id: str) -> dict:
        return await self.service.get_readiness(analysis_id, user_id)
