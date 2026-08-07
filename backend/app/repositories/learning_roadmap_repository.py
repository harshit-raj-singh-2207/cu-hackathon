from datetime import datetime, timezone
from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.learning_roadmap import (
    LearningRoadmapDocument,
    RoadmapPhaseDocument,
    LearningTaskDocument,
    LearningTopicDocument,
    ProjectRecommendationDocument,
    AssessmentDocument,
    ProgressTrackerDocument,
)


class LearningRoadmapRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.roadmaps = database["learning_roadmaps"]
        self.phases = database["roadmap_phases"]
        self.tasks = database["learning_tasks"]
        self.topics = database["learning_topics"]
        self.projects = database["project_recommendations"]
        self.assessments = database["assessments"]
        self.trackers = database["progress_trackers"]

    @staticmethod
    def _serialize(document: dict) -> dict:
        if not document:
            return document
        doc = dict(document)
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    # --- Roadmap ---
    async def create_roadmap(self, doc: LearningRoadmapDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.roadmaps.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_roadmap(self, roadmap_id: str) -> Optional[dict]:
        doc = await self.roadmaps.find_one({"_id": self._object_id(roadmap_id)})
        return self._serialize(doc) if doc else None

    async def get_roadmap_by_analysis(self, analysis_id: str) -> Optional[dict]:
        # Checks for active roadmaps to enforce duplicate validation
        doc = await self.roadmaps.find_one({"analysis_id": analysis_id, "status": {"$ne": "Archived"}})
        return self._serialize(doc) if doc else None

    async def list_roadmaps(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        query = {"user_id": user_id}
        cursor = (
            self.roadmaps.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * limit)
            .limit(limit)
        )
        total = await self.roadmaps.count_documents(query)
        items = [self._serialize(doc) for doc in await cursor.to_list(length=limit)]
        return items, total

    async def update_roadmap(self, roadmap_id: str, updates: dict) -> Optional[dict]:
        result = await self.roadmaps.find_one_and_update(
            {"_id": self._object_id(roadmap_id)},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_roadmap(self, roadmap_id: str) -> bool:
        # Cascade clean all phases, tasks, projects, assessments, trackers
        phases = await self.get_phases_for_roadmap(roadmap_id)
        for phase in phases:
            await self.tasks.delete_many({"phase_id": phase["id"]})
        
        await self.phases.delete_many({"roadmap_id": roadmap_id})
        await self.projects.delete_many({"roadmap_id": roadmap_id})
        await self.assessments.delete_many({"roadmap_id": roadmap_id})
        await self.trackers.delete_many({"roadmap_id": roadmap_id})

        result = await self.roadmaps.delete_one({"_id": self._object_id(roadmap_id)})
        return result.deleted_count > 0

    # --- Phases ---
    async def create_phase(self, doc: RoadmapPhaseDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.phases.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_phase(self, phase_id: str) -> Optional[dict]:
        doc = await self.phases.find_one({"_id": self._object_id(phase_id)})
        return self._serialize(doc) if doc else None

    async def get_phases_for_roadmap(self, roadmap_id: str) -> List[dict]:
        cursor = self.phases.find({"roadmap_id": roadmap_id}).sort("phase_number", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    async def update_phase_progress(self, phase_id: str, progress: float, status: str) -> None:
        await self.phases.update_one(
            {"_id": self._object_id(phase_id)},
            {"$set": {"progress": progress, "status": status}}
        )

    # --- Tasks ---
    async def create_task(self, doc: LearningTaskDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.tasks.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_task(self, task_id: str) -> Optional[dict]:
        doc = await self.tasks.find_one({"_id": self._object_id(task_id)})
        return self._serialize(doc) if doc else None

    async def get_tasks_for_phase(self, phase_id: str) -> List[dict]:
        cursor = self.tasks.find({"phase_id": phase_id}).sort("order", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    async def update_task(self, task_id: str, updates: dict) -> Optional[dict]:
        result = await self.tasks.find_one_and_update(
            {"_id": self._object_id(task_id)},
            {"$set": updates},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def delete_task(self, task_id: str) -> bool:
        result = await self.tasks.delete_one({"_id": self._object_id(task_id)})
        return result.deleted_count > 0

    # --- Project Recommendations ---
    async def create_project(self, doc: ProjectRecommendationDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.projects.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_projects_for_roadmap(self, roadmap_id: str) -> List[dict]:
        cursor = self.projects.find({"roadmap_id": roadmap_id}).sort("project_name", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    # --- Assessments ---
    async def create_assessment(self, doc: AssessmentDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.assessments.insert_one(data)
        data["_id"] = result.inserted_id
        return self._serialize(data)

    async def get_assessments_for_roadmap(self, roadmap_id: str) -> List[dict]:
        cursor = self.assessments.find({"roadmap_id": roadmap_id}).sort("title", 1)
        return [self._serialize(doc) for doc in await cursor.to_list(length=100)]

    # --- Tracker ---
    async def create_tracker(self, doc: ProgressTrackerDocument) -> dict:
        data = doc.model_dump(exclude={"id"})
        result = await self.trackers.find_one_and_update(
            {"roadmap_id": doc.roadmap_id},
            {"$set": data},
            upsert=True,
            return_document=True,
        )
        return self._serialize(result)

    async def get_tracker(self, roadmap_id: str) -> Optional[dict]:
        doc = await self.trackers.find_one({"roadmap_id": roadmap_id})
        return self._serialize(doc) if doc else None

    # --- Helper ---
    def _object_id(self, val: str):
        from bson import ObjectId
        if ObjectId.is_valid(val):
            return ObjectId(val)
        return val
