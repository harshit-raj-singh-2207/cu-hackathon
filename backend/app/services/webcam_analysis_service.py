from datetime import datetime, timezone
from typing import Optional, List, Tuple
from uuid import uuid4
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.webcam_analysis_repository import WebcamAnalysisRepository
from app.models.webcam_analysis import (
    WebcamSessionDocument,
    BodyLanguageAnalysisDocument,
    BodyLanguageSummaryDocument,
    TimelineEventDocument,
)
from app.schemas.webcam_analysis import (
    BodyLanguageAnalysisCreate,
)


class WebcamAnalysisService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.repo = WebcamAnalysisRepository(database)
        self.interview_sessions = database["interview_sessions"]

    async def _get_owned_session(self, session_id: str, user_id: str) -> dict:
        session = await self.repo.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webcam session not found",
            )
        if session["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this session",
            )
        return session

    async def start_session(self, user_id: str, interview_session_id: str) -> dict:
        # Validate that the interview session exists and belongs to the user
        interview = await self.interview_sessions.find_one({
            "session_id": interview_session_id,
            "user_id": user_id
        })
        if not interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Matching active interview session not found",
            )

        # Prevent duplicate sessions: checks if a session is already "started"
        existing = await self.repo.get_active_session_for_interview(interview_session_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An active webcam session already exists for this interview",
            )

        now = datetime.now(timezone.utc)
        doc = WebcamSessionDocument(
            user_id=user_id,
            interview_session_id=interview_session_id,
            status="started",
            camera_started_at=now,
            created_at=now,
            updated_at=now
        )
        # Use generated UUID for session_id to keep it unique and decouple from DB id
        session_id = str(uuid4())
        # Store as dict attribute first
        data = doc.model_dump(exclude={"id"})
        data["session_id"] = session_id
        result = await self.repo.sessions.insert_one(data)
        data["_id"] = result.inserted_id
        return self.repo._serialize(data)

    async def stop_session(self, user_id: str, session_id: str) -> dict:
        session = await self._get_owned_session(session_id, user_id)
        if session["status"] == "stopped":
            return session

        now = datetime.now(timezone.utc)
        started_at = session.get("camera_started_at")
        if isinstance(started_at, str):
            started_at = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        
        duration = None
        if started_at:
            duration = (now - started_at.replace(tzinfo=timezone.utc)).total_seconds()

        updates = {
            "status": "stopped",
            "camera_stopped_at": now,
            "duration": duration,
            "updated_at": now
        }
        updated = await self.repo.update_session(session_id, updates)

        # Trigger summary generation in background
        try:
            from app.celery_app import HAS_CELERY
            if HAS_CELERY:
                from app.tasks.webcam_tasks import generate_session_summary
                generate_session_summary.delay(session_id)
            else:
                await self.generate_final_summary_internal(session_id)
        except Exception:
            # Fallback to synchronous generation if Celery worker/broker connection fails
            await self.generate_final_summary_internal(session_id)

        return updated

    async def store_frame_analysis(self, user_id: str, payload: BodyLanguageAnalysisCreate) -> dict:
        # Validate session ownership
        session = await self._get_owned_session(payload.session_id, user_id)
        if session["status"] != "started":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Webcam session is not in started state",
            )

        now = datetime.now(timezone.utc)
        doc = BodyLanguageAnalysisDocument(
            session_id=payload.session_id,
            timestamp=payload.timestamp,
            eye_contact_score=payload.eye_contact_score,
            eye_contact_status=payload.eye_contact_status,
            smile_score=payload.smile_score,
            smile_detected=payload.smile_detected,
            head_pose=payload.head_pose,
            posture_score=payload.posture_score,
            hand_movement_score=payload.hand_movement_score,
            attention_score=payload.attention_score,
            distraction_detected=payload.distraction_detected,
            confidence_score=payload.confidence_score,
            face_visible=payload.face_visible,
            multiple_faces_detected=payload.multiple_faces_detected,
            camera_off=payload.camera_off,
            frame_number=payload.frame_number,
            created_at=now,
        )

        analysis = await self.repo.create_analysis(doc)
        await self._evaluate_and_trigger_events(session["session_id"], doc)
        return analysis

    async def get_session(self, session_id: str, user_id: str) -> dict:
        return await self._get_owned_session(session_id, user_id)

    async def get_timeline(self, session_id: str, user_id: str) -> List[dict]:
        await self._get_owned_session(session_id, user_id)
        return await self.repo.get_events_for_session(session_id)

    async def get_report(self, session_id: str, user_id: str) -> dict:
        session = await self._get_owned_session(session_id, user_id)
        summary = await self.repo.get_summary(session_id)
        
        # If summary is not generated yet (e.g. stopped but async worker hasn't processed), generate it synchronously.
        if not summary:
            summary = await self.generate_final_summary_internal(session_id)

        events = await self.repo.get_events_for_session(session_id)

        # Build Strengths & Weaknesses
        strengths = []
        weaknesses = []

        metrics = {
            "Eye Contact": summary.get("average_eye_contact", 0.0),
            "Posture": summary.get("average_posture", 0.0),
            "Attention": summary.get("average_attention", 0.0),
            "Smile": summary.get("average_smile", 0.0),
            "Confidence": summary.get("average_confidence", 0.0)
        }

        for metric, score in metrics.items():
            if score >= 75:
                strengths.append(f"Excellent {metric.lower()} level ({score}%)")
            elif score < 70:
                weaknesses.append(f"Needs improvement in {metric.lower()} ({score}%)")

        return {
            "session_id": session_id,
            "average_eye_contact": summary.get("average_eye_contact", 0.0),
            "average_posture": summary.get("average_posture", 0.0),
            "average_attention": summary.get("average_attention", 0.0),
            "average_smile": summary.get("average_smile", 0.0),
            "average_confidence": summary.get("average_confidence", 0.0),
            "total_distractions": summary.get("total_distractions", 0),
            "total_camera_off_events": summary.get("total_camera_off_events", 0),
            "overall_score": summary.get("overall_score", 0.0),
            "remarks": summary.get("remarks", "No data"),
            "recommendations": summary.get("recommendations", []),
            "timeline_summary": events,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "created_at": summary.get("created_at", datetime.now(timezone.utc))
        }

    async def list_history(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.repo.list_sessions(user_id=user_id, page=page, limit=limit)

    async def delete_session(self, session_id: str, user_id: str) -> None:
        await self._get_owned_session(session_id, user_id)
        success = await self.repo.delete_session(session_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete webcam session",
            )

    async def generate_final_summary_internal(self, session_id: str) -> dict:
        analyses = await self.repo.get_analyses_for_session(session_id)
        now = datetime.now(timezone.utc)

        if not analyses:
            # Create a default summary if no frame data was ingested
            default_doc = BodyLanguageSummaryDocument(
                session_id=session_id,
                average_eye_contact=0.0,
                average_posture=0.0,
                average_attention=0.0,
                average_smile=0.0,
                average_confidence=0.0,
                total_distractions=0,
                total_camera_off_events=0,
                overall_score=0.0,
                remarks="No webcam data was recorded for this session.",
                recommendations=["Please ensure your camera is enabled and try again."],
                created_at=now
            )
            return await self.repo.create_summary(default_doc)

        n = len(analyses)
        sum_eye = sum(a["eye_contact_score"] for a in analyses)
        sum_posture = sum(a["posture_score"] for a in analyses)
        sum_att = sum(a["attention_score"] for a in analyses)
        sum_smile = sum(a["smile_score"] for a in analyses)
        sum_conf = sum(a["confidence_score"] for a in analyses)

        # Camera off / distraction counts
        total_distractions = sum(1 for a in analyses if a.get("distraction_detected"))
        total_camera_off = sum(1 for a in analyses if a.get("camera_off"))

        avg_eye = round(sum_eye / n, 2)
        avg_posture = round(sum_posture / n, 2)
        avg_att = round(sum_att / n, 2)
        avg_smile = round(sum_smile / n, 2)
        avg_conf = round(sum_conf / n, 2)

        # Simple overall score formula (equal weighting)
        overall_score = round((avg_eye + avg_posture + avg_att + avg_smile + avg_conf) / 5, 2)

        # Dynamic recommendations based on metrics
        recommendations = []
        if avg_eye < 70:
            recommendations.append("Practice looking directly at the lens rather than the screen to project confidence.")
        if avg_posture < 70:
            recommendations.append("Align your camera at eye level and sit upright to present a professional posture.")
        if avg_att < 75:
            recommendations.append("Ensure your environment is quiet and free of side activities to minimize looking away.")
        if avg_conf < 70:
            recommendations.append("Speak clearly and maintain stable eye contact to improve overall confidence scores.")
        if avg_smile < 20:
            recommendations.append("Smiling slightly at key moments helps establish friendly rapport.")

        if not recommendations:
            recommendations.append("Excellent presence! Continue practicing to maintain this level of body language.")

        # Determine overall remarks
        if overall_score >= 85:
            remarks = "Exceptional camera presence. You maintained great eye contact, high attention, and strong posture."
        elif overall_score >= 70:
            remarks = "Good overall engagement, with minor adjustments needed in eye contact or seating posture."
        else:
            remarks = "Body language could be improved. Try practicing focusing more on the camera and sitting straight."

        summary_doc = BodyLanguageSummaryDocument(
            session_id=session_id,
            average_eye_contact=avg_eye,
            average_posture=avg_posture,
            average_attention=avg_att,
            average_smile=avg_smile,
            average_confidence=avg_conf,
            total_distractions=total_distractions,
            total_camera_off_events=total_camera_off,
            overall_score=overall_score,
            remarks=remarks,
            recommendations=recommendations,
            created_at=now
        )

        return await self.repo.create_summary(summary_doc)

    async def _evaluate_and_trigger_events(self, session_id: str, analysis: BodyLanguageAnalysisDocument) -> None:
        """Helper to generate timeline events dynamically from frame metrics using simple threshold checks."""
        now = datetime.now(timezone.utc)
        
        # Helper to query the last event of a specific type to debounce (don't spam within 5 seconds)
        async def is_debounced(event_type: str) -> bool:
            last_ev = await self.repo.events.find_one(
                {"session_id": session_id, "event_type": event_type},
                sort=[("event_time", -1)]
            )
            if last_ev:
                last_time = last_ev.get("event_time", 0)
                if (analysis.timestamp - last_time) < 5.0:
                    return True
            return False

        # 1. Camera off
        if analysis.camera_off:
            if not await is_debounced("Camera Disabled"):
                await self.repo.create_event(TimelineEventDocument(
                    session_id=session_id,
                    event_type="Camera Disabled",
                    event_time=analysis.timestamp,
                    severity="high",
                    confidence=100.0,
                    description="Webcam feed was disabled/turned off.",
                    created_at=now
                ))
            return  # Stop checking further since camera is off

        # 2. Face visible
        if not analysis.face_visible:
            if not await is_debounced("Face Not Visible"):
                await self.repo.create_event(TimelineEventDocument(
                    session_id=session_id,
                    event_type="Face Not Visible",
                    event_time=analysis.timestamp,
                    severity="high",
                    confidence=100.0,
                    description="No face detected in the active frame.",
                    created_at=now
                ))
            return

        # 3. Multiple faces
        if analysis.multiple_faces_detected:
            if not await is_debounced("Multiple Faces"):
                await self.repo.create_event(TimelineEventDocument(
                    session_id=session_id,
                    event_type="Multiple Faces",
                    event_time=analysis.timestamp,
                    severity="medium",
                    confidence=95.0,
                    description="Multiple faces detected in camera frame.",
                    created_at=now
                ))

        # 4. Eye contact lost
        if analysis.eye_contact_status == "Lost" or analysis.eye_contact_score < 40:
            if not await is_debounced("Eye Contact Lost"):
                await self.repo.create_event(TimelineEventDocument(
                    session_id=session_id,
                    event_type="Eye Contact Lost",
                    event_time=analysis.timestamp,
                    severity="medium",
                    confidence=round(100.0 - analysis.eye_contact_score, 2),
                    description="User lost direct eye contact with the camera.",
                    created_at=now
                ))

        # 5. Looking away
        if analysis.head_pose != "Forward" and analysis.attention_score < 50:
            if not await is_debounced("Looking Away"):
                await self.repo.create_event(TimelineEventDocument(
                    session_id=session_id,
                    event_type="Looking Away",
                    event_time=analysis.timestamp,
                    severity="medium",
                    confidence=round(100.0 - analysis.attention_score, 2),
                    description=f"User is looking away (head pose: {analysis.head_pose}).",
                    created_at=now
                ))

        # 6. Bad posture
        if analysis.posture_score < 45:
            if not await is_debounced("Bad Posture"):
                await self.repo.create_event(TimelineEventDocument(
                    session_id=session_id,
                    event_type="Bad Posture",
                    event_time=analysis.timestamp,
                    severity="low",
                    confidence=round(100.0 - analysis.posture_score, 2),
                    description="User posture slouching or misaligned camera.",
                    created_at=now
                ))

        # 7. Distraction detected
        if analysis.distraction_detected:
            if not await is_debounced("Distraction Detected"):
                await self.repo.create_event(TimelineEventDocument(
                    session_id=session_id,
                    event_type="Distraction Detected",
                    event_time=analysis.timestamp,
                    severity="medium",
                    confidence=90.0,
                    description="Distraction detected in the user workspace.",
                    created_at=now
                ))

        # 8. Smile detected
        if analysis.smile_detected:
            if not await is_debounced("Smile Detected"):
                await self.repo.create_event(TimelineEventDocument(
                    session_id=session_id,
                    event_type="Smile Detected",
                    event_time=analysis.timestamp,
                    severity="low",
                    confidence=analysis.smile_score,
                    description="A smile was detected.",
                    created_at=now
                ))

        # 9. Hand movement
        if analysis.hand_movement_score > 75:
            if not await is_debounced("Hand Movement"):
                await self.repo.create_event(TimelineEventDocument(
                    session_id=session_id,
                    event_type="Hand Movement",
                    event_time=analysis.timestamp,
                    severity="low",
                    confidence=analysis.hand_movement_score,
                    description="Frequent or excessive hand gestures detected.",
                    created_at=now
                ))
