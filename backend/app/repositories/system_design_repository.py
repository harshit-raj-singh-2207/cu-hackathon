from datetime import datetime, timezone
from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
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
)


class SystemDesignRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.sessions = database["system_design_sessions"]
        self.whiteboards = database["system_design_whiteboards"]
        self.architecture_notes = database["system_design_architecture_notes"]
        self.diagrams = database["system_design_diagrams"]
        self.apis = database["system_design_apis"]
        self.db_designs = database["system_design_db_designs"]
        self.scalings = database["system_design_scalings"]
        self.evaluations = database["system_design_evaluations"]
        self.recordings = database["system_design_recordings"]

    @staticmethod
    def _serialize(document: dict) -> dict:
        if not document:
            return document
        doc = dict(document)
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    # --- Sessions ---
    async def create_session(self, doc: SystemDesignSessionDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.sessions.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_session(self, session_id: str) -> Optional[dict]:
        doc = await self.sessions.find_one({"session_id": session_id})
        return self._serialize(doc) if doc else None

    async def list_sessions(
        self,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        query = {}
        if user_id:
            query["user_id"] = user_id
        if status:
            query["status"] = status
        if difficulty:
            query["difficulty"] = difficulty
        if search:
            query["$or"] = [
                {"interview_title": {"$regex": search, "$options": "i"}},
                {"company": {"$regex": search, "$options": "i"}},
            ]

        direction = -1 if sort_order == "desc" else 1
        cursor = (
            self.sessions.find(query)
            .sort(sort_by, direction)
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
        result = await self.sessions.delete_one({"session_id": session_id})
        return result.deleted_count > 0

    # --- Whiteboard Metadata ---
    async def save_whiteboard(self, doc: WhiteboardMetadataDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.whiteboards.find_one_and_update(
            {"session_id": doc.session_id},
            {"$set": data},
            upsert=True,
            return_document=True,
        )
        return self._serialize(result)

    async def get_whiteboard(self, session_id: str) -> Optional[dict]:
        doc = await self.whiteboards.find_one({"session_id": session_id})
        return self._serialize(doc) if doc else None

    # --- Architecture Notes ---
    async def create_architecture_note(self, doc: ArchitectureNotesDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.architecture_notes.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_architecture_note(self, note_id: str) -> Optional[dict]:
        doc = await self.architecture_notes.find_one({"note_id": note_id})
        return self._serialize(doc) if doc else None

    async def list_architecture_notes(self, session_id: str) -> List[dict]:
        cursor = self.architecture_notes.find({"session_id": session_id}).sort("created_at", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    async def update_architecture_note(self, note_id: str, updates: dict) -> Optional[dict]:
        result = await self.architecture_notes.find_one_and_update(
            {"note_id": note_id},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_architecture_note(self, note_id: str) -> bool:
        result = await self.architecture_notes.delete_one({"note_id": note_id})
        return result.deleted_count > 0

    # --- Diagram Metadata ---
    async def create_diagram(self, doc: DiagramMetadataDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.diagrams.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_diagram(self, diagram_id: str) -> Optional[dict]:
        doc = await self.diagrams.find_one({"diagram_id": diagram_id})
        return self._serialize(doc) if doc else None

    async def list_diagrams(self, session_id: str) -> List[dict]:
        cursor = self.diagrams.find({"session_id": session_id}).sort("created_at", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    async def update_diagram(self, diagram_id: str, updates: dict) -> Optional[dict]:
        result = await self.diagrams.find_one_and_update(
            {"diagram_id": diagram_id},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_diagram(self, diagram_id: str) -> bool:
        result = await self.diagrams.delete_one({"diagram_id": diagram_id})
        return result.deleted_count > 0

    # --- API Design ---
    async def create_api_design(self, doc: APIDesignDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.apis.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_api_design(self, api_design_id: str) -> Optional[dict]:
        doc = await self.apis.find_one({"api_design_id": api_design_id})
        return self._serialize(doc) if doc else None

    async def list_api_designs(self, session_id: str) -> List[dict]:
        cursor = self.apis.find({"session_id": session_id}).sort("created_at", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    async def update_api_design(self, api_design_id: str, updates: dict) -> Optional[dict]:
        result = await self.apis.find_one_and_update(
            {"api_design_id": api_design_id},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_api_design(self, api_design_id: str) -> bool:
        result = await self.apis.delete_one({"api_design_id": api_design_id})
        return result.deleted_count > 0

    # --- Database Design ---
    async def create_db_design(self, doc: DatabaseDesignDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.db_designs.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_db_design(self, db_design_id: str) -> Optional[dict]:
        doc = await self.db_designs.find_one({"db_design_id": db_design_id})
        return self._serialize(doc) if doc else None

    async def list_db_designs(self, session_id: str) -> List[dict]:
        cursor = self.db_designs.find({"session_id": session_id}).sort("created_at", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    async def update_db_design(self, db_design_id: str, updates: dict) -> Optional[dict]:
        result = await self.db_designs.find_one_and_update(
            {"db_design_id": db_design_id},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_db_design(self, db_design_id: str) -> bool:
        result = await self.db_designs.delete_one({"db_design_id": db_design_id})
        return result.deleted_count > 0

    # --- Scaling Discussion ---
    async def create_scaling(self, doc: ScalingDiscussionDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.scalings.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_scaling(self, scaling_id: str) -> Optional[dict]:
        doc = await self.scalings.find_one({"scaling_id": scaling_id})
        return self._serialize(doc) if doc else None

    async def list_scalings(self, session_id: str) -> List[dict]:
        cursor = self.scalings.find({"session_id": session_id}).sort("created_at", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    async def update_scaling(self, scaling_id: str, updates: dict) -> Optional[dict]:
        result = await self.scalings.find_one_and_update(
            {"scaling_id": scaling_id},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_scaling(self, scaling_id: str) -> bool:
        result = await self.scalings.delete_one({"scaling_id": scaling_id})
        return result.deleted_count > 0

    # --- Evaluation Criteria ---
    async def save_evaluation(self, doc: EvaluationCriteriaDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.evaluations.find_one_and_update(
            {"session_id": doc.session_id},
            {"$set": data},
            upsert=True,
            return_document=True,
        )
        return self._serialize(result)

    async def get_evaluation(self, session_id: str) -> Optional[dict]:
        doc = await self.evaluations.find_one({"session_id": session_id})
        return self._serialize(doc) if doc else None

    # --- Recording Metadata ---
    async def save_recording(self, doc: SessionRecordingMetadataDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.recordings.find_one_and_update(
            {"session_id": doc.session_id},
            {"$set": data},
            upsert=True,
            return_document=True,
        )
        return self._serialize(result)

    async def get_recording(self, session_id: str) -> Optional[dict]:
        doc = await self.recordings.find_one({"session_id": session_id})
        return self._serialize(doc) if doc else None
