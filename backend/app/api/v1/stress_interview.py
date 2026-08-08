from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, WebSocket, WebSocketDisconnect
from app.api.deps import get_current_user
from app.database import get_database
from app.controllers.stress_interview_controller import StressInterviewController
from app.security import decode_token
from app.schemas.stress_interview import (
    StressSessionStart,
    StressSessionConfigure,
    StressSessionResponse,
    StressEventCreate,
    StressEventResponse,
    StressReportResponse,
    StressHistoryResponse,
)

router = APIRouter()


def _controller() -> StressInterviewController:
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable",
        )
    return StressInterviewController(db)


@router.post(
    "/start",
    response_model=StressSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new stress interview session",
)
async def start_session(
    payload: StressSessionStart,
    current_user: dict = Depends(get_current_user),
    ctrl: StressInterviewController = Depends(_controller),
):
    return await ctrl.start_session(current_user["id"], payload)


@router.post(
    "/stop",
    response_model=StressSessionResponse,
    summary="Stop an active stress interview session",
)
async def stop_session(
    session_id: str = Query(..., description="The ID of the stress session"),
    current_user: dict = Depends(get_current_user),
    ctrl: StressInterviewController = Depends(_controller),
):
    return await ctrl.stop_session(current_user["id"], session_id)


@router.put(
    "/configure",
    response_model=StressSessionResponse,
    summary="Configure stress interview settings",
)
async def configure_session(
    payload: StressSessionConfigure,
    current_user: dict = Depends(get_current_user),
    ctrl: StressInterviewController = Depends(_controller),
):
    return await ctrl.configure_session(current_user["id"], payload)


@router.put(
    "/config",
    response_model=StressSessionResponse,
    summary="Alias to configure stress interview settings",
)
async def configure_session_alias(
    payload: StressSessionConfigure,
    current_user: dict = Depends(get_current_user),
    ctrl: StressInterviewController = Depends(_controller),
):
    return await ctrl.configure_session(current_user["id"], payload)


@router.post(
    "/event",
    response_model=StressEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a pressure/stress event",
)
async def store_event(
    payload: StressEventCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: StressInterviewController = Depends(_controller),
):
    return await ctrl.store_event(current_user["id"], payload)


@router.get(
    "/session/{session_id}",
    response_model=StressSessionResponse,
    summary="Retrieve details of a stress session",
)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: StressInterviewController = Depends(_controller),
):
    return await ctrl.get_session(session_id, current_user["id"])


@router.get(
    "/events/{session_id}",
    response_model=List[StressEventResponse],
    summary="Retrieve all logged events for a stress session",
)
async def get_events(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: StressInterviewController = Depends(_controller),
):
    return await ctrl.get_events(session_id, current_user["id"])


@router.get(
    "/report/{session_id}",
    response_model=StressReportResponse,
    summary="Retrieve or generate the final stress report",
)
async def get_report(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: StressInterviewController = Depends(_controller),
):
    return await ctrl.get_report(session_id, current_user["id"])


@router.get(
    "/history",
    response_model=StressHistoryResponse,
    summary="List stress session history",
)
async def list_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user),
    ctrl: StressInterviewController = Depends(_controller),
):
    items, total = await ctrl.list_history(
        user_id=current_user["id"],
        page=page,
        limit=limit,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.delete(
    "/session/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a stress session and all associated data",
)
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: StressInterviewController = Depends(_controller),
):
    await ctrl.delete_session(session_id, current_user["id"])
    return None


@router.websocket("/ws/stress/{session_id}")
async def websocket_stress(
    websocket: WebSocket,
    session_id: str,
    token: Optional[str] = Query(None),
):
    # Authenticate connection
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db = get_database()
    if db is None:
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    user = await db["users"].find_one({"email": payload["sub"]})
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = str(user["_id"])
    ctrl = StressInterviewController(db)

    # Verify session active
    try:
        session = await ctrl.get_session(session_id, user_id)
        if session["status"] != "started":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            
            # Map WebSocket format to StressEventCreate
            try:
                ws_event_type = str(data.get("event_type", "event"))
                # Clean up event names to standardized types
                event_map = {
                    "interrupt": "Question Interrupted",
                    "followup": "Rapid Follow-up",
                    "counter": "Counter Question",
                    "hesitate": "Candidate Hesitated",
                    "pause": "Long Pause",
                    "timeout": "Response Timeout"
                }
                event_type = event_map.get(ws_event_type, ws_event_type.title())

                severity_map = {
                    "Low": "low",
                    "Medium": "medium",
                    "High": "high",
                    "Extreme": "high"
                }
                severity = severity_map.get(data.get("pressure_level", "Medium"), "medium")

                mapped_payload = {
                    "session_id": session_id,
                    "event_type": event_type,
                    "event_time": float(data.get("timestamp", 0.0)),
                    "candidate_response_time": float(data.get("response_time")) if data.get("response_time") is not None else None,
                    "interrupt_triggered": bool(data.get("interrupt_triggered", ws_event_type == "interrupt")),
                    "followup_generated": bool(data.get("followup_generated", False)),
                    "counter_question_generated": bool(data.get("counter_question", False)),
                    "difficulty_level": str(data.get("difficulty", "Medium")),
                    "severity": severity,
                    "notes": f"WebSocket stream event: {ws_event_type}"
                }
                
                validated = StressEventCreate(**mapped_payload)
                await ctrl.store_event(user_id, validated)
                
                await websocket.send_json({"status": "stored", "event": validated.event_type})
            except Exception as e:
                await websocket.send_json({"status": "error", "message": str(e)})

    except WebSocketDisconnect:
        pass
