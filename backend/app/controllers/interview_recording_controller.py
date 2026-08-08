from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.interview_recording_service import InterviewRecordingService
from app.schemas.interview_recording import (
    InterviewRecordingCreate,
    InterviewRecordingUpdate,
    ReplayEventCreate,
    MistakeMarkerCreate,
    AICommentCreate,
    BookmarkCreate,
)


class InterviewRecordingController:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.service = InterviewRecordingService(database)

    async def create_recording(self, user_id: str, payload: InterviewRecordingCreate) -> dict:
        return await self.service.create_recording(user_id, payload)

    async def get_recording(self, recording_id: str, user_id: str) -> dict:
        return await self.service.get_recording(recording_id, user_id)

    async def update_recording(self, recording_id: str, user_id: str, payload: InterviewRecordingUpdate) -> dict:
        return await self.service.update_recording(recording_id, user_id, payload)

    async def delete_recording(self, recording_id: str, user_id: str) -> None:
        await self.service.delete_recording(recording_id, user_id)

    async def list_recordings(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.service.list_recordings(user_id=user_id, page=page, limit=limit)

    # --- Replay / Events ---
    async def store_event(self, recording_id: str, user_id: str, payload: ReplayEventCreate) -> dict:
        return await self.service.store_event(recording_id, user_id, payload)

    async def get_events(self, recording_id: str, user_id: str) -> List[dict]:
        return await self.service.get_events(recording_id, user_id)

    # --- Mistakes ---
    async def store_mistake(self, recording_id: str, user_id: str, payload: MistakeMarkerCreate) -> dict:
        return await self.service.store_mistake(recording_id, user_id, payload)

    async def get_mistakes(self, recording_id: str, user_id: str) -> List[dict]:
        return await self.service.get_mistakes(recording_id, user_id)

    # --- Comments ---
    async def store_comment(self, recording_id: str, user_id: str, payload: AICommentCreate) -> dict:
        return await self.service.store_comment(recording_id, user_id, payload)

    async def get_comments(self, recording_id: str, user_id: str) -> List[dict]:
        return await self.service.get_comments(recording_id, user_id)

    # --- Bookmarks ---
    async def store_bookmark(self, recording_id: str, user_id: str, payload: BookmarkCreate) -> dict:
        return await self.service.store_bookmark(recording_id, user_id, payload)

    async def get_bookmarks(self, recording_id: str, user_id: str) -> List[dict]:
        return await self.service.get_bookmarks(recording_id, user_id)

    async def delete_bookmark(self, bookmark_id: str, user_id: str) -> None:
        await self.service.delete_bookmark(bookmark_id, user_id)

    # --- Analytics ---
    async def get_analytics(self, recording_id: str, user_id: str) -> dict:
        return await self.service.get_analytics(recording_id, user_id)
