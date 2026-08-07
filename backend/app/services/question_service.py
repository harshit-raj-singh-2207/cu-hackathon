"""Persistence and query operations for the Question Bank."""

import math
import re
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException, status

from app.schemas.question import InterviewType, QuestionCreate, QuestionUpdate

VALID_INTERVIEW_TYPES = {"Behavioral", "Technical DSA", "System Design"}


def serialize_question(document: dict) -> dict:
    result = dict(document)
    result["id"] = str(result.pop("_id"))
    return result


class QuestionService:
    def __init__(self, database):
        self.collection = database["questions"]
        self.companies = database["companies"]
        self.job_roles = database["job_roles"]

    @staticmethod
    def _object_id(question_id: str) -> ObjectId:
        if not ObjectId.is_valid(question_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
        return ObjectId(question_id)

    async def _validate_relations(self, data: dict) -> None:
        if "company_id" in data:
            company_id = data["company_id"]
            if not ObjectId.is_valid(company_id) or not await self.companies.find_one({"_id": ObjectId(company_id)}):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
        if "job_role_id" in data and not await self.job_roles.find_one({"role_id": data["job_role_id"]}):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job role not found")
        if "interview_type_id" in data and data["interview_type_id"] not in VALID_INTERVIEW_TYPES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Interview type is not supported")

    async def get(self, question_id: str) -> dict:
        question = await self.collection.find_one({"_id": self._object_id(question_id)})
        if question is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
        return serialize_question(question)

    async def create(self, payload: QuestionCreate) -> dict:
        document = payload.model_dump()
        await self._validate_relations(document)
        now = datetime.now(timezone.utc)
        document.update({"created_at": now, "updated_at": now})
        result = await self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return serialize_question(document)

    async def update(self, question_id: str, payload: QuestionUpdate) -> dict:
        object_id = self._object_id(question_id)
        if not await self.collection.find_one({"_id": object_id}):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
        changes = payload.model_dump(exclude_unset=True)
        if not changes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least one field to update")
        await self._validate_relations(changes)
        changes["updated_at"] = datetime.now(timezone.utc)
        await self.collection.update_one({"_id": object_id}, {"$set": changes})
        return await self.get(question_id)

    async def delete(self, question_id: str) -> None:
        result = await self.collection.delete_one({"_id": self._object_id(question_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    async def list(self, *, page: int, limit: int, search: Optional[str] = None, company_id: Optional[str] = None, job_role_id: Optional[str] = None, interview_type_id: Optional[InterviewType] = None, difficulty: Optional[str] = None, topic: Optional[str] = None) -> tuple[list[dict], int, int]:
        query: dict = {}
        if search:
            expression = {"$regex": re.escape(search.strip()), "$options": "i"}
            query["$or"] = [{"question": expression}, {"topic": expression}, {"keywords": expression}]
        if company_id: query["company_id"] = company_id
        if job_role_id: query["job_role_id"] = job_role_id
        if interview_type_id: query["interview_type_id"] = interview_type_id
        if difficulty: query["difficulty"] = difficulty
        if topic: query["topic"] = {"$regex": f"^{re.escape(topic.strip())}$", "$options": "i"}
        total = await self.collection.count_documents(query)
        cursor = self.collection.find(query).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
        items = [serialize_question(item) for item in await cursor.to_list(length=limit)]
        return items, total, math.ceil(total / limit) if total else 0
