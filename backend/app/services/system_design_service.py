from datetime import datetime, timezone
from typing import Optional, List, Tuple
from uuid import uuid4
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.system_design_repository import SystemDesignRepository
from app.models.system_design import (
    SystemDesignSessionDocument,
    WhiteboardMetadataDocument,
    ArchitectureNotesDocument,
    DiagramMetadataDocument,
    APIDesignDocument,
    DatabaseDesignDocument,
    ScalingDiscussionDocument,
    EvaluationCriteriaDocument,
    SessionRecordingMetadataDocument,
    SessionStatus,
    DifficultyLevel,
)
from app.schemas.system_design import (
    SystemDesignSessionCreate,
    SystemDesignSessionUpdate,
    WhiteboardMetadataSave,
    ArchitectureNotesCreate,
    ArchitectureNotesUpdate,
    DiagramMetadataCreate,
    DiagramMetadataUpdate,
    APIDesignCreate,
    APIDesignUpdate,
    DatabaseDesignCreate,
    DatabaseDesignUpdate,
    ScalingDiscussionCreate,
    ScalingDiscussionUpdate,
    EvaluationCriteriaSave,
    SessionRecordingMetadataSave,
)


class SystemDesignService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.repo = SystemDesignRepository(database)

    async def _get_owned_session(self, session_id: str, user_id: str) -> dict:
        session = await self.repo.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="System Design session not found",
            )
        if session["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this session",
            )
        return session

    # --- Session Services ---
    async def create_session(self, user_id: str, payload: SystemDesignSessionCreate) -> dict:
        now = datetime.now(timezone.utc)
        doc = SystemDesignSessionDocument(
            session_id=str(uuid4()),
            user_id=user_id,
            interview_id=payload.interview_id,
            interview_title=payload.interview_title,
            company=payload.company,
            difficulty=payload.difficulty,
            status=SessionStatus.PENDING,
            started_at=now,
            ended_at=None,
            duration=0,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create_session(doc)

    async def get_session(self, session_id: str, user_id: str) -> dict:
        return await self._get_owned_session(session_id, user_id)

    async def list_user_sessions(
        self,
        user_id: str,
        status: Optional[str] = None,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.repo.list_sessions(
            user_id=user_id,
            status=status,
            difficulty=difficulty,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            limit=limit,
        )

    async def update_session(self, session_id: str, user_id: str, payload: SystemDesignSessionUpdate) -> dict:
        await self._get_owned_session(session_id, user_id)
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one field must be provided to update",
            )
        updates["updated_at"] = datetime.now(timezone.utc)
        
        # Auto-compute duration if ended_at is updated or session status is set to Completed
        if updates.get("status") == SessionStatus.COMPLETED.value:
            session = await self.repo.get_session(session_id)
            started_at = session["started_at"]
            if started_at.tzinfo is None:
                started_at = started_at.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            updates["ended_at"] = now
            updates["duration"] = int((now - started_at).total_seconds())

        result = await self.repo.update_session(session_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update session",
            )
        return result

    async def delete_session(self, session_id: str, user_id: str) -> None:
        await self._get_owned_session(session_id, user_id)
        success = await self.repo.delete_session(session_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete session",
            )

    # --- Whiteboard Metadata ---
    async def save_whiteboard(self, session_id: str, user_id: str, payload: WhiteboardMetadataSave) -> dict:
        await self._get_owned_session(session_id, user_id)
        doc = WhiteboardMetadataDocument(
            session_id=session_id,
            whiteboard_id=payload.whiteboard_id,
            canvas_version=payload.canvas_version,
            last_updated_time=datetime.now(timezone.utc),
        )
        return await self.repo.save_whiteboard(doc)

    async def get_whiteboard(self, session_id: str, user_id: str) -> dict:
        await self._get_owned_session(session_id, user_id)
        whiteboard = await self.repo.get_whiteboard(session_id)
        if not whiteboard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Whiteboard metadata not found for this session",
            )
        return whiteboard

    # --- Architecture Notes ---
    async def create_architecture_note(self, session_id: str, user_id: str, payload: ArchitectureNotesCreate) -> dict:
        await self._get_owned_session(session_id, user_id)
        now = datetime.now(timezone.utc)
        doc = ArchitectureNotesDocument(
            note_id=str(uuid4()),
            session_id=session_id,
            title=payload.title,
            description=payload.description,
            notes=payload.notes,
            version=payload.version,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create_architecture_note(doc)

    async def list_architecture_notes(self, session_id: str, user_id: str) -> List[dict]:
        await self._get_owned_session(session_id, user_id)
        return await self.repo.list_architecture_notes(session_id)

    async def update_architecture_note(
        self, session_id: str, note_id: str, user_id: str, payload: ArchitectureNotesUpdate
    ) -> dict:
        await self._get_owned_session(session_id, user_id)
        note = await self.repo.get_architecture_note(note_id)
        if not note or note["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Architecture note not found in this session",
            )
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updates provided",
            )
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.repo.update_architecture_note(note_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update architecture note",
            )
        return result

    async def delete_architecture_note(self, session_id: str, note_id: str, user_id: str) -> None:
        await self._get_owned_session(session_id, user_id)
        note = await self.repo.get_architecture_note(note_id)
        if not note or note["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Architecture note not found in this session",
            )
        success = await self.repo.delete_architecture_note(note_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete architecture note",
            )

    # --- Diagram Metadata ---
    async def create_diagram(self, session_id: str, user_id: str, payload: DiagramMetadataCreate) -> dict:
        await self._get_owned_session(session_id, user_id)
        now = datetime.now(timezone.utc)
        doc = DiagramMetadataDocument(
            diagram_id=str(uuid4()),
            session_id=session_id,
            diagram_name=payload.diagram_name,
            diagram_type=payload.diagram_type,
            storage_path=payload.storage_path,
            thumbnail_url=payload.thumbnail_url,
            version=payload.version,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create_diagram(doc)

    async def list_diagrams(self, session_id: str, user_id: str) -> List[dict]:
        await self._get_owned_session(session_id, user_id)
        return await self.repo.list_diagrams(session_id)

    async def update_diagram(
        self, session_id: str, diagram_id: str, user_id: str, payload: DiagramMetadataUpdate
    ) -> dict:
        await self._get_owned_session(session_id, user_id)
        diagram = await self.repo.get_diagram(diagram_id)
        if not diagram or diagram["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Diagram metadata not found in this session",
            )
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updates provided",
            )
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.repo.update_diagram(diagram_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update diagram",
            )
        return result

    async def delete_diagram(self, session_id: str, diagram_id: str, user_id: str) -> None:
        await self._get_owned_session(session_id, user_id)
        diagram = await self.repo.get_diagram(diagram_id)
        if not diagram or diagram["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Diagram metadata not found in this session",
            )
        success = await self.repo.delete_diagram(diagram_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete diagram",
            )

    # --- API Design ---
    async def create_api_design(self, session_id: str, user_id: str, payload: APIDesignCreate) -> dict:
        await self._get_owned_session(session_id, user_id)
        now = datetime.now(timezone.utc)
        doc = APIDesignDocument(
            api_design_id=str(uuid4()),
            session_id=session_id,
            api_name=payload.api_name,
            http_method=payload.http_method,
            endpoint=payload.endpoint,
            description=payload.description,
            request_format=payload.request_format,
            response_format=payload.response_format,
            authentication_required=payload.authentication_required,
            notes=payload.notes,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create_api_design(doc)

    async def list_api_designs(self, session_id: str, user_id: str) -> List[dict]:
        await self._get_owned_session(session_id, user_id)
        return await self.repo.list_api_designs(session_id)

    async def update_api_design(
        self, session_id: str, api_design_id: str, user_id: str, payload: APIDesignUpdate
    ) -> dict:
        await self._get_owned_session(session_id, user_id)
        api = await self.repo.get_api_design(api_design_id)
        if not api or api["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API design not found in this session",
            )
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updates provided",
            )
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.repo.update_api_design(api_design_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update API design",
            )
        return result

    async def delete_api_design(self, session_id: str, api_design_id: str, user_id: str) -> None:
        await self._get_owned_session(session_id, user_id)
        api = await self.repo.get_api_design(api_design_id)
        if not api or api["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API design not found in this session",
            )
        success = await self.repo.delete_api_design(api_design_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete API design",
            )

    # --- Database Design ---
    async def create_db_design(self, session_id: str, user_id: str, payload: DatabaseDesignCreate) -> dict:
        await self._get_owned_session(session_id, user_id)
        now = datetime.now(timezone.utc)
        doc = DatabaseDesignDocument(
            db_design_id=str(uuid4()),
            session_id=session_id,
            database_type=payload.database_type,
            collections_or_tables=payload.collections_or_tables,
            relationships=payload.relationships,
            primary_keys=payload.primary_keys,
            foreign_keys=payload.foreign_keys,
            indexes=payload.indexes,
            notes=payload.notes,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create_db_design(doc)

    async def list_db_designs(self, session_id: str, user_id: str) -> List[dict]:
        await self._get_owned_session(session_id, user_id)
        return await self.repo.list_db_designs(session_id)

    async def update_db_design(
        self, session_id: str, db_design_id: str, user_id: str, payload: DatabaseDesignUpdate
    ) -> dict:
        await self._get_owned_session(session_id, user_id)
        db_design = await self.repo.get_db_design(db_design_id)
        if not db_design or db_design["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Database design not found in this session",
            )
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updates provided",
            )
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.repo.update_db_design(db_design_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update database design",
            )
        return result

    async def delete_db_design(self, session_id: str, db_design_id: str, user_id: str) -> None:
        await self._get_owned_session(session_id, user_id)
        db_design = await self.repo.get_db_design(db_design_id)
        if not db_design or db_design["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Database design not found in this session",
            )
        success = await self.repo.delete_db_design(db_design_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete database design",
            )

    # --- Scaling Discussion ---
    async def create_scaling(self, session_id: str, user_id: str, payload: ScalingDiscussionCreate) -> dict:
        await self._get_owned_session(session_id, user_id)
        now = datetime.now(timezone.utc)
        doc = ScalingDiscussionDocument(
            scaling_id=str(uuid4()),
            session_id=session_id,
            topic=payload.topic,
            description=payload.description,
            pros=payload.pros,
            cons=payload.cons,
            notes=payload.notes,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create_scaling(doc)

    async def list_scalings(self, session_id: str, user_id: str) -> List[dict]:
        await self._get_owned_session(session_id, user_id)
        return await self.repo.list_scalings(session_id)

    async def update_scaling(
        self, session_id: str, scaling_id: str, user_id: str, payload: ScalingDiscussionUpdate
    ) -> dict:
        await self._get_owned_session(session_id, user_id)
        scaling = await self.repo.get_scaling(scaling_id)
        if not scaling or scaling["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scaling discussion topic not found in this session",
            )
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updates provided",
            )
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.repo.update_scaling(scaling_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update scaling discussion",
            )
        return result

    async def delete_scaling(self, session_id: str, scaling_id: str, user_id: str) -> None:
        await self._get_owned_session(session_id, user_id)
        scaling = await self.repo.get_scaling(scaling_id)
        if not scaling or scaling["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scaling discussion topic not found in this session",
            )
        success = await self.repo.delete_scaling(scaling_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete scaling discussion",
            )

    # --- Evaluation Criteria ---
    async def save_evaluation(self, session_id: str, user_id: str, payload: EvaluationCriteriaSave) -> dict:
        await self._get_owned_session(session_id, user_id)
        doc = EvaluationCriteriaDocument(
            session_id=session_id,
            architecture_score=payload.architecture_score,
            api_design_score=payload.api_design_score,
            database_design_score=payload.database_design_score,
            scalability_score=payload.scalability_score,
            communication_score=payload.communication_score,
            overall_score=payload.overall_score,
            reviewer_notes=payload.reviewer_notes,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        return await self.repo.save_evaluation(doc)

    async def get_evaluation(self, session_id: str, user_id: str) -> dict:
        await self._get_owned_session(session_id, user_id)
        evaluation = await self.repo.get_evaluation(session_id)
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation scores not found for this session",
            )
        return evaluation

    # --- Recording Metadata ---
    async def save_recording(self, session_id: str, user_id: str, payload: SessionRecordingMetadataSave) -> dict:
        await self._get_owned_session(session_id, user_id)
        doc = SessionRecordingMetadataDocument(
            session_id=session_id,
            recording_url=payload.recording_url,
            transcript_url=payload.transcript_url,
            duration=payload.duration,
            file_size=payload.file_size,
            recording_status=payload.recording_status,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        return await self.repo.save_recording(doc)

    async def get_recording(self, session_id: str, user_id: str) -> dict:
        await self._get_owned_session(session_id, user_id)
        recording = await self.repo.get_recording(session_id)
        if not recording:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recording metadata not found for this session",
            )
        return recording
