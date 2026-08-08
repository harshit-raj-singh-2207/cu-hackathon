from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_user
from app.database import get_database
from app.controllers.coding_interview_controller import CodingInterviewController
from app.schemas.coding_interview import (
    CodingSessionCreate,
    CodingSessionUpdate,
    CodingSessionResponse,
    CodeSnapshotCreate,
    CodeSnapshotResponse,
    SubmissionCreate,
    SubmissionResponse,
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
    AIQuestionHookCreate,
    AIQuestionHookUpdate,
    AIQuestionHookResponse,
    AlgorithmDiscussionCreate,
    AlgorithmDiscussionResponse,
)

router = APIRouter()


def _controller() -> CodingInterviewController:
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable",
        )
    return CodingInterviewController(db)


# --- Coding Session API ---
@router.post(
    "/sessions",
    response_model=CodingSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new coding session",
)
async def create_session(
    payload: CodingSessionCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.create_session(current_user["id"], payload)


@router.get(
    "/sessions/{session_id}",
    response_model=CodingSessionResponse,
    summary="Retrieve details of a coding session",
)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.get_session(session_id, current_user["id"])


@router.get(
    "/sessions",
    summary="List all coding sessions for the user",
)
async def list_sessions(
    status: Optional[str] = Query(None, description="Filter by status (Pending, Active, Completed)"),
    language: Optional[str] = Query(None, description="Filter by programming language"),
    search: Optional[str] = Query(None, description="Search term for session ID or language"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort direction (asc or desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    items, total = await ctrl.list_sessions(
        user_id=current_user["id"],
        status=status,
        language=language,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.put(
    "/sessions/{session_id}",
    response_model=CodingSessionResponse,
    summary="Update coding session fields",
)
async def update_session(
    session_id: str,
    payload: CodingSessionUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.update_session(session_id, current_user["id"], payload)


@router.post(
    "/sessions/{session_id}/end",
    response_model=CodingSessionResponse,
    summary="Mark a coding session as completed",
)
async def end_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.end_session(session_id, current_user["id"])


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a coding session",
)
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    await ctrl.delete_session(session_id, current_user["id"])
    return None


# --- Code Snapshot API ---
@router.post(
    "/sessions/{session_id}/snapshots",
    response_model=CodeSnapshotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a code snapshot",
)
async def save_snapshot(
    session_id: str,
    payload: CodeSnapshotCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.save_snapshot(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/snapshots",
    response_model=List[CodeSnapshotResponse],
    summary="Get history of saved snapshots for a session",
)
async def get_snapshot_history(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.get_snapshot_history(session_id, current_user["id"])


# --- Submission API ---
@router.post(
    "/sessions/{session_id}/submissions",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit code for evaluation",
)
async def submit_code(
    session_id: str,
    payload: SubmissionCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.submit_code(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/submissions",
    response_model=List[SubmissionResponse],
    summary="Get submission history for a session",
)
async def get_submission_history(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.get_submission_history(session_id, current_user["id"])


# --- Test Cases API ---
@router.post(
    "/sessions/{session_id}/test-cases",
    response_model=TestCaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a custom test case",
)
async def create_test_case(
    session_id: str,
    payload: TestCaseCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.create_test_case(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/test-cases",
    response_model=List[TestCaseResponse],
    summary="List all test cases of a coding session",
)
async def list_test_cases(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.list_test_cases(session_id, current_user["id"])


@router.put(
    "/sessions/{session_id}/test-cases/{test_case_id}",
    response_model=TestCaseResponse,
    summary="Update a test case",
)
async def update_test_case(
    session_id: str,
    test_case_id: str,
    payload: TestCaseUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.update_test_case(session_id, test_case_id, current_user["id"], payload)


@router.delete(
    "/sessions/{session_id}/test-cases/{test_case_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a test case",
)
async def delete_test_case(
    session_id: str,
    test_case_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    await ctrl.delete_test_case(session_id, test_case_id, current_user["id"])
    return None


# --- AI Question Hooks API ---
@router.post(
    "/ai-hooks",
    response_model=AIQuestionHookResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create AI Question Hook (admin prep)",
)
async def create_ai_hook(
    payload: AIQuestionHookCreate,
    ctrl: CodingInterviewController = Depends(_controller),
):
    # Public/Admin helper route prep
    return await ctrl.create_ai_hook(payload)


@router.get(
    "/ai-hooks/{question_id}",
    response_model=AIQuestionHookResponse,
    summary="Get AI Question Hook details",
)
async def get_ai_hook(
    question_id: str,
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.get_ai_hook(question_id)


@router.put(
    "/ai-hooks/{question_id}",
    response_model=AIQuestionHookResponse,
    summary="Update AI Question Hook details",
)
async def update_ai_hook(
    question_id: str,
    payload: AIQuestionHookUpdate,
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.update_ai_hook(question_id, payload)


@router.delete(
    "/ai-hooks/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete AI Question Hook",
)
async def delete_ai_hook(
    question_id: str,
    ctrl: CodingInterviewController = Depends(_controller),
):
    await ctrl.delete_ai_hook(question_id)
    return None


@router.get(
    "/ai-hooks",
    summary="List all AI Question Hooks",
)
async def list_ai_hooks(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    search: Optional[str] = Query(None, description="Search by concept or question text"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    ctrl: CodingInterviewController = Depends(_controller),
):
    items, total = await ctrl.list_ai_hooks(
        difficulty=difficulty,
        search=search,
        page=page,
        limit=limit,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


# --- Algorithm Discussion API ---
@router.post(
    "/sessions/{session_id}/algorithm-discussion",
    response_model=AlgorithmDiscussionResponse,
    summary="Upsert (create or update) algorithm discussion feedback",
)
async def upsert_algorithm_discussion(
    session_id: str,
    payload: AlgorithmDiscussionCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.upsert_algorithm_discussion(session_id, current_user["id"], payload)


@router.get(
    "/sessions/{session_id}/algorithm-discussion",
    response_model=AlgorithmDiscussionResponse,
    summary="Retrieve algorithm discussion for a coding session",
)
async def get_algorithm_discussion(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    return await ctrl.get_algorithm_discussion(session_id, current_user["id"])


@router.delete(
    "/sessions/{session_id}/algorithm-discussion",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete algorithm discussion for a coding session",
)
async def delete_algorithm_discussion(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CodingInterviewController = Depends(_controller),
):
    await ctrl.delete_algorithm_discussion(session_id, current_user["id"])
    return None
