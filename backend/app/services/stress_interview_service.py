from datetime import datetime, timezone
from typing import Optional, List, Tuple
from uuid import uuid4
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.stress_interview_repository import StressInterviewRepository
from app.models.stress_interview import (
    StressSessionDocument,
    StressEventDocument,
    StressMetricsDocument,
    PressureLevel,
)
from app.schemas.stress_interview import (
    StressSessionStart,
    StressSessionConfigure,
    StressEventCreate,
)


class StressInterviewService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.repo = StressInterviewRepository(database)
        self.interview_sessions = database["interview_sessions"]

    async def _get_owned_session(self, session_id: str, user_id: str) -> dict:
        session = await self.repo.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stress session not found",
            )
        if session["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this session",
            )
        return session

    async def start_session(self, user_id: str, payload: StressSessionStart) -> dict:
        # Validate that the interview session exists and belongs to the user
        interview = await self.interview_sessions.find_one({
            "session_id": payload.interview_session_id,
            "user_id": user_id
        })
        if not interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Matching active interview session not found",
            )

        # Prevent duplicate active stress sessions
        existing = await self.repo.get_active_session_for_interview(payload.interview_session_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An active stress session already exists for this interview",
            )

        now = datetime.now(timezone.utc)
        
        # Configure preset switches based on pressure levels (as outlined in guidelines)
        rapid = payload.rapid_question_mode
        interrupt = payload.interrupt_mode
        counter = payload.counter_question_mode
        time_limit = payload.time_limit_seconds

        if payload.pressure_level == PressureLevel.LOW:
            rapid = True
        elif payload.pressure_level == PressureLevel.MEDIUM:
            rapid = True
            interrupt = True
        elif payload.pressure_level == PressureLevel.HIGH:
            rapid = True
            interrupt = True
            counter = True
            time_limit = min(time_limit, 20)
        elif payload.pressure_level == PressureLevel.EXTREME:
            rapid = True
            interrupt = True
            counter = True
            time_limit = min(time_limit, 10)

        doc = StressSessionDocument(
            session_id=str(uuid4()),
            user_id=user_id,
            interview_session_id=payload.interview_session_id,
            mode_enabled=True,
            pressure_level=payload.pressure_level,
            challenge_mode=payload.challenge_mode,
            rapid_question_mode=rapid,
            interrupt_mode=interrupt,
            counter_question_mode=counter,
            time_limit_seconds=time_limit,
            status="started",
            started_at=now,
            created_at=now,
            updated_at=now
        )
        return await self.repo.create_session(doc)

    async def stop_session(self, user_id: str, session_id: str) -> dict:
        session = await self._get_owned_session(session_id, user_id)
        if session["status"] == "stopped":
            return session

        now = datetime.now(timezone.utc)
        updates = {
            "status": "stopped",
            "ended_at": now,
            "updated_at": now
        }
        updated = await self.repo.update_session(session_id, updates)

        # Generate report immediately
        await self.generate_final_report_internal(session_id)
        return updated

    async def configure_session(self, user_id: str, payload: StressSessionConfigure) -> dict:
        session = await self._get_owned_session(payload.session_id, user_id)
        if session["status"] == "stopped":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot configure a stopped stress session",
            )

        updates = {}
        if payload.pressure_level is not None:
            updates["pressure_level"] = payload.pressure_level
            # Auto-align settings on manual override
            if payload.pressure_level == PressureLevel.LOW:
                updates["rapid_question_mode"] = True
            elif payload.pressure_level == PressureLevel.MEDIUM:
                updates["rapid_question_mode"] = True
                updates["interrupt_mode"] = True
            elif payload.pressure_level == PressureLevel.HIGH:
                updates["rapid_question_mode"] = True
                updates["interrupt_mode"] = True
                updates["counter_question_mode"] = True
                updates["time_limit_seconds"] = 20
            elif payload.pressure_level == PressureLevel.EXTREME:
                updates["rapid_question_mode"] = True
                updates["interrupt_mode"] = True
                updates["counter_question_mode"] = True
                updates["time_limit_seconds"] = 10

        if payload.challenge_mode is not None:
            updates["challenge_mode"] = payload.challenge_mode
        if payload.rapid_question_mode is not None:
            updates["rapid_question_mode"] = payload.rapid_question_mode
        if payload.interrupt_mode is not None:
            updates["interrupt_mode"] = payload.interrupt_mode
        if payload.counter_question_mode is not None:
            updates["counter_question_mode"] = payload.counter_question_mode
        if payload.time_limit_seconds is not None:
            updates["time_limit_seconds"] = payload.time_limit_seconds

        updates["updated_at"] = datetime.now(timezone.utc)
        return await self.repo.update_session(payload.session_id, updates)

    async def store_event(self, user_id: str, payload: StressEventCreate) -> dict:
        session = await self._get_owned_session(payload.session_id, user_id)
        if session["status"] == "stopped":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot log events for a stopped stress session",
            )

        now = datetime.now(timezone.utc)
        doc = StressEventDocument(
            session_id=payload.session_id,
            event_type=payload.event_type,
            event_time=payload.event_time,
            question_id=payload.question_id,
            candidate_response_time=payload.candidate_response_time,
            interrupt_triggered=payload.interrupt_triggered,
            followup_generated=payload.followup_generated,
            counter_question_generated=payload.counter_question_generated,
            difficulty_level=payload.difficulty_level,
            severity=payload.severity,
            notes=payload.notes,
            created_at=now
        )
        return await self.repo.create_event(doc)

    async def get_session(self, session_id: str, user_id: str) -> dict:
        return await self._get_owned_session(session_id, user_id)

    async def get_events(self, session_id: str, user_id: str) -> List[dict]:
        await self._get_owned_session(session_id, user_id)
        return await self.repo.get_events_for_session(session_id)

    async def get_report(self, session_id: str, user_id: str) -> dict:
        session = await self._get_owned_session(session_id, user_id)
        report = await self.repo.get_report(session_id)
        
        # Compile if not present
        if not report:
            report = await self.generate_final_report_internal(session_id)

        events = await self.repo.get_events_for_session(session_id)

        strengths = []
        weaknesses = []

        if report.get("calmness_score", 0.0) >= 80:
            strengths.append("Excellent composure and breathing pace under questioning")
        if report.get("average_response_time", 0.0) < 5.0 and report.get("average_response_time", 0.0) > 0:
            strengths.append("Prompt answers with minimal delays")
        if report.get("pressure_handling_score", 0.0) >= 75:
            strengths.append("Handled interruptions and counter arguments gracefully")

        if report.get("calmness_score", 0.0) < 70:
            weaknesses.append("Composure scores dipped when rapid questions were triggered")
        if report.get("hesitation_count", 0) > 2:
            weaknesses.append("Frequent verbal hesitations or stuttering under follow-ups")
        if report.get("long_pauses", 0) > 1:
            weaknesses.append("Long pauses detected before formulating technical explanations")

        return {
            "session_id": session_id,
            "total_interruptions": report.get("total_interruptions", 0),
            "rapid_questions": report.get("rapid_questions", 0),
            "counter_questions": report.get("counter_questions", 0),
            "average_response_time": report.get("average_response_time", 0.0),
            "long_pauses": report.get("long_pauses", 0),
            "hesitation_count": report.get("hesitation_count", 0),
            "recovery_time": report.get("recovery_time", 0.0),
            "calmness_score": report.get("calmness_score", 0.0),
            "stress_score": report.get("stress_score", 0.0),
            "pressure_handling_score": report.get("pressure_handling_score", 0.0),
            "confidence_under_pressure": report.get("confidence_under_pressure", 0.0),
            "overall_rating": report.get("overall_rating", "Good"),
            "recommendations": report.get("recommendations", []),
            "timeline_summary": events,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "created_at": report.get("created_at", datetime.now(timezone.utc))
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
                detail="Failed to delete stress session",
            )

    async def generate_final_report_internal(self, session_id: str) -> dict:
        events = await self.repo.get_events_for_session(session_id)
        now = datetime.now(timezone.utc)

        if not events:
            # Return empty baseline metrics
            baseline = StressMetricsDocument(
                session_id=session_id,
                total_interruptions=0,
                rapid_questions=0,
                counter_questions=0,
                average_response_time=0.0,
                long_pauses=0,
                hesitation_count=0,
                recovery_time=0.0,
                calmness_score=100.0,
                stress_score=0.0,
                pressure_handling_score=100.0,
                confidence_under_pressure=100.0,
                overall_rating="Excellent",
                recommendations=["No stress events were triggered. Excellent job!"],
                created_at=now
            )
            return await self.repo.create_report(baseline)

        # Count events
        total_interruptions = sum(1 for e in events if e["event_type"] == "Question Interrupted" or e.get("interrupt_triggered"))
        rapid_questions = sum(1 for e in events if e["event_type"] == "Rapid Follow-up" or e.get("followup_generated"))
        counter_questions = sum(1 for e in events if e["event_type"] == "Counter Question" or e.get("counter_question_generated"))
        long_pauses = sum(1 for e in events if e["event_type"] == "Long Pause")
        hesitation_count = sum(1 for e in events if e["event_type"] == "Candidate Hesitated")
        timeouts = sum(1 for e in events if e["event_type"] == "Response Timeout")

        # Response times
        response_times = [e["candidate_response_time"] for e in events if e.get("candidate_response_time") is not None]
        avg_resp = round(sum(response_times) / len(response_times), 2) if response_times else 0.0

        # Calmness score calculation
        calmness = 100.0 - (hesitation_count * 5.0 + long_pauses * 8.0 + timeouts * 15.0)
        calmness = round(max(0.0, min(100.0, calmness)), 2)

        # Stress score calculation
        stress_score = 100.0 - calmness + (avg_resp * 1.5 if avg_resp else 0)
        stress_score = round(max(0.0, min(100.0, stress_score)), 2)

        # Recovery time calculation
        recovery = round(avg_resp + (hesitation_count * 0.5) + (long_pauses * 1.2), 2)

        # Pressure Handling and Confidence
        pressure_handling = round(max(0.0, 100.0 - (timeouts * 15.0 + long_pauses * 8.0 + total_interruptions * 4.0)), 2)
        confidence = round(max(0.0, 100.0 - (long_pauses * 10.0 + timeouts * 15.0 + hesitation_count * 6.0)), 2)

        # Overall rating
        if stress_score < 30:
            rating = "Exceptional"
        elif stress_score < 50:
            rating = "Good"
        elif stress_score < 75:
            rating = "Moderate"
        else:
            rating = "Needs Practice"

        # AI Recommendations
        recommendations = []
        if calmness < 75:
            recommendations.append("Practice slow breathing techniques to reduce verbal pauses when follow-ups are rapid.")
        if avg_resp > 8.0:
            recommendations.append("Try stating your structuring path aloud to buy thinking time instead of complete silence.")
        if timeouts > 0:
            recommendations.append("Focus on delivering a summarized response first to avoid getting cut off by timers.")
        if counter_questions > 1:
            recommendations.append("Practice acknowledging counter-arguments using standard structures ('Yes, and...' or STAR method).")

        if not recommendations:
            recommendations.append("Great job managing stress! Maintain this presence across future coding sessions.")

        doc = StressMetricsDocument(
            session_id=session_id,
            total_interruptions=total_interruptions,
            rapid_questions=rapid_questions,
            counter_questions=counter_questions,
            average_response_time=avg_resp,
            long_pauses=long_pauses,
            hesitation_count=hesitation_count,
            recovery_time=recovery,
            calmness_score=calmness,
            stress_score=stress_score,
            pressure_handling_score=pressure_handling,
            confidence_under_pressure=confidence,
            overall_rating=rating,
            recommendations=recommendations,
            created_at=now
        )
        return await self.repo.create_report(doc)
