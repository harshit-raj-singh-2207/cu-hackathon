from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.system_design_service import SystemDesignService
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


class SystemDesignController:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.service = SystemDesignService(database)

    # --- Session Endpoints ---
    async def create_session(self, user_id: str, payload: SystemDesignSessionCreate) -> dict:
        return await self.service.create_session(user_id, payload)

    async def get_session(self, session_id: str, user_id: str) -> dict:
        return await self.service.get_session(session_id, user_id)

    async def list_sessions(
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
        return await self.service.list_user_sessions(
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
        return await self.service.update_session(session_id, user_id, payload)

    async def delete_session(self, session_id: str, user_id: str) -> None:
        await self.service.delete_session(session_id, user_id)

    # --- Whiteboard Metadata ---
    async def save_whiteboard(self, session_id: str, user_id: str, payload: WhiteboardMetadataSave) -> dict:
        return await self.service.save_whiteboard(session_id, user_id, payload)

    async def get_whiteboard(self, session_id: str, user_id: str) -> dict:
        return await self.service.get_whiteboard(session_id, user_id)

    # --- Architecture Notes ---
    async def create_architecture_note(self, session_id: str, user_id: str, payload: ArchitectureNotesCreate) -> dict:
        return await self.service.create_architecture_note(session_id, user_id, payload)

    async def list_architecture_notes(self, session_id: str, user_id: str) -> List[dict]:
        return await self.service.list_architecture_notes(session_id, user_id)

    async def update_architecture_note(
        self, session_id: str, note_id: str, user_id: str, payload: ArchitectureNotesUpdate
    ) -> dict:
        return await self.service.update_architecture_note(session_id, note_id, user_id, payload)

    async def delete_architecture_note(self, session_id: str, note_id: str, user_id: str) -> None:
        await self.service.delete_architecture_note(session_id, note_id, user_id)

    # --- Diagram Metadata ---
    async def create_diagram(self, session_id: str, user_id: str, payload: DiagramMetadataCreate) -> dict:
        return await self.service.create_diagram(session_id, user_id, payload)

    async def list_diagrams(self, session_id: str, user_id: str) -> List[dict]:
        return await self.service.list_diagrams(session_id, user_id)

    async def update_diagram(
        self, session_id: str, diagram_id: str, user_id: str, payload: DiagramMetadataUpdate
    ) -> dict:
        return await self.service.update_diagram(session_id, diagram_id, user_id, payload)

    async def delete_diagram(self, session_id: str, diagram_id: str, user_id: str) -> None:
        await self.service.delete_diagram(session_id, diagram_id, user_id)

    # --- API Design ---
    async def create_api_design(self, session_id: str, user_id: str, payload: APIDesignCreate) -> dict:
        return await self.service.create_api_design(session_id, user_id, payload)

    async def list_api_designs(self, session_id: str, user_id: str) -> List[dict]:
        return await self.service.list_api_designs(session_id, user_id)

    async def update_api_design(
        self, session_id: str, api_design_id: str, user_id: str, payload: APIDesignUpdate
    ) -> dict:
        return await self.service.update_api_design(session_id, api_design_id, user_id, payload)

    async def delete_api_design(self, session_id: str, api_design_id: str, user_id: str) -> None:
        await self.service.delete_api_design(session_id, api_design_id, user_id)

    # --- Database Design ---
    async def create_db_design(self, session_id: str, user_id: str, payload: DatabaseDesignCreate) -> dict:
        return await self.service.create_db_design(session_id, user_id, payload)

    async def list_db_designs(self, session_id: str, user_id: str) -> List[dict]:
        return await self.service.list_db_designs(session_id, user_id)

    async def update_db_design(
        self, session_id: str, db_design_id: str, user_id: str, payload: DatabaseDesignUpdate
    ) -> dict:
        return await self.service.update_db_design(session_id, db_design_id, user_id, payload)

    async def delete_db_design(self, session_id: str, db_design_id: str, user_id: str) -> None:
        await self.service.delete_db_design(session_id, db_design_id, user_id)

    # --- Scaling Discussion ---
    async def create_scaling(self, session_id: str, user_id: str, payload: ScalingDiscussionCreate) -> dict:
        return await self.service.create_scaling(session_id, user_id, payload)

    async def list_scalings(self, session_id: str, user_id: str) -> List[dict]:
        return await self.service.list_scalings(session_id, user_id)

    async def update_scaling(
        self, session_id: str, scaling_id: str, user_id: str, payload: ScalingDiscussionUpdate
    ) -> dict:
        return await self.service.update_scaling(session_id, scaling_id, user_id, payload)

    async def delete_scaling(self, session_id: str, scaling_id: str, user_id: str) -> None:
        await self.service.delete_scaling(session_id, scaling_id, user_id)

    # --- Evaluation Criteria ---
    async def save_evaluation(self, session_id: str, user_id: str, payload: EvaluationCriteriaSave) -> dict:
        return await self.service.save_evaluation(session_id, user_id, payload)

    async def get_evaluation(self, session_id: str, user_id: str) -> dict:
        return await self.service.get_evaluation(session_id, user_id)

    # --- Recording Metadata ---
    async def save_recording(self, session_id: str, user_id: str, payload: SessionRecordingMetadataSave) -> dict:
        return await self.service.save_recording(session_id, user_id, payload)

    async def get_recording(self, session_id: str, user_id: str) -> dict:
        return await self.service.get_recording(session_id, user_id)
