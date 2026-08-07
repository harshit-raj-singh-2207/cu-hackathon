from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, WebSocket, WebSocketDisconnect
from app.api.deps import get_current_user
from app.database import get_database
from app.controllers.webcam_analysis_controller import WebcamAnalysisController
from app.security import decode_token
from app.schemas.webcam_analysis import (
    WebcamSessionStart,
    WebcamSessionResponse,
    BodyLanguageAnalysisCreate,
    BodyLanguageAnalysisResponse,
    TimelineEventResponse,
    WebcamReportResponse,
    WebcamHistoryResponse,
)
import time

router = APIRouter()

# In-memory rate limiting fallback dictionary when Redis is not active/available
_rate_limits = {}

def check_rate_limit(client_id: str, limit: int = 60, window: int = 60) -> bool:
    """Simple sliding window rate limiter."""
    now = time.time()
    if client_id not in _rate_limits:
        _rate_limits[client_id] = []
    
    # Clean up old timestamps
    _rate_limits[client_id] = [t for t in _rate_limits[client_id] if now - t < window]
    
    if len(_rate_limits[client_id]) >= limit:
        return False
    
    _rate_limits[client_id].append(now)
    return True


def _controller() -> WebcamAnalysisController:
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable",
        )
    return WebcamAnalysisController(db)


@router.post(
    "/start",
    response_model=WebcamSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new webcam analysis session",
)
async def start_session(
    payload: WebcamSessionStart,
    current_user: dict = Depends(get_current_user),
    ctrl: WebcamAnalysisController = Depends(_controller),
):
    """Starts a webcam analysis session associated with an active interview session."""
    return await ctrl.start_session(current_user["id"], payload.interview_session_id)


@router.post(
    "/stop",
    response_model=WebcamSessionResponse,
    summary="Stop an active webcam session",
)
async def stop_session(
    session_id: str = Query(..., description="The ID of the webcam session"),
    current_user: dict = Depends(get_current_user),
    ctrl: WebcamAnalysisController = Depends(_controller),
):
    """Stops an active webcam session, computes metrics and schedules the summary report."""
    return await ctrl.stop_session(current_user["id"], session_id)


@router.post(
    "/frame-analysis",
    response_model=BodyLanguageAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Store a single frame analysis payload",
)
async def store_frame_analysis(
    payload: BodyLanguageAnalysisCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: WebcamAnalysisController = Depends(_controller),
):
    """Store granular frame metrics received from AI CV services. Implements rate limiting."""
    # Rate limit: max 60 frames per minute per user/session
    client_key = f"rl:frame:{current_user['id']}:{payload.session_id}"
    if not check_rate_limit(client_key, limit=120, window=60):  # Allow up to 2 frames per sec (120 per min)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Frame ingestion rate limit exceeded. Max 120 requests per minute.",
        )
    return await ctrl.store_frame_analysis(current_user["id"], payload)


@router.get(
    "/session/{session_id}",
    response_model=WebcamSessionResponse,
    summary="Retrieve details of a webcam session",
)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: WebcamAnalysisController = Depends(_controller),
):
    """Fetches details of a specific webcam session."""
    return await ctrl.get_session(session_id, current_user["id"])


@router.get(
    "/timeline/{session_id}",
    response_model=List[TimelineEventResponse],
    summary="Retrieve the event timeline for a session",
)
async def get_timeline(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: WebcamAnalysisController = Depends(_controller),
):
    """Retrieve all logged timeline events for a webcam session."""
    return await ctrl.get_timeline(session_id, current_user["id"])


@router.get(
    "/report/{session_id}",
    response_model=WebcamReportResponse,
    summary="Retrieve or generate the final body language report",
)
async def get_report(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: WebcamAnalysisController = Depends(_controller),
):
    """Returns the comprehensive webcam analysis report containing overall score, metrics, strengths, and weaknesses."""
    return await ctrl.get_report(session_id, current_user["id"])


@router.get(
    "/history",
    response_model=WebcamHistoryResponse,
    summary="List webcam analysis session history",
)
async def list_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user),
    ctrl: WebcamAnalysisController = Depends(_controller),
):
    """List paginated history of webcam sessions for the authenticated user."""
    items, total = await ctrl.list_history(
        user_id=current_user["id"],
        page=page,
        limit=limit,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.delete(
    "/session/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a webcam session and all cascade data",
)
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: WebcamAnalysisController = Depends(_controller),
):
    """Permanently deletes a webcam session, including its analyses, timeline events, and summaries."""
    await ctrl.delete_session(session_id, current_user["id"])
    return None


@router.websocket("/ws/webcam-analysis/{session_id}")
async def websocket_analysis(
    websocket: WebSocket,
    session_id: str,
    token: Optional[str] = Query(None),
):
    """WebSocket endpoint to receive continuous frame analysis payloads from the AI Computer Vision service."""
    # Authenticate WebSocket connection
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
    ctrl = WebcamAnalysisController(db)

    # Verify session existence and owner
    try:
        session = await ctrl.get_session(session_id, user_id)
        if session["status"] != "started":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()

    frame_counter = 0
    try:
        while True:
            data = await websocket.receive_json()
            
            # Map input format from CV service payload (defaults for missing fields)
            try:
                frame_counter += 1
                
                # Check ranges & default missing fields
                mapped_data = {
                    "session_id": session_id,
                    "timestamp": float(data.get("timestamp", float(frame_counter))),
                    "eye_contact_score": float(data.get("eye_contact_score", 0.0)),
                    "eye_contact_status": str(data.get("eye_contact_status", "Good" if float(data.get("eye_contact_score", 0.0)) >= 50 else "Lost")),
                    "smile_score": float(data.get("smile_score", 0.0)),
                    "smile_detected": bool(data.get("smile_detected", float(data.get("smile_score", 0.0)) > 30)),
                    "head_pose": str(data.get("head_pose", "Forward")),
                    "posture_score": float(data.get("posture_score", 100.0)),
                    "hand_movement_score": float(data.get("hand_movement_score", 0.0)),
                    "attention_score": float(data.get("attention_score", 100.0)),
                    "distraction_detected": bool(data.get("distraction_detected", False)),
                    "confidence_score": float(data.get("confidence_score", 100.0)),
                    "face_visible": bool(data.get("face_visible", True)),
                    "multiple_faces_detected": bool(data.get("multiple_faces_detected", False)),
                    "camera_off": bool(data.get("camera_off", False)),
                    "frame_number": int(data.get("frame_number", frame_counter))
                }
                
                # Validate input using Pydantic schema
                validated = BodyLanguageAnalysisCreate(**mapped_data)
                
                # Store
                await ctrl.store_frame_analysis(user_id, validated)
                
                # Send confirmation
                await websocket.send_json({"status": "stored", "frame": validated.frame_number})
            except Exception as e:
                await websocket.send_json({"status": "error", "message": str(e)})

    except WebSocketDisconnect:
        # Client disconnected
        pass
