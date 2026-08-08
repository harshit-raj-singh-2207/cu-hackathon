from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.coding_interview_service import CodingInterviewService
from app.schemas.coding_interview import (
    CodingSessionCreate,
    CodingSessionUpdate,
    CodeSnapshotCreate,
    SubmissionCreate,
    TestCaseCreate,
    TestCaseUpdate,
    AIQuestionHookCreate,
    AIQuestionHookUpdate,
    AlgorithmDiscussionCreate,
)


class CodingInterviewController:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.service = CodingInterviewService(database)

    # --- Session Endpoints ---
    async def create_session(self, user_id: str, payload: CodingSessionCreate) -> dict:
        return await self.service.create_session(user_id, payload)

    async def get_session(self, session_id: str, user_id: str) -> dict:
        return await self.service.get_session(session_id, user_id)

    async def list_sessions(
        self,
        user_id: str,
        status: Optional[str] = None,
        language: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.service.list_user_sessions(
            user_id=user_id,
            status=status,
            language=language,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            limit=limit,
        )

    async def update_session(self, session_id: str, user_id: str, payload: CodingSessionUpdate) -> dict:
        return await self.service.update_session(session_id, user_id, payload)

    async def end_session(self, session_id: str, user_id: str) -> dict:
        return await self.service.end_session(session_id, user_id)

    async def delete_session(self, session_id: str, user_id: str) -> None:
        await self.service.delete_session(session_id, user_id)

    # --- Snapshot Endpoints ---
    async def save_snapshot(self, session_id: str, user_id: str, payload: CodeSnapshotCreate) -> dict:
        return await self.service.save_snapshot(session_id, user_id, payload)

    async def get_snapshot_history(self, session_id: str, user_id: str) -> List[dict]:
        return await self.service.get_snapshot_history(session_id, user_id)

    # --- Submission Endpoints ---
    async def submit_code(self, session_id: str, user_id: str, payload: SubmissionCreate) -> dict:
        return await self.service.submit_code(session_id, user_id, payload)

    async def get_submission_history(self, session_id: str, user_id: str) -> List[dict]:
        return await self.service.get_submission_history(session_id, user_id)

    # --- Test Case Endpoints ---
    async def create_test_case(self, session_id: str, user_id: str, payload: TestCaseCreate) -> dict:
        return await self.service.create_test_case(session_id, user_id, payload)

    async def list_test_cases(self, session_id: str, user_id: str) -> List[dict]:
        return await self.service.list_test_cases(session_id, user_id)

    async def update_test_case(
        self, session_id: str, test_case_id: str, user_id: str, payload: TestCaseUpdate
    ) -> dict:
        return await self.service.update_test_case(session_id, test_case_id, user_id, payload)

    async def delete_test_case(self, session_id: str, test_case_id: str, user_id: str) -> None:
        await self.service.delete_test_case(session_id, test_case_id, user_id)

    # --- AI Hook Endpoints ---
    async def create_ai_hook(self, payload: AIQuestionHookCreate) -> dict:
        return await self.service.create_ai_hook(payload)

    async def get_ai_hook(self, question_id: str) -> dict:
        return await self.service.get_ai_hook(question_id)

    async def update_ai_hook(self, question_id: str, payload: AIQuestionHookUpdate) -> dict:
        return await self.service.update_ai_hook(question_id, payload)

    async def delete_ai_hook(self, question_id: str) -> None:
        await self.service.delete_ai_hook(question_id)

    async def list_ai_hooks(
        self,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.service.list_ai_hooks(
            difficulty=difficulty,
            search=search,
            page=page,
            limit=limit,
        )

    # --- Algorithm Discussion Endpoints ---
    async def upsert_algorithm_discussion(
        self, session_id: str, user_id: str, payload: AlgorithmDiscussionCreate
    ) -> dict:
        return await self.service.upsert_algorithm_discussion(session_id, user_id, payload)

    async def get_algorithm_discussion(self, session_id: str, user_id: str) -> dict:
        return await self.service.get_algorithm_discussion(session_id, user_id)

    async def delete_algorithm_discussion(self, session_id: str, user_id: str) -> None:
        await self.service.delete_algorithm_discussion(session_id, user_id)
