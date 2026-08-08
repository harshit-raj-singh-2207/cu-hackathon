from datetime import datetime, timezone
from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.communication_analysis import CommunicationAnalysisDocument


class CommunicationAnalysisRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collection = database["communication_analyses"]

    @staticmethod
    def _serialize(document: dict) -> dict:
        if not document:
            return document
        doc = dict(document)
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    async def create_analysis(self, doc: CommunicationAnalysisDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.collection.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_analysis(self, analysis_id: str) -> Optional[dict]:
        doc = await self.collection.find_one({"analysis_id": analysis_id})
        return self._serialize(doc) if doc else None

    async def get_latest_analysis(self, user_id: str) -> Optional[dict]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1).limit(1)
        items = await cursor.to_list(length=1)
        return self._serialize(items[0]) if items else None

    async def list_analyses(
        self,
        user_id: Optional[str] = None,
        interview_id: Optional[str] = None,
        session_id: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        query = {}
        if user_id:
            query["user_id"] = user_id
        if interview_id:
            query["interview_id"] = interview_id
        if session_id:
            query["session_id"] = session_id

        direction = -1 if sort_order == "desc" else 1
        cursor = (
            self.collection.find(query)
            .sort(sort_by, direction)
            .skip((page - 1) * limit)
            .limit(limit)
        )
        total = await self.collection.count_documents(query)
        items = [self._serialize(doc) for doc in await cursor.to_list(length=limit)]
        return items, total

    async def update_analysis(self, analysis_id: str, updates: dict) -> Optional[dict]:
        result = await self.collection.find_one_and_update(
            {"analysis_id": analysis_id},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_analysis(self, analysis_id: str) -> bool:
        result = await self.collection.delete_one({"analysis_id": analysis_id})
        return result.deleted_count > 0

    async def get_statistics(self, user_id: str) -> dict:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": None,
                    "average_speaking_speed": {"$avg": "$speaking_speed"},
                    "average_confidence": {"$avg": "$confidence_score"},
                    "average_grammar": {"$avg": "$grammar_score"},
                    "average_clarity": {"$avg": "$clarity_score"},
                    "average_overall_score": {"$avg": "$overall_score"},
                    "total_interviews": {"$sum": 1},
                }
            }
        ]
        cursor = self.collection.aggregate(pipeline)
        results = await cursor.to_list(length=1)
        if not results:
            return {
                "average_speaking_speed": 0.0,
                "average_confidence": 0.0,
                "average_grammar": 0.0,
                "average_clarity": 0.0,
                "average_overall_score": 0.0,
                "total_interviews": 0,
            }
        
        stats = results[0]
        # Clean up Mongo internal aggregation values
        stats.pop("_id", None)
        return {
            "average_speaking_speed": round(stats.get("average_speaking_speed", 0.0), 2),
            "average_confidence": round(stats.get("average_confidence", 0.0), 2),
            "average_grammar": round(stats.get("average_grammar", 0.0), 2),
            "average_clarity": round(stats.get("average_clarity", 0.0), 2),
            "average_overall_score": round(stats.get("average_overall_score", 0.0), 2),
            "total_interviews": stats.get("total_interviews", 0),
        }
