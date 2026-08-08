from datetime import datetime, timezone
from typing import Optional, List, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.coding_interview import (
    CodingSessionDocument,
    CodeSnapshotDocument,
    SubmissionDocument,
    TestCaseDocument,
    AIQuestionHookDocument,
    AlgorithmDiscussionDocument,
)


class CodingInterviewRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.sessions = database["coding_sessions"]
        self.snapshots = database["code_snapshots"]
        self.submissions = database["submissions"]
        self.test_cases = database["test_cases"]
        self.ai_hooks = database["ai_question_hooks"]
        self.algorithm_discussions = database["algorithm_discussions"]

    @staticmethod
    def _serialize(document: dict) -> dict:
        if not document:
            return document
        doc = dict(document)
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    # --- Sessions ---
    async def create_session(self, doc: CodingSessionDocument) -> dict:
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
        language: Optional[str] = None,
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
        if language:
            query["programming_language"] = language
        if search:
            query["$or"] = [
                {"session_id": {"$regex": search, "$options": "i"}},
                {"programming_language": {"$regex": search, "$options": "i"}},
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

    # --- Code Snapshots ---
    async def save_snapshot(self, doc: CodeSnapshotDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.snapshots.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_latest_snapshot_number(self, session_id: str) -> int:
        cursor = self.snapshots.find({"session_id": session_id}).sort("snapshot_number", -1).limit(1)
        items = await cursor.to_list(length=1)
        return items[0]["snapshot_number"] if items else 0

    async def get_snapshot_history(self, session_id: str) -> List[dict]:
        cursor = self.snapshots.find({"session_id": session_id}).sort("snapshot_number", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=500)]

    # --- Submissions ---
    async def create_submission(self, doc: SubmissionDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.submissions.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_submission_history(self, session_id: str) -> List[dict]:
        cursor = self.submissions.find({"session_id": session_id}).sort("submitted_at", -1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=500)]

    # --- Test Cases ---
    async def create_test_case(self, doc: TestCaseDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.test_cases.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_test_case(self, test_case_id: str) -> Optional[dict]:
        doc = await self.test_cases.find_one({"test_case_id": test_case_id})
        return self._serialize(doc) if doc else None

    async def update_test_case(self, test_case_id: str, updates: dict) -> Optional[dict]:
        result = await self.test_cases.find_one_and_update(
            {"test_case_id": test_case_id},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_test_case(self, test_case_id: str) -> bool:
        result = await self.test_cases.delete_one({"test_case_id": test_case_id})
        return result.deleted_count > 0

    async def list_test_cases(self, session_id: str) -> List[dict]:
        cursor = self.test_cases.find({"session_id": session_id}).sort("created_at", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    # --- AI Question Hooks ---
    async def create_ai_hook(self, doc: AIQuestionHookDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.ai_hooks.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_ai_hook(self, question_id: str) -> Optional[dict]:
        doc = await self.ai_hooks.find_one({"question_id": question_id})
        return self._serialize(doc) if doc else None

    async def update_ai_hook(self, question_id: str, updates: dict) -> Optional[dict]:
        result = await self.ai_hooks.find_one_and_update(
            {"question_id": question_id},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_ai_hook(self, question_id: str) -> bool:
        result = await self.ai_hooks.delete_one({"question_id": question_id})
        return result.deleted_count > 0

    async def list_ai_hooks(
        self,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        query = {}
        if difficulty:
            query["difficulty"] = difficulty
        if search:
            query["$or"] = [
                {"related_concept": {"$regex": search, "$options": "i"}},
                {"follow_up_question": {"$regex": search, "$options": "i"}},
            ]
        cursor = (
            self.ai_hooks.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * limit)
            .limit(limit)
        )
        total = await self.ai_hooks.count_documents(query)
        items = [self._serialize(doc) for doc in await cursor.to_list(length=limit)]
        return items, total

    # --- Algorithm Discussion ---
    async def upsert_algorithm_discussion(self, session_id: str, updates: dict) -> dict:
        now = datetime.now(timezone.utc)
        result = await self.algorithm_discussions.find_one_and_update(
            {"session_id": session_id},
            {
                "$set": {**updates, "updated_at": now},
                "$setOnInsert": {"session_id": session_id, "created_at": now},
            },
            upsert=True,
            return_document=True,
        )
        return self._serialize(result)

    async def get_algorithm_discussion(self, session_id: str) -> Optional[dict]:
        doc = await self.algorithm_discussions.find_one({"session_id": session_id})
        return self._serialize(doc) if doc else None

    async def delete_algorithm_discussion(self, session_id: str) -> bool:
        result = await self.algorithm_discussions.delete_one({"session_id": session_id})
        return result.deleted_count > 0
