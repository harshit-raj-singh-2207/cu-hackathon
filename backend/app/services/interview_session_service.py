"""Business logic and persistence operations for interview sessions."""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from bson import ObjectId
from fastapi import HTTPException, status

from app.models.interview_session import InterviewSessionDocument, InterviewSessionStatus
from app.schemas.interview_session import InterviewSessionCreate, InterviewSessionUpdate


class InterviewSessionService:
    """Manage interview-session CRUD and its permitted state transitions."""

    ACTIVE_STATUSES = {InterviewSessionStatus.IN_PROGRESS.value}
    COMPLETABLE_STATUSES = {InterviewSessionStatus.IN_PROGRESS.value, InterviewSessionStatus.PAUSED.value}

    def __init__(self, database):
        self.database = database
        self.collection = database["interview_sessions"]

    @staticmethod
    def _object_id(value: str) -> Optional[ObjectId]:
        return ObjectId(value) if ObjectId.is_valid(value) else None

    @staticmethod
    def _serialize(document: dict) -> dict:
        value = dict(document)
        value.pop("_id", None)
        return value

    @staticmethod
    def _percentage(answered_questions: int, total_questions: int) -> float:
        return round((answered_questions / total_questions) * 100, 2)

    async def _owned(self, session_id: str, user_id: str) -> dict:
        session = await self.collection.find_one({"session_id": session_id, "user_id": user_id})
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")
        return session

    async def _ensure_references(
        self,
        *,
        user_id: str,
        company_id: str,
        job_role_id: str,
        interview_type_id: str,
        resume_id: Optional[str],
        job_description_id: Optional[str],
    ) -> None:
        company_object_id = self._object_id(company_id)
        if company_object_id is None or not await self.database["companies"].find_one({"_id": company_object_id}):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

        if not await self.database["job_roles"].find_one({"role_id": job_role_id}):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job role not found")

        interview_type_object_id = self._object_id(interview_type_id)
        if interview_type_object_id is None or not await self.database["interview_types"].find_one({"_id": interview_type_object_id}):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview type not found")

        if resume_id:
            resume_object_id = self._object_id(resume_id)
            if resume_object_id is None or not await self.database["resumes"].find_one({"_id": resume_object_id, "user_id": user_id}):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

        if job_description_id:
            description_object_id = self._object_id(job_description_id)
            if description_object_id is None or not await self.database["job_descriptions"].find_one({"_id": description_object_id, "user_id": user_id}):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found")

    async def _save(self, session: dict) -> dict:
        await self.collection.replace_one({"_id": session["_id"]}, session)
        return self._serialize(session)

    @staticmethod
    def _require_active(session: dict) -> None:
        if session["interview_status"] not in InterviewSessionService.ACTIVE_STATUSES:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This action is allowed only while the interview is in progress")

    async def create(self, user_id: str, payload: InterviewSessionCreate) -> dict:
        data = payload.model_dump()
        await self._ensure_references(user_id=user_id, **{key: data[key] for key in ("company_id", "job_role_id", "interview_type_id", "resume_id", "job_description_id")})
        if data["remaining_time"] is not None and data["remaining_time"] > data["duration_minutes"]:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Remaining time cannot exceed duration_minutes")

        now = datetime.now(timezone.utc)
        document = InterviewSessionDocument(
            session_id=str(uuid4()),
            user_id=user_id,
            **data,
            remaining_time=data["remaining_time"] if data["remaining_time"] is not None else data["duration_minutes"],
            percentage=0,
            created_at=now,
            updated_at=now,
        ).model_dump(exclude={"id"})
        await self.collection.insert_one(document)
        return self._serialize(document)

    async def get(self, session_id: str, user_id: str) -> dict:
        return self._serialize(await self._owned(session_id, user_id))

    async def list(
        self,
        user_id: str,
        *,
        page: int,
        page_size: int,
        search: Optional[str] = None,
        interview_status: Optional[InterviewSessionStatus] = None,
        company_id: Optional[str] = None,
        interview_type_id: Optional[str] = None,
    ) -> tuple[list[dict], int]:
        query: dict = {"user_id": user_id}
        if search:
            query["interview_name"] = {"$regex": search, "$options": "i"}
        if interview_status:
            query["interview_status"] = interview_status.value
        if company_id:
            query["company_id"] = company_id
        if interview_type_id:
            query["interview_type_id"] = interview_type_id
        cursor = self.collection.find(query).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
        return [self._serialize(item) for item in await cursor.to_list(length=page_size)], await self.collection.count_documents(query)

    async def update(self, session_id: str, user_id: str, payload: InterviewSessionUpdate) -> dict:
        session = await self._owned(session_id, user_id)
        if session["interview_status"] != InterviewSessionStatus.SCHEDULED.value:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only a scheduled interview session can be updated")
        changes = payload.model_dump(exclude_unset=True)
        if not changes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least one field to update")
        merged = {**session, **changes}
        if merged["remaining_time"] > merged["duration_minutes"]:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Remaining time cannot exceed duration_minutes")
        await self._ensure_references(
            user_id=user_id,
            company_id=merged["company_id"],
            job_role_id=merged["job_role_id"],
            interview_type_id=merged["interview_type_id"],
            resume_id=merged.get("resume_id"),
            job_description_id=merged.get("job_description_id"),
        )
        session.update({**changes, "updated_at": datetime.now(timezone.utc)})
        return await self._save(session)

    async def delete(self, session_id: str, user_id: str) -> None:
        session = await self._owned(session_id, user_id)
        await self.collection.delete_one({"_id": session["_id"]})

    async def start(self, session_id: str, user_id: str) -> dict:
        session = await self._owned(session_id, user_id)
        if session["interview_status"] != InterviewSessionStatus.SCHEDULED.value:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only a scheduled interview session can be started")
        now = datetime.now(timezone.utc)
        session.update({"interview_status": InterviewSessionStatus.IN_PROGRESS.value, "started_at": now, "updated_at": now})
        return await self._save(session)

    async def pause(self, session_id: str, user_id: str) -> dict:
        session = await self._owned(session_id, user_id)
        self._require_active(session)
        session.update({"interview_status": InterviewSessionStatus.PAUSED.value, "updated_at": datetime.now(timezone.utc)})
        return await self._save(session)

    async def resume(self, session_id: str, user_id: str) -> dict:
        session = await self._owned(session_id, user_id)
        if session["interview_status"] == InterviewSessionStatus.CANCELLED.value:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A cancelled interview session cannot be resumed")
        if session["interview_status"] != InterviewSessionStatus.PAUSED.value:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only a paused interview session can be resumed")
        session.update({"interview_status": InterviewSessionStatus.IN_PROGRESS.value, "updated_at": datetime.now(timezone.utc)})
        return await self._save(session)

    async def complete(self, session_id: str, user_id: str) -> dict:
        session = await self._owned(session_id, user_id)
        if session["interview_status"] == InterviewSessionStatus.COMPLETED.value:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Interview session is already completed")
        if session["interview_status"] not in self.COMPLETABLE_STATUSES:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only an in-progress or paused interview session can be completed")
        now = datetime.now(timezone.utc)
        session.update({"interview_status": InterviewSessionStatus.COMPLETED.value, "completed_at": now, "updated_at": now})
        return await self._save(session)

    async def cancel(self, session_id: str, user_id: str) -> dict:
        session = await self._owned(session_id, user_id)
        if session["interview_status"] in {InterviewSessionStatus.COMPLETED.value, InterviewSessionStatus.CANCELLED.value}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A completed or cancelled interview session cannot be cancelled")
        session.update({"interview_status": InterviewSessionStatus.CANCELLED.value, "updated_at": datetime.now(timezone.utc)})
        return await self._save(session)

    async def update_current_question(self, session_id: str, user_id: str, current_question_index: int) -> dict:
        session = await self._owned(session_id, user_id)
        self._require_active(session)
        if current_question_index > session["total_questions"]:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Current question index cannot exceed total_questions")
        session.update({"current_question_index": current_question_index, "updated_at": datetime.now(timezone.utc)})
        return await self._save(session)

    async def update_remaining_time(self, session_id: str, user_id: str, remaining_time: int) -> dict:
        session = await self._owned(session_id, user_id)
        self._require_active(session)
        if remaining_time > session["duration_minutes"]:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Remaining time cannot exceed duration_minutes")
        session.update({"remaining_time": remaining_time, "updated_at": datetime.now(timezone.utc)})
        return await self._save(session)

    async def increment_answered_questions(self, session_id: str, user_id: str, increment: int) -> dict:
        session = await self._owned(session_id, user_id)
        self._require_active(session)
        answered_questions = session["answered_questions"] + increment
        if answered_questions > session["total_questions"]:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Answered questions cannot exceed total_questions")
        session.update({
            "answered_questions": answered_questions,
            "percentage": self._percentage(answered_questions, session["total_questions"]),
            "updated_at": datetime.now(timezone.utc),
        })
        return await self._save(session)
