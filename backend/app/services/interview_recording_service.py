from datetime import datetime, timezone
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.interview_recording_repository import InterviewRecordingRepository
from app.models.interview_recording import (
    InterviewRecordingDocument,
    ReplayEventDocument,
    MistakeMarkerDocument,
    AICommentDocument,
    BookmarkDocument,
    RecordingAnalyticsDocument,
    ReplayEventType,
)
from app.schemas.interview_recording import (
    InterviewRecordingCreate,
    InterviewRecordingUpdate,
    ReplayEventCreate,
    MistakeMarkerCreate,
    AICommentCreate,
    BookmarkCreate,
)


class InterviewRecordingService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.repo = InterviewRecordingRepository(database)
        self.interview_sessions = database["interview_sessions"]

    async def _get_owned_recording(self, recording_id: str, user_id: str) -> dict:
        recording = await self.repo.get_recording(recording_id)
        if not recording:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview recording not found",
            )
        if recording["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this recording",
            )
        return recording

    async def create_recording(self, user_id: str, payload: InterviewRecordingCreate) -> dict:
        # Validate that the interview session exists and belongs to the user
        session = await self.interview_sessions.find_one({
            "session_id": payload.interview_session_id,
            "user_id": user_id
        })
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Matching interview session not found",
            )

        # Prevent duplicate recordings: checks if a recording already exists for this session
        existing = await self.repo.get_recording_by_session(payload.interview_session_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A recording already exists for this interview session",
            )

        now = datetime.now(timezone.utc)
        doc = InterviewRecordingDocument(
            user_id=user_id,
            interview_session_id=payload.interview_session_id,
            recording_status=payload.recording_status,
            recording_type=payload.recording_type,
            video_url=payload.video_url,
            audio_url=payload.audio_url,
            transcript_id=payload.transcript_id,
            thumbnail_url=payload.thumbnail_url,
            duration=payload.duration,
            started_at=payload.started_at or now,
            ended_at=payload.ended_at,
            created_at=now,
            updated_at=now
        )
        recording = await self.repo.create_recording(doc)
        await self._recalculate_analytics(recording["id"])
        return recording

    async def get_recording(self, recording_id: str, user_id: str) -> dict:
        return await self._get_owned_recording(recording_id, user_id)

    async def update_recording(self, recording_id: str, user_id: str, payload: InterviewRecordingUpdate) -> dict:
        recording = await self._get_owned_recording(recording_id, user_id)

        current_status = recording["recording_status"]
        new_status = payload.recording_status

        if new_status and current_status != new_status:
            from app.models.interview_recording import RecordingStatus
            # Declare allowed transitions graph
            transitions = {
                RecordingStatus.CREATED: [RecordingStatus.INITIALIZING, RecordingStatus.FAILED, RecordingStatus.DELETED],
                RecordingStatus.INITIALIZING: [RecordingStatus.RECORDING, RecordingStatus.FAILED, RecordingStatus.DELETED],
                RecordingStatus.RECORDING: [RecordingStatus.PAUSED, RecordingStatus.PROCESSING, RecordingStatus.FAILED, RecordingStatus.DELETED],
                RecordingStatus.PAUSED: [RecordingStatus.RESUMED, RecordingStatus.PROCESSING, RecordingStatus.FAILED, RecordingStatus.DELETED],
                RecordingStatus.RESUMED: [RecordingStatus.PAUSED, RecordingStatus.PROCESSING, RecordingStatus.FAILED, RecordingStatus.DELETED],
                RecordingStatus.PROCESSING: [RecordingStatus.COMPLETED, RecordingStatus.FAILED, RecordingStatus.DELETED],
                RecordingStatus.COMPLETED: [RecordingStatus.ARCHIVED, RecordingStatus.DELETED],
                RecordingStatus.FAILED: [RecordingStatus.DELETED],
                RecordingStatus.ARCHIVED: [RecordingStatus.DELETED],
                RecordingStatus.DELETED: []
            }
            
            allowed = new_status in transitions.get(current_status, [])
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid recording status transition from '{current_status}' to '{new_status}'",
                )

        updates = payload.model_dump(exclude_unset=True)
        updates["updated_at"] = datetime.now(timezone.utc)
        
        updated = await self.repo.update_recording(recording_id, updates)
        await self._recalculate_analytics(recording_id)
        return updated

    async def delete_recording(self, recording_id: str, user_id: str) -> None:
        await self._get_owned_recording(recording_id, user_id)
        success = await self.repo.delete_recording(recording_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete interview recording",
            )

    async def list_recordings(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.repo.list_recordings(user_id=user_id, page=page, limit=limit)

    # --- Replay / Timeline Events ---
    async def store_event(self, recording_id: str, user_id: str, payload: ReplayEventCreate) -> dict:
        await self._get_owned_recording(recording_id, user_id)
        now = datetime.now(timezone.utc)
        doc = ReplayEventDocument(
            recording_id=recording_id,
            timestamp=payload.timestamp,
            event_type=payload.event_type,
            title=payload.title,
            description=payload.description,
            metadata=payload.metadata,
            created_at=now
        )
        event = await self.repo.create_event(doc)
        await self._recalculate_analytics(recording_id)
        return event

    async def get_events(self, recording_id: str, user_id: str) -> List[dict]:
        await self._get_owned_recording(recording_id, user_id)
        return await self.repo.get_events_for_recording(recording_id)

    # --- Mistakes ---
    async def store_mistake(self, recording_id: str, user_id: str, payload: MistakeMarkerCreate) -> dict:
        # Mistakes cannot exist without a recording
        await self._get_owned_recording(recording_id, user_id)
        now = datetime.now(timezone.utc)
        doc = MistakeMarkerDocument(
            recording_id=recording_id,
            timestamp=payload.timestamp,
            category=payload.category,
            severity=payload.severity,
            title=payload.title,
            description=payload.description,
            recommendation=payload.recommendation,
            created_at=now
        )
        mistake = await self.repo.create_mistake(doc)
        await self._recalculate_analytics(recording_id)
        return mistake

    async def get_mistakes(self, recording_id: str, user_id: str) -> List[dict]:
        await self._get_owned_recording(recording_id, user_id)
        return await self.repo.get_mistakes_for_recording(recording_id)

    # --- Comments ---
    async def store_comment(self, recording_id: str, user_id: str, payload: AICommentCreate) -> dict:
        # AI comments cannot exist without a recording
        await self._get_owned_recording(recording_id, user_id)
        now = datetime.now(timezone.utc)
        doc = AICommentDocument(
            recording_id=recording_id,
            timestamp=payload.timestamp,
            category=payload.category,
            comment=payload.comment,
            importance=payload.importance,
            created_at=now
        )
        comment = await self.repo.create_comment(doc)
        await self._recalculate_analytics(recording_id)
        return comment

    async def get_comments(self, recording_id: str, user_id: str) -> List[dict]:
        await self._get_owned_recording(recording_id, user_id)
        return await self.repo.get_comments_for_recording(recording_id)

    # --- Bookmarks ---
    async def store_bookmark(self, recording_id: str, user_id: str, payload: BookmarkCreate) -> dict:
        await self._get_owned_recording(recording_id, user_id)

        # Bookmarks cannot share duplicate timestamps
        existing = await self.repo.get_bookmark_by_timestamp(recording_id, payload.timestamp)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A bookmark already exists at timestamp {payload.timestamp} seconds",
            )

        now = datetime.now(timezone.utc)
        doc = BookmarkDocument(
            recording_id=recording_id,
            timestamp=payload.timestamp,
            title=payload.title,
            note=payload.note,
            created_at=now
        )
        bookmark = await self.repo.create_bookmark(doc)
        await self._recalculate_analytics(recording_id)
        return bookmark

    async def get_bookmarks(self, recording_id: str, user_id: str) -> List[dict]:
        await self._get_owned_recording(recording_id, user_id)
        return await self.repo.get_bookmarks_for_recording(recording_id)

    async def delete_bookmark(self, bookmark_id: str, user_id: str) -> None:
        bookmark = await self.repo.get_bookmark(bookmark_id)
        if not bookmark:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bookmark not found",
            )
        
        recording_id = bookmark["recording_id"]
        # Verify recording ownership
        await self._get_owned_recording(recording_id, user_id)
        
        success = await self.repo.delete_bookmark(bookmark_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete bookmark",
            )
        await self._recalculate_analytics(recording_id)

    # --- Analytics ---
    async def get_analytics(self, recording_id: str, user_id: str) -> dict:
        await self._get_owned_recording(recording_id, user_id)
        analytics = await self.repo.get_analytics(recording_id)
        if not analytics:
            analytics = await self._recalculate_analytics(recording_id)
        return analytics

    # --- Internal Helpers ---
    async def _recalculate_analytics(self, recording_id: str) -> dict:
        now = datetime.now(timezone.utc)
        recording = await self.repo.get_recording(recording_id)
        
        events = await self.repo.get_events_for_recording(recording_id)
        mistakes = await self.repo.get_mistakes_for_recording(recording_id)
        bookmarks = await self.repo.get_bookmarks_for_recording(recording_id)

        # Count important moments (e.g. special event types or high severity events)
        important_moments = sum(
            1 for e in events 
            if e["event_type"] in [ReplayEventType.QUESTION_STARTED, ReplayEventType.AI_COMMENT_ADDED, ReplayEventType.MISTAKE_ADDED]
        )

        # Average response time calculated from event metadata if present
        response_times = [
            float(e["metadata"]["response_time"]) 
            for e in events 
            if e.get("metadata") and "response_time" in e["metadata"]
        ]
        avg_response = round(sum(response_times) / len(response_times), 2) if response_times else 0.0

        duration = recording.get("duration", 0.0) if recording else 0.0

        doc = RecordingAnalyticsDocument(
            recording_id=recording_id,
            total_events=len(events),
            mistake_count=len(mistakes),
            bookmark_count=len(bookmarks),
            important_moments=important_moments,
            average_response_time=avg_response,
            session_duration=duration or 0.0,
            created_at=now
        )
        return await self.repo.create_analytics(doc)
