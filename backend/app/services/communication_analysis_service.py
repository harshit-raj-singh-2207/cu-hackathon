from datetime import datetime, timezone
from typing import Optional, List, Tuple
from uuid import uuid4
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.communication_analysis_repository import CommunicationAnalysisRepository
from app.models.communication_analysis import CommunicationAnalysisDocument
from app.schemas.communication_analysis import (
    CommunicationAnalysisCreate,
    CommunicationAnalysisUpdate,
)


class CommunicationAnalysisService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.repo = CommunicationAnalysisRepository(database)

    async def _get_owned_analysis(self, analysis_id: str, user_id: str) -> dict:
        analysis = await self.repo.get_analysis(analysis_id)
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Communication analysis record not found",
            )
        if analysis["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this analysis",
            )
        return analysis

    async def create_analysis(self, user_id: str, payload: CommunicationAnalysisCreate) -> dict:
        now = datetime.now(timezone.utc)
        doc = CommunicationAnalysisDocument(
            analysis_id=str(uuid4()),
            interview_id=payload.interview_id,
            session_id=payload.session_id,
            user_id=user_id,
            speaking_speed=payload.speaking_speed,
            grammar_score=payload.grammar_score,
            confidence_score=payload.confidence_score,
            clarity_score=payload.clarity_score,
            pause_count=payload.pause_count,
            filler_words=payload.filler_words,
            vocabulary_score=payload.vocabulary_score,
            pronunciation_score=payload.pronunciation_score,
            overall_score=payload.overall_score,
            remarks=payload.remarks,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create_analysis(doc)

    async def get_analysis(self, analysis_id: str, user_id: str) -> dict:
        return await self._get_owned_analysis(analysis_id, user_id)

    async def get_latest_analysis(self, user_id: str) -> dict:
        analysis = await self.repo.get_latest_analysis(user_id)
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No communication analysis found for this user",
            )
        return analysis

    async def list_user_analyses(
        self,
        user_id: str,
        interview_id: Optional[str] = None,
        session_id: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.repo.list_analyses(
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
        await self._get_owned_analysis(analysis_id, user_id)
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one field must be provided to update",
            )
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.repo.update_analysis(analysis_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update communication analysis",
            )
        return result

    async def delete_analysis(self, analysis_id: str, user_id: str) -> None:
        await self._get_owned_analysis(analysis_id, user_id)
        success = await self.repo.delete_analysis(analysis_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete communication analysis",
            )

    async def get_statistics(self, user_id: str) -> dict:
        return await self.repo.get_statistics(user_id)
