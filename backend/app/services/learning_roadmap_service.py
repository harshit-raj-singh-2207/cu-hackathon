from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from uuid import uuid4

from app.repositories.learning_roadmap_repository import LearningRoadmapRepository
from app.models.learning_roadmap import (
    LearningRoadmapDocument,
    RoadmapPhaseDocument,
    LearningTaskDocument,
    ProgressTrackerDocument,
    ProjectRecommendationDocument,
    AssessmentDocument,
    RoadmapType,
    RoadmapStatus,
    TaskType,
    TaskPriority,
)
from app.schemas.learning_roadmap import (
    LearningRoadmapCreate,
    LearningRoadmapUpdate,
    LearningTaskCreate,
    LearningTaskUpdate,
    ProjectRecommendationCreate,
    AssessmentCreate,
)


class LearningRoadmapService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.repo = LearningRoadmapRepository(database)
        self.analyses = database["skill_analyses"]
        self.weaknesses = database["weak_skills"]

    async def _get_owned_roadmap(self, roadmap_id: str, user_id: str) -> dict:
        roadmap = await self.repo.get_roadmap(roadmap_id)
        if not roadmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning roadmap not found",
            )
        if roadmap["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this roadmap",
            )
        return roadmap

    async def create_roadmap(self, user_id: str, payload: LearningRoadmapCreate) -> dict:
        analysis = None
        target_role = "Custom Goal Developer"
        if payload.analysis_id:
            # Validate that the Skill Gap Analysis exists and belongs to the user
            analysis = await self.analyses.find_one({
                "_id": self.repo._object_id(payload.analysis_id),
                "user_id": user_id
            })
            if not analysis:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Matching skill gap analysis not found",
                )
            
            # Prevent duplicate active roadmaps if analysis tied
            existing = await self.repo.get_roadmap_by_analysis(payload.analysis_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An active learning roadmap already exists for this skill analysis",
                )
            target_role = analysis.get("target_role", "Software Engineer")
        elif payload.goal_text:
            target_role = payload.goal_text[:50]


        # Map type to duration
        duration_map = {
            RoadmapType.CRASH_7: 7,
            RoadmapType.PLAN_14: 14,
            RoadmapType.PLAN_30: 30,
            RoadmapType.PLAN_60: 60,
            RoadmapType.PLAN_90: 90,
            RoadmapType.CUSTOM: 30,
        }
        duration_days = duration_map.get(payload.roadmap_type, 30)

        now = datetime.now(timezone.utc)
        start_date = payload.start_date or now
        expected_completion = start_date + timedelta(days=duration_days)
        # target_role already set above from analysis or goal_text

        roadmap_id = str(uuid4())
        roadmap_doc = LearningRoadmapDocument(
            user_id=user_id,
            analysis_id=payload.analysis_id,
            goal_text=payload.goal_text,
            target_role=target_role,
            roadmap_name=payload.goal_text[:30] if payload.goal_text else f"{payload.roadmap_type.value} - {target_role}",
            roadmap_type=payload.roadmap_type,
            duration_days=duration_days,
            overall_progress=0.0,
            status=RoadmapStatus.DRAFT,
            start_date=start_date,
            expected_completion=expected_completion,
            created_at=now,
            updated_at=now
        )

        # Persistence of main roadmap document
        data = roadmap_doc.model_dump(exclude={"id"})
        data["_id"] = self.repo._object_id(roadmap_id)
        await self.repo.roadmaps.insert_one(data)
        serialized_roadmap = self.repo._serialize(data)

        # Query weak skills to customize topics/tasks
        weak_skills = []
        if payload.analysis_id:
            weak_skills_cursor = self.weaknesses.find({"analysis_id": payload.analysis_id})
            weak_skills = [w["skill_name"] for w in await weak_skills_cursor.to_list(length=10)]

        # Generate default Phases and Tasks based on duration
        phase_count = 2 if duration_days <= 14 else 4
        tasks_per_phase = 2 if duration_days <= 14 else 3

        for i in range(1, phase_count + 1):
            phase_id = str(uuid4())
            phase_title = f"Phase {i}: Core Foundation" if i == 1 else (f"Phase {i}: Advanced Practice" if i == 2 else f"Phase {i}: Mastery & Projects")
            phase_doc = RoadmapPhaseDocument(
                roadmap_id=roadmap_id,
                phase_number=i,
                title=phase_title,
                description="Study fundamental concepts, coding challenges, and mock interview preparations.",
                estimated_days=max(1, duration_days // phase_count),
                progress=0.0,
                status="pending",
                order=i
            )
            # Save Phase
            phase_data = phase_doc.model_dump(exclude={"id"})
            phase_data["_id"] = self.repo._object_id(phase_id)
            await self.repo.phases.insert_one(phase_data)

            # Generate Tasks inside this phase
            for j in range(1, tasks_per_phase + 1):
                task_skill = weak_skills[(i + j) % len(weak_skills)] if weak_skills else "General Software Engineering"
                task_title = f"Study {task_skill} core patterns" if j == 1 else (f"Solve {task_skill} challenges" if j == 2 else f"Conduct {task_skill} Mock Interview")
                task_type = TaskType.STUDY if j == 1 else (TaskType.CODING if j == 2 else TaskType.MOCK_INTERVIEW)

                task_doc = LearningTaskDocument(
                    phase_id=phase_id,
                    title=task_title,
                    description=f"In-depth analysis and practice questions for {task_skill}.",
                    task_type=task_type,
                    priority=TaskPriority.HIGH if j == 1 else TaskPriority.MEDIUM,
                    estimated_time="3 hours",
                    difficulty="Intermediate",
                    status="pending",
                    order=j
                )
                await self.repo.create_task(task_doc)

        # Create Tracker
        tracker_doc = ProgressTrackerDocument(
            roadmap_id=roadmap_id,
            completed_tasks=0,
            pending_tasks=phase_count * tasks_per_phase,
            completion_percentage=0.0,
            study_hours=0.0,
            last_activity=None,
            current_streak=0
        )
        await self.repo.create_tracker(tracker_doc)

        return serialized_roadmap

    async def generate_and_save_roadmap(self, user_id: str, payload: LearningRoadmapCreate) -> dict:
        from app.services.ai import generate_learning_roadmap_from_goal
        
        goal_text = payload.goal_text or "Develop my career"
        
        # 1. Ask AI for json
        ai_steps = await generate_learning_roadmap_from_goal(goal_text)
        
        # 2. Setup Roadmap Document
        duration_days = 30
        now = datetime.now(timezone.utc)
        roadmap_id = str(uuid4())
        
        roadmap_doc = LearningRoadmapDocument(
            user_id=user_id,
            analysis_id=None,
            goal_text=goal_text,
            target_role=goal_text[:50],
            roadmap_name="AI Plan: " + goal_text[:30],
            roadmap_type=RoadmapType.CUSTOM,
            duration_days=duration_days,
            overall_progress=0.0,
            status=RoadmapStatus.ACTIVE,
            start_date=now,
            expected_completion=now + timedelta(days=duration_days),
            created_at=now,
            updated_at=now
        )
        
        # Insert Roadmap
        data = roadmap_doc.model_dump(exclude={"id"})
        data["_id"] = self.repo._object_id(roadmap_id)
        await self.repo.roadmaps.insert_one(data)
        serialized_roadmap = self.repo._serialize(data)
        
        total_tasks = 0
        
        # 3. Insert Phases and Tasks
        for step in ai_steps:
            phase_id = str(uuid4())
            phase_doc = RoadmapPhaseDocument(
                roadmap_id=roadmap_id,
                phase_number=step.get("stepNum", 1),
                title=step.get("title", f"Week {step.get('stepNum', 1)}"),
                description=step.get("subtitle", "Focus on specific skills"),
                estimated_days=7,
                progress=0.0,
                # Use AI step status directly (week 1 = "current", rest = "locked")
                status=step.get("status", "locked"),
                order=step.get("stepNum", 1)
            )
            # Insert Phase
            phase_data = phase_doc.model_dump(exclude={"id"})
            phase_data["_id"] = self.repo._object_id(phase_id)
            await self.repo.phases.insert_one(phase_data)
            
            # Map Checklist to Tasks
            checklist = step.get("checklist", [])
            for task_idx, item in enumerate(checklist):
                is_checked = item.get("checked", False)
                task_doc = LearningTaskDocument(
                    phase_id=phase_id,
                    title=item.get("text", "Task"),
                    description=f"Actionable assignment for week {step.get('stepNum', 1)}.",
                    task_type=TaskType.PRACTICE,
                    priority=TaskPriority.HIGH if task_idx == 0 else TaskPriority.MEDIUM,
                    estimated_time="4 hours",
                    difficulty="Intermediate",
                    status="completed" if is_checked else "pending",
                    completed_at=now if is_checked else None,
                    order=task_idx + 1
                )
                await self.repo.create_task(task_doc)
                total_tasks += 1
                
        # 4. Create Tracker
        tracker_doc = ProgressTrackerDocument(
            roadmap_id=roadmap_id,
            completed_tasks=0,
            pending_tasks=total_tasks,
            completion_percentage=0.0,
            study_hours=0.0,
            last_activity=None,
            current_streak=0
        )
        await self.repo.create_tracker(tracker_doc)
        
        return serialized_roadmap

    async def get_roadmap(self, roadmap_id: str, user_id: str) -> dict:
        return await self._get_owned_roadmap(roadmap_id, user_id)

    async def update_roadmap(self, roadmap_id: str, user_id: str, payload: LearningRoadmapUpdate) -> dict:
        roadmap = await self._get_owned_roadmap(roadmap_id, user_id)

        # Roadmap cannot be modified after archival
        if roadmap["status"] == RoadmapStatus.ARCHIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Archived learning roadmaps cannot be modified",
            )

        updates = payload.model_dump(exclude_unset=True)
        updates["updated_at"] = datetime.now(timezone.utc)

        if payload.status == RoadmapStatus.COMPLETED:
            updates["completed_at"] = datetime.now(timezone.utc)

        return await self.repo.update_roadmap(roadmap_id, updates)

    async def delete_roadmap(self, roadmap_id: str, user_id: str) -> None:
        await self._get_owned_roadmap(roadmap_id, user_id)
        success = await self.repo.delete_roadmap(roadmap_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete learning roadmap",
            )

    async def list_roadmaps(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        return await self.repo.list_roadmaps(user_id=user_id, page=page, limit=limit)

    async def get_phases(self, roadmap_id: str, user_id: str) -> List[dict]:
        await self._get_owned_roadmap(roadmap_id, user_id)
        return await self.repo.get_phases_for_roadmap(roadmap_id)

    # --- Tasks ---
    async def create_task(self, phase_id: str, user_id: str, payload: LearningTaskCreate) -> dict:
        phase = await self.repo.get_phase(phase_id)
        if not phase:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Roadmap phase not found",
            )

        roadmap = await self._get_owned_roadmap(phase["roadmap_id"], user_id)
        if roadmap["status"] == RoadmapStatus.ARCHIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add tasks to an archived roadmap",
            )

        existing_tasks = await self.repo.get_tasks_for_phase(phase_id)
        order = len(existing_tasks) + 1

        doc = LearningTaskDocument(
            phase_id=phase_id,
            title=payload.title,
            description=payload.description,
            task_type=payload.task_type,
            priority=payload.priority,
            estimated_time=payload.estimated_time,
            difficulty=payload.difficulty,
            status="pending",
            order=order
        )
        task = await self.repo.create_task(doc)
        await self._recalculate_progress(phase["roadmap_id"])
        return task

    async def get_tasks(self, phase_id: str, user_id: str) -> List[dict]:
        phase = await self.repo.get_phase(phase_id)
        if not phase:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Roadmap phase not found",
            )
        await self._get_owned_roadmap(phase["roadmap_id"], user_id)
        return await self.repo.get_tasks_for_phase(phase_id)

    async def update_task(self, task_id: str, user_id: str, payload: LearningTaskUpdate) -> dict:
        task = await self.repo.get_task(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning task not found",
            )

        phase = await self.repo.get_phase(task["phase_id"])
        roadmap = await self._get_owned_roadmap(phase["roadmap_id"], user_id)

        if roadmap["status"] == RoadmapStatus.ARCHIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify tasks in an archived roadmap",
            )

        updates = payload.model_dump(exclude_unset=True)
        if updates.get("status") == "completed":
            updates["completed_at"] = datetime.now(timezone.utc)
        elif updates.get("status") == "pending":
            updates["completed_at"] = None  # clear completion timestamp on revert

        updated = await self.repo.update_task(task_id, updates)
        await self._recalculate_progress(phase["roadmap_id"])
        return updated

    async def delete_task(self, task_id: str, user_id: str) -> None:
        task = await self.repo.get_task(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning task not found",
            )

        phase = await self.repo.get_phase(task["phase_id"])
        roadmap = await self._get_owned_roadmap(phase["roadmap_id"], user_id)

        if roadmap["status"] == RoadmapStatus.ARCHIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete tasks from an archived roadmap",
            )

        await self.repo.delete_task(task_id)
        await self._recalculate_progress(phase["roadmap_id"])

    # --- Project Recommendations ---
    async def get_projects(self, roadmap_id: str, user_id: str) -> List[dict]:
        await self._get_owned_roadmap(roadmap_id, user_id)
        return await self.repo.get_projects_for_roadmap(roadmap_id)

    async def create_project(self, roadmap_id: str, user_id: str, payload: ProjectRecommendationCreate) -> dict:
        await self._get_owned_roadmap(roadmap_id, user_id)
        doc = ProjectRecommendationDocument(
            roadmap_id=roadmap_id,
            project_name=payload.project_name,
            description=payload.description,
            difficulty=payload.difficulty,
            estimated_duration=payload.estimated_duration,
            skills_covered=payload.skills_covered,
            status="pending"
        )
        return await self.repo.create_project(doc)

    # --- Assessments ---
    async def get_assessments(self, roadmap_id: str, user_id: str) -> List[dict]:
        await self._get_owned_roadmap(roadmap_id, user_id)
        return await self.repo.get_assessments_for_roadmap(roadmap_id)

    async def create_assessment(self, roadmap_id: str, user_id: str, payload: AssessmentCreate) -> dict:
        await self._get_owned_roadmap(roadmap_id, user_id)
        doc = AssessmentDocument(
            roadmap_id=roadmap_id,
            title=payload.title,
            assessment_type=payload.assessment_type,
            passing_score=payload.passing_score,
            attempts=0,
            status="pending"
        )
        return await self.repo.create_assessment(doc)

    # --- Progress Tracker ---
    async def get_progress(self, roadmap_id: str, user_id: str) -> dict:
        await self._get_owned_roadmap(roadmap_id, user_id)
        tracker = await self.repo.get_tracker(roadmap_id)
        if not tracker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Progress tracker not found",
            )
        return tracker

    async def recalculate_roadmap(self, roadmap_id: str, user_id: str, new_analysis_id: str) -> dict:
        roadmap = await self._get_owned_roadmap(roadmap_id, user_id)
        if roadmap["status"] == RoadmapStatus.ARCHIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Archived roadmaps cannot be recalculated",
            )

        new_analysis = await self.analyses.find_one({
            "_id": self.repo._object_id(new_analysis_id),
            "user_id": user_id
        })
        if not new_analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="New skill analysis not found",
            )

        # Get the new weak skills
        weak_skills_cursor = self.weaknesses.find({"analysis_id": new_analysis_id})
        weak_skills = [w["skill_name"] for w in await weak_skills_cursor.to_list(length=10)]

        # Get all phases
        phases = await self.repo.get_phases_for_roadmap(roadmap_id)
        for i, phase in enumerate(phases):
            # Get pending tasks
            tasks = await self.repo.get_tasks_for_phase(phase["id"])
            pending_tasks = [t for t in tasks if t["status"] == "pending"]
            for j, task in enumerate(pending_tasks):
                task_skill = weak_skills[(i + j) % len(weak_skills)] if weak_skills else "General software engineering update"
                # Update task details to match new weak skill
                updates = {
                    "title": f"Study {task_skill} core patterns (Recalculated)",
                    "description": f"Recalculated learning plan for {task_skill} based on recent mock interview.",
                    "completed_at": None
                }
                await self.repo.update_task(task["id"], updates)

        # Update roadmap link to new analysis
        await self.repo.update_roadmap(roadmap_id, {
            "analysis_id": new_analysis_id,
            "updated_at": datetime.now(timezone.utc)
        })

        await self._recalculate_progress(roadmap_id)
        return await self.repo.get_roadmap(roadmap_id)

    # --- Internal Helpers ---
    async def _recalculate_progress(self, roadmap_id: str) -> None:
        phases = await self.repo.get_phases_for_roadmap(roadmap_id)
        
        total_completed_tasks = 0
        total_tasks_count = 0

        for phase in phases:
            phase_id = phase["id"]
            tasks = await self.repo.get_tasks_for_phase(phase_id)
            if not tasks:
                await self.repo.update_phase_progress(phase_id, 0.0, "pending")
                continue

            completed_tasks = sum(1 for t in tasks if t["status"] == "completed")
            total_completed_tasks += completed_tasks
            total_tasks_count += len(tasks)

            phase_progress = round((completed_tasks / len(tasks)) * 100.0, 2)
            phase_status = "completed" if phase_progress >= 100 else ("in_progress" if phase_progress > 0 else "pending")
            await self.repo.update_phase_progress(phase_id, phase_progress, phase_status)

        overall_progress = round((total_completed_tasks / total_tasks_count) * 100.0, 2) if total_tasks_count > 0 else 0.0
        
        # Update overall roadmap progress
        updates = {"overall_progress": overall_progress, "updated_at": datetime.now(timezone.utc)}
        if overall_progress >= 100:
            updates["status"] = RoadmapStatus.COMPLETED
            updates["completed_at"] = datetime.now(timezone.utc)
        
        await self.repo.update_roadmap(roadmap_id, updates)

        # Update Progress Tracker Document
        tracker = await self.repo.get_tracker(roadmap_id)
        current_streak = tracker.get("current_streak", 0) if tracker else 0
        
        # Simple streak helper incrementing on activities
        now = datetime.now(timezone.utc)
        if tracker and tracker.get("last_activity"):
            last = tracker["last_activity"]
            # If last activity was yesterday, streak + 1
            if now.date() - last.date() == timedelta(days=1):
                current_streak += 1
            elif now.date() - last.date() > timedelta(days=1):
                current_streak = 1
        else:
            current_streak = 1

        tracker_doc = ProgressTrackerDocument(
            roadmap_id=roadmap_id,
            completed_tasks=total_completed_tasks,
            pending_tasks=max(0, total_tasks_count - total_completed_tasks),
            completion_percentage=overall_progress,
            study_hours=round(total_completed_tasks * 2.5, 1), # mock estimation of 2.5 hours per task completed
            last_activity=now,
            current_streak=current_streak
        )
        await self.repo.create_tracker(tracker_doc)
