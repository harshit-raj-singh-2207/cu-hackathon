"""Business logic and persistence operations for interview types."""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.schemas.interview_type import InterviewTypeCreate, InterviewTypeUpdate


DEFAULT_INTERVIEW_TYPES = [
    ("HR Interview", "Assesses culture fit, motivation, and communication.", 30, "Easy", 10, 60),
    ("Technical Interview", "Assesses role-specific technical knowledge and problem solving.", 60, "Medium", 15, 60),
    ("Behavioral Interview", "Assesses past experience using behavioral questions.", 45, "Medium", 12, 60),
    ("Coding Interview", "Assesses programming, algorithms, and data structures.", 60, "Hard", 3, 60),
    ("System Design Interview", "Assesses scalable system design and technical trade-offs.", 60, "Hard", 5, 60),
    ("Aptitude Interview", "Assesses numerical, logical, and verbal reasoning.", 45, "Medium", 25, 60),
    ("Group Discussion", "Assesses collaboration, communication, and critical thinking.", 30, "Medium", 8, 60),
    ("Managerial Interview", "Assesses leadership, decision-making, and stakeholder management.", 45, "Medium", 10, 60),
    ("Stress Interview", "Assesses composure and communication under pressure.", 30, "Hard", 10, 60),
    ("Resume-Based Interview", "Assesses the candidate's resume, projects, and experience.", 45, "Medium", 12, 60),
    ("Job Description-Based Interview", "Assesses fit against the role's stated requirements.", 45, "Medium", 12, 60),
    ("Mock Interview", "Provides a general practice interview experience.", 60, "Medium", 15, 60),
]


def normalize_name(name: str) -> str:
    return " ".join(name.lower().split())


def serialize_interview_type(document: dict) -> dict:
    value = dict(document)
    value["id"] = str(value.pop("_id"))
    value.pop("name_normalized", None)
    return value


class InterviewTypeService:
    def __init__(self, database):
        self.collection = database["interview_types"]

    async def list(self, skip: int = 0, limit: int = 100):
        cursor = self.collection.find({}).sort("display_order", 1).skip(skip).limit(limit)
        items = [serialize_interview_type(item) for item in await cursor.to_list(length=limit)]
        return items, await self.collection.count_documents({})

    async def get(self, interview_type_id: str):
        if not ObjectId.is_valid(interview_type_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview type not found")
        document = await self.collection.find_one({"_id": ObjectId(interview_type_id)})
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview type not found")
        return serialize_interview_type(document)

    async def create(self, payload: InterviewTypeCreate):
        now = datetime.now(timezone.utc)
        document = payload.model_dump()
        document.update({
            "name_normalized": normalize_name(payload.name),
            "created_at": now,
            "updated_at": now,
        })
        try:
            result = await self.collection.insert_one(document)
        except DuplicateKeyError:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An interview type with this name already exists")
        document["_id"] = result.inserted_id
        return serialize_interview_type(document)

    async def update(self, interview_type_id: str, payload: InterviewTypeUpdate):
        await self.get(interview_type_id)
        changes = payload.model_dump(exclude_unset=True)
        if not changes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least one field to update")
        if "name" in changes:
            changes["name_normalized"] = normalize_name(changes["name"])
        changes["updated_at"] = datetime.now(timezone.utc)
        try:
            await self.collection.update_one({"_id": ObjectId(interview_type_id)}, {"$set": changes})
        except DuplicateKeyError:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An interview type with this name already exists")
        return await self.get(interview_type_id)

    async def delete(self, interview_type_id: str):
        await self.get(interview_type_id)
        await self.collection.delete_one({"_id": ObjectId(interview_type_id)})


async def seed_default_interview_types(database):
    service = InterviewTypeService(database)
    for display_order, (name, description, duration_minutes, difficulty_level, total_questions, passing_score) in enumerate(DEFAULT_INTERVIEW_TYPES, start=1):
        if not await service.collection.find_one({"name_normalized": normalize_name(name)}):
            await service.create(InterviewTypeCreate(
                name=name,
                description=description,
                duration_minutes=duration_minutes,
                difficulty_level=difficulty_level,
                total_questions=total_questions,
                passing_score=passing_score,
                display_order=display_order,
            ))
