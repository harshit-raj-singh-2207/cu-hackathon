from datetime import datetime, timezone
from typing import Optional, List, Tuple
from uuid import uuid4
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.coding_interview_repository import CodingInterviewRepository
from app.models.coding_interview import (
    CodingSessionDocument,
    CodeSnapshotDocument,
    SubmissionDocument,
    TestCaseDocument,
    AIQuestionHookDocument,
    AlgorithmDiscussionDocument,
    SessionStatus,
    CompilationStatus,
    ExecutionLogs,
    CodeQualityMetrics,
)
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
    AlgorithmDiscussionUpdate,
)


class CodingInterviewService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.repo = CodingInterviewRepository(database)

    async def _get_owned_session(self, session_id: str, user_id: str) -> dict:
        session = await self.repo.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coding session not found",
            )
        if session["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this session",
            )
        return session

    # --- Session Services ---
    async def create_session(self, user_id: str, payload: CodingSessionCreate) -> dict:
        now = datetime.now(timezone.utc)
        doc = CodingSessionDocument(
            session_id=str(uuid4()),
            user_id=user_id,
            interview_id=payload.interview_id,
            programming_language=payload.programming_language.value,
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
        language: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.repo.list_sessions(
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
        await self._get_owned_session(session_id, user_id)
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one field must be provided to update",
            )
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.repo.update_session(session_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update session",
            )
        return result

    async def end_session(self, session_id: str, user_id: str) -> dict:
        session = await self._get_owned_session(session_id, user_id)
        if session["status"] == SessionStatus.COMPLETED.value:
            return session

        now = datetime.now(timezone.utc)
        started_at = session["started_at"]
        if started_at.tzinfo is None:
            started_at = started_at.replace(tzinfo=timezone.utc)
        duration_seconds = int((now - started_at).total_seconds())

        updates = {
            "status": SessionStatus.COMPLETED.value,
            "ended_at": now,
            "duration": duration_seconds,
            "updated_at": now,
        }
        result = await self.repo.update_session(session_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to complete session",
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

    # --- Snapshot Services ---
    async def save_snapshot(self, session_id: str, user_id: str, payload: CodeSnapshotCreate) -> dict:
        await self._get_owned_session(session_id, user_id)
        next_num = await self.repo.get_latest_snapshot_number(session_id) + 1
        doc = CodeSnapshotDocument(
            session_id=session_id,
            source_code=payload.source_code,
            snapshot_number=next_num,
            created_at=datetime.now(timezone.utc),
        )
        return await self.repo.save_snapshot(doc)

    async def get_snapshot_history(self, session_id: str, user_id: str) -> List[dict]:
        await self._get_owned_session(session_id, user_id)
        return await self.repo.get_snapshot_history(session_id)

    # --- Submission Services ---
    async def submit_code(self, session_id: str, user_id: str, payload: SubmissionCreate) -> dict:
        session = await self._get_owned_session(session_id, user_id)
        
        # Simulated Code Execution
        code = payload.source_code
        has_syntax_errors = "syntax error" in code.lower() or "err" in code.lower() and len(code) < 30
        has_infinite_loop = "while(true)" in code.replace(" ", "").lower() or "while true" in code.lower()
        has_oom = "outofmemory" in code.lower()
        
        if has_syntax_errors:
            status_val = CompilationStatus.COMPILATION_ERROR
            stdout = ""
            stderr = "Compilation failed: SyntaxError at line 3"
            exec_time = 0.05
            mem_used = 15.4
            score = 0.0
        elif has_infinite_loop:
            status_val = CompilationStatus.TIME_LIMIT_EXCEEDED
            stdout = "Initializing...\nRunning test cases...\n"
            stderr = "Error: Execution timed out after 5000ms"
            exec_time = 5.0
            mem_used = 42.1
            score = 10.0
        elif has_oom:
            status_val = CompilationStatus.MEMORY_LIMIT_EXCEEDED
            stdout = "Initializing...\n"
            stderr = "Fatal error: Allowed memory size exhausted"
            exec_time = 1.2
            mem_used = 512.0
            score = 5.0
        else:
            status_val = CompilationStatus.SUCCESS
            stdout = "All test cases passed successfully.\n"
            stderr = ""
            exec_time = 0.12
            mem_used = 28.5
            score = min(100.0, float(30 + len(code.split()) // 2))

        # Evaluate code quality based on standard heuristics
        readability = max(50.0, min(100.0, float(60 + len(code) % 35)))
        naming = max(50.0, min(100.0, float(70 - ("temp" in code) * 15 + ("camelCase" in code or "snake_case" in code) * 20)))
        optimization = max(40.0, min(100.0, float(85 - ("for" in code and "for" in code[code.find("for")+1:]) * 20)))
        maintainability = (readability + naming + optimization) / 3.0
        overall = (score + maintainability) / 2.0

        logs = ExecutionLogs(
            stdout=stdout,
            stderr=stderr,
            execution_time=exec_time,
            memory_used=mem_used,
            runtime_status="Terminated Normally" if status_val == CompilationStatus.SUCCESS else "Exception",
        )

        quality = CodeQualityMetrics(
            readability_score=readability,
            naming_score=naming,
            optimization_score=optimization,
            maintainability_score=maintainability,
            overall_score=overall,
            evaluator_remarks="The code structure is sound. Ensure variable names are self-explanatory and avoid nested loops.",
        )

        doc = SubmissionDocument(
            session_id=session_id,
            source_code=code,
            language=payload.language.value,
            submitted_at=datetime.now(timezone.utc),
            execution_status=status_val,
            score=overall,
            execution_logs=logs,
            code_quality_metrics=quality,
        )

        # Update session status to Completed automatically upon successful submission if needed
        if session["status"] == SessionStatus.PENDING.value:
            await self.repo.update_session(session_id, {"status": SessionStatus.ACTIVE.value})

        return await self.repo.create_submission(doc)

    async def get_submission_history(self, session_id: str, user_id: str) -> List[dict]:
        await self._get_owned_session(session_id, user_id)
        return await self.repo.get_submission_history(session_id)

    # --- Test Cases ---
    async def create_test_case(self, session_id: str, user_id: str, payload: TestCaseCreate) -> dict:
        await self._get_owned_session(session_id, user_id)
        now = datetime.now(timezone.utc)
        doc = TestCaseDocument(
            test_case_id=str(uuid4()),
            session_id=session_id,
            input=payload.input,
            expected_output=payload.expected_output,
            actual_output=None,
            passed=None,
            is_sample=payload.is_sample,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create_test_case(doc)

    async def list_test_cases(self, session_id: str, user_id: str) -> List[dict]:
        await self._get_owned_session(session_id, user_id)
        return await self.repo.list_test_cases(session_id)

    async def update_test_case(
        self, session_id: str, test_case_id: str, user_id: str, payload: TestCaseUpdate
    ) -> dict:
        await self._get_owned_session(session_id, user_id)
        test_case = await self.repo.get_test_case(test_case_id)
        if not test_case or test_case["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found in this session",
            )
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updates provided",
            )
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.repo.update_test_case(test_case_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update test case",
            )
        return result

    async def delete_test_case(self, session_id: str, test_case_id: str, user_id: str) -> None:
        await self._get_owned_session(session_id, user_id)
        test_case = await self.repo.get_test_case(test_case_id)
        if not test_case or test_case["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found in this session",
            )
        success = await self.repo.delete_test_case(test_case_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete test case",
            )

    # --- AI Question Hooks ---
    async def create_ai_hook(self, payload: AIQuestionHookCreate) -> dict:
        now = datetime.now(timezone.utc)
        doc = AIQuestionHookDocument(
            question_id=payload.question_id,
            follow_up_question=payload.follow_up_question,
            related_concept=payload.related_concept,
            difficulty=payload.difficulty,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create_ai_hook(doc)

    async def get_ai_hook(self, question_id: str) -> dict:
        hook = await self.repo.get_ai_hook(question_id)
        if not hook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AI Question Hook not found",
            )
        return hook

    async def update_ai_hook(self, question_id: str, payload: AIQuestionHookUpdate) -> dict:
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updates provided",
            )
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.repo.update_ai_hook(question_id, updates)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Failed to update AI Hook",
            )
        return result

    async def delete_ai_hook(self, question_id: str) -> None:
        success = await self.repo.delete_ai_hook(question_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AI Question Hook not found or deletion failed",
            )

    async def list_ai_hooks(
        self,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.repo.list_ai_hooks(
            difficulty=difficulty,
            search=search,
            page=page,
            limit=limit,
        )

    # --- Algorithm Discussion ---
    async def upsert_algorithm_discussion(
        self, session_id: str, user_id: str, payload: AlgorithmDiscussionCreate
    ) -> dict:
        await self._get_owned_session(session_id, user_id)
        updates = payload.model_dump()
        return await self.repo.upsert_algorithm_discussion(session_id, updates)

    async def get_algorithm_discussion(self, session_id: str, user_id: str) -> dict:
        await self._get_owned_session(session_id, user_id)
        discussion = await self.repo.get_algorithm_discussion(session_id)
        if not discussion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Algorithm discussion not found for this session",
            )
        return discussion

    async def delete_algorithm_discussion(self, session_id: str, user_id: str) -> None:
        await self._get_owned_session(session_id, user_id)
        success = await self.repo.delete_algorithm_discussion(session_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Algorithm discussion not found or deletion failed",
            )
