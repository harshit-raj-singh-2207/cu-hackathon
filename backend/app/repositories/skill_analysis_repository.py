from datetime import datetime, timezone
from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.skill_analysis import (
    SkillAnalysisDocument,
    SkillScoreDocument,
    WeakSkillDocument,
    StrengthSkillDocument,
    LearningRecommendationDocument,
    CareerReadinessDocument,
)


class SkillAnalysisRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.analyses = database["skill_analyses"]
        self.scores = database["skill_scores"]
        self.weaknesses = database["weak_skills"]
        self.strengths = database["strength_skills"]
        self.recommendations = database["learning_recommendations"]
        self.readiness = database["career_readiness"]

    @staticmethod
    def _serialize(document: dict) -> dict:
        if not document:
            return document
        doc = dict(document)
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    # --- Core Analysis ---
    async def create_analysis(self, doc: SkillAnalysisDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.analyses.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_analysis(self, analysis_id: str) -> Optional[dict]:
        doc = await self.analyses.find_one({"_id": self._object_id(analysis_id)})
        return self._serialize(doc) if doc else None

    async def get_analysis_by_session(self, interview_session_id: str) -> Optional[dict]:
        doc = await self.analyses.find_one({"interview_session_id": interview_session_id})
        return self._serialize(doc) if doc else None

    async def list_analyses_for_user(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        query = {"user_id": user_id}
        cursor = (
            self.analyses.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * limit)
            .limit(limit)
        )
        total = await self.analyses.count_documents(query)
        items = [self._serialize(doc) for doc in await cursor.to_list(length=limit)]
        return items, total

    async def delete_analysis(self, analysis_id: str) -> bool:
        # Cascade delete related collections
        await self.scores.delete_many({"analysis_id": analysis_id})
        await self.weaknesses.delete_many({"analysis_id": analysis_id})
        await self.strengths.delete_many({"analysis_id": analysis_id})
        await self.recommendations.delete_many({"analysis_id": analysis_id})
        await self.readiness.delete_many({"analysis_id": analysis_id})
        result = await self.analyses.delete_one({"_id": self._object_id(analysis_id)})
        return result.deleted_count > 0

    # --- Skill Scores ---
    async def create_score(self, doc: SkillScoreDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.scores.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_scores_for_analysis(self, analysis_id: str) -> List[dict]:
        cursor = self.scores.find({"analysis_id": analysis_id}).sort("skill_name", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    # --- Weak Skills ---
    async def create_weak_skill(self, doc: WeakSkillDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.weaknesses.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_weaknesses_for_analysis(self, analysis_id: str) -> List[dict]:
        cursor = self.weaknesses.find({"analysis_id": analysis_id}).sort("priority", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    # --- Strength Skills ---
    async def create_strength_skill(self, doc: StrengthSkillDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.strengths.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_strengths_for_analysis(self, analysis_id: str) -> List[dict]:
        cursor = self.strengths.find({"analysis_id": analysis_id}).sort("percentage", -1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    # --- Learning Recommendations ---
    async def create_recommendation(self, doc: LearningRecommendationDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.recommendations.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_recommendations_for_analysis(self, analysis_id: str) -> List[dict]:
        cursor = self.recommendations.find({"analysis_id": analysis_id}).sort("priority", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    # --- Career Readiness ---
    async def create_readiness(self, doc: CareerReadinessDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.readiness.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_readiness_for_analysis(self, analysis_id: str) -> Optional[dict]:
        doc = await self.readiness.find_one({"analysis_id": analysis_id})
        return self._serialize(doc) if doc else None

    # --- Helper ---
    def _object_id(self, val: str):
        from bson import ObjectId
        if ObjectId.is_valid(val):
            return ObjectId(val)
        return val
