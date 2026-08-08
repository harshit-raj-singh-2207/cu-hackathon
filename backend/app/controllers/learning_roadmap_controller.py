from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.learning_roadmap_service import LearningRoadmapService
from app.schemas.learning_roadmap import (
    LearningRoadmapCreate,
    LearningRoadmapUpdate,
    LearningTaskCreate,
    LearningTaskUpdate,
    ProjectRecommendationCreate,
    AssessmentCreate,
)


class LearningRoadmapController:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.service = LearningRoadmapService(database)

    async def create_roadmap(self, user_id: str, payload: LearningRoadmapCreate) -> dict:
        return await self.service.create_roadmap(user_id, payload)

    async def generate_and_save_roadmap(self, user_id: str, goal: str) -> dict:
        # Wrap string goal into schema for service
        payload = LearningRoadmapCreate(goal_text=goal)
        return await self.service.generate_and_save_roadmap(user_id, payload)

    async def get_roadmap(self, roadmap_id: str, user_id: str) -> dict:
        return await self.service.get_roadmap(roadmap_id, user_id)

    async def update_roadmap(self, roadmap_id: str, user_id: str, payload: LearningRoadmapUpdate) -> dict:
        return await self.service.update_roadmap(roadmap_id, user_id, payload)

    async def delete_roadmap(self, roadmap_id: str, user_id: str) -> None:
        await self.service.delete_roadmap(roadmap_id, user_id)

    async def list_roadmaps(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.service.list_roadmaps(user_id=user_id, page=page, limit=limit)

    async def get_phases(self, roadmap_id: str, user_id: str) -> List[dict]:
        return await self.service.get_phases(roadmap_id, user_id)

    # --- Tasks ---
    async def create_task(self, phase_id: str, user_id: str, payload: LearningTaskCreate) -> dict:
        return await self.service.create_task(phase_id, user_id, payload)

    async def get_tasks(self, phase_id: str, user_id: str) -> List[dict]:
        return await self.service.get_tasks(phase_id, user_id)

    async def update_task(self, task_id: str, user_id: str, payload: LearningTaskUpdate) -> dict:
        return await self.service.update_task(task_id, user_id, payload)

    async def delete_task(self, task_id: str, user_id: str) -> None:
        await self.service.delete_task(task_id, user_id)

    # --- Projects ---
    async def get_projects(self, roadmap_id: str, user_id: str) -> List[dict]:
        return await self.service.get_projects(roadmap_id, user_id)

    async def create_project(self, roadmap_id: str, user_id: str, payload: ProjectRecommendationCreate) -> dict:
        return await self.service.create_project(roadmap_id, user_id, payload)

    # --- Assessments ---
    async def get_assessments(self, roadmap_id: str, user_id: str) -> List[dict]:
        return await self.service.get_assessments(roadmap_id, user_id)

    async def create_assessment(self, roadmap_id: str, user_id: str, payload: AssessmentCreate) -> dict:
        return await self.service.create_assessment(roadmap_id, user_id, payload)

    # --- Progress ---
    async def get_progress(self, roadmap_id: str, user_id: str) -> dict:
        return await self.service.get_progress(roadmap_id, user_id)

    # --- Recalculation ---
    async def recalculate_roadmap(self, roadmap_id: str, user_id: str, new_analysis_id: str) -> dict:
        return await self.service.recalculate_roadmap(roadmap_id, user_id, new_analysis_id)
