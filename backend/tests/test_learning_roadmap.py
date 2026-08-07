import asyncio
import unittest
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from app.controllers.learning_roadmap_controller import LearningRoadmapController
from app.services.learning_roadmap_service import LearningRoadmapService
from app.models.learning_roadmap import RoadmapType, RoadmapStatus, TaskType, TaskPriority
from app.schemas.learning_roadmap import (
    LearningRoadmapCreate,
    LearningRoadmapUpdate,
    LearningTaskCreate,
    LearningTaskUpdate,
    ProjectRecommendationCreate,
    AssessmentCreate,
)

# --- Lightweight Async In-Memory MongoDB Mock ---
class MockCursor:
    def __init__(self, data, sort_key=None, sort_dir=-1):
        self.data = data
        if sort_key:
            self.data = sorted(
                self.data,
                key=lambda x: x.get(sort_key) if x.get(sort_key) is not None else 0,
                reverse=(sort_dir == -1)
            )

    def sort(self, key, direction=-1):
        return MockCursor(self.data, sort_key=key, sort_dir=direction)

    def skip(self, num):
        self.data = self.data[num:]
        return self

    def limit(self, num):
        self.data = self.data[:num]
        return self

    async def to_list(self, length=None):
        return self.data


class MockCollection:
    def __init__(self, name):
        self.name = name
        self.docs = []

    async def insert_one(self, doc):
        doc = dict(doc)
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.docs.append(doc)
        class Result:
            inserted_id = doc["_id"]
        return Result()

    async def insert_many(self, docs):
        inserted_ids = []
        for doc in docs:
            if "_id" not in doc:
                doc["_id"] = ObjectId()
            inserted_ids.append(doc["_id"])
            self.docs.append(doc)
        class Result:
            self.inserted_ids = inserted_ids
        return Result()

    async def find_one(self, query, sort=None):
        matches = self._find_matches(query)
        if not matches:
            return None
        if sort:
            sort_key, direction = sort[0]
            matches = sorted(matches, key=lambda x: x.get(sort_key, 0), reverse=(direction == -1))
        return dict(matches[0])

    async def find_one_and_update(self, query, updates, upsert=False, return_document=True):
        doc = await self.find_one(query)
        set_vals = updates.get("$set", {})
        if not doc:
            if upsert:
                doc = {"_id": ObjectId(), **query, **set_vals}
                self.docs.append(doc)
                return doc
            return None
        doc.update(set_vals)
        for d in self.docs:
            if d["_id"] == doc["_id"]:
                d.update(set_vals)
        return doc

    def find(self, query):
        matches = self._find_matches(query)
        return MockCursor(matches)

    async def count_documents(self, query):
        return len(self._find_matches(query))

    async def delete_one(self, query):
        doc = await self.find_one(query)
        if doc:
            self.docs = [d for d in self.docs if d["_id"] != doc["_id"]]
            class Result:
                deleted_count = 1
            return Result()
        class Result:
            deleted_count = 0
        return Result()

    async def delete_many(self, query):
        matches = self._find_matches(query)
        match_ids = {m["_id"] for m in matches}
        self.docs = [d for d in self.docs if d["_id"] not in match_ids]
        class Result:
            deleted_count = len(match_ids)
        return Result()

    async def update_one(self, query, updates):
        doc = await self.find_one(query)
        if doc:
            set_vals = updates.get("$set", {})
            doc.update(set_vals)
            for d in self.docs:
                if d["_id"] == doc["_id"]:
                    d.update(set_vals)

    async def create_index(self, *args, **kwargs):
        pass

    def _find_matches(self, query):
        matches = []
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if k == "$ne":
                    # custom check
                    pass
                elif k == "$or":
                    or_match = False
                    for cond in v:
                        cond_match = True
                        for ck, cv in cond.items():
                            if doc.get(ck) != cv:
                                cond_match = False
                        if cond_match:
                            or_match = True
                            break
                    if not or_match:
                        match = False
                elif isinstance(v, dict) and "$ne" in v:
                    if doc.get(k) == v["$ne"]:
                        match = False
                elif doc.get(k) != v:
                    match = False
            if match:
                matches.append(doc)
        return matches


class MockDatabase:
    def __init__(self):
        self.collections = {}

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]


class LearningRoadmapTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.mock_db = MockDatabase()
        
        self.user_id = str(ObjectId())
        self.mock_db["users"].docs.append({
            "_id": ObjectId(self.user_id),
            "email": "roadmap-test@copilot.dev",
            "is_active": True,
        })
        
        # Seed completed skill analysis
        self.analysis_id = str(ObjectId())
        self.mock_db["skill_analyses"].docs.append({
            "_id": ObjectId(self.analysis_id),
            "user_id": self.user_id,
            "target_role": "Fullstack Engineer",
        })

        # Seed mock weaknesses to link roadmap tasks
        self.mock_db["weak_skills"].docs.extend([
            {"analysis_id": self.analysis_id, "skill_name": "React"},
            {"analysis_id": self.analysis_id, "skill_name": "DSA"}
        ])

        self.ctrl = LearningRoadmapController(self.mock_db)

    async def test_roadmap_lifecycle_progress_and_restrictions(self):
        # 1. Create Roadmap
        create_payload = LearningRoadmapCreate(
            analysis_id=self.analysis_id,
            roadmap_type=RoadmapType.CRASH_7
        )
        roadmap = await self.ctrl.create_roadmap(self.user_id, create_payload)
        self.assertEqual(roadmap["roadmap_type"], RoadmapType.CRASH_7)
        self.assertEqual(roadmap["duration_days"], 7)
        self.assertEqual(roadmap["status"], RoadmapStatus.DRAFT)
        roadmap_id = roadmap["id"]

        # 2. Prevent duplicate active roadmap
        with self.assertRaises(HTTPException) as ctx:
            await self.ctrl.create_roadmap(self.user_id, create_payload)
        self.assertEqual(ctx.exception.status_code, 409)

        # 3. Retrieve Phases and Tasks
        phases = await self.ctrl.get_phases(roadmap_id, self.user_id)
        self.assertEqual(len(phases), 2)  # Crash 7 generates 2 phases
        phase_id = phases[0]["id"]

        tasks = await self.ctrl.get_tasks(phase_id, self.user_id)
        self.assertEqual(len(tasks), 2)  # 2 tasks per phase
        task_id = tasks[0]["id"]

        # 4. Progress Tracker Calculation on Task Completion
        task_update = LearningTaskUpdate(status="completed")
        await self.ctrl.update_task(task_id, self.user_id, task_update)

        # Retrieve progress
        progress = await self.ctrl.get_progress(roadmap_id, self.user_id)
        self.assertEqual(progress["completed_tasks"], 1)
        self.assertEqual(progress["completion_percentage"], 25.0) # 1 of 4 tasks is completed

        # Check overall progress updated on roadmap too
        roadmap_details = await self.ctrl.get_roadmap(roadmap_id, self.user_id)
        self.assertEqual(roadmap_details["overall_progress"], 25.0)

        # 5. Archive Roadmap blocks further updates
        update_archive = LearningRoadmapUpdate(status=RoadmapStatus.ARCHIVED)
        await self.ctrl.update_roadmap(roadmap_id, self.user_id, update_archive)

        # Verify task updates are blocked once archived
        task_update_2 = LearningTaskUpdate(status="in_progress")
        with self.assertRaises(HTTPException) as ctx:
            await self.ctrl.update_task(task_id, self.user_id, task_update_2)
        self.assertEqual(ctx.exception.status_code, 400)

        # 6. Add Project and Assessment recommendations
        project_payload = ProjectRecommendationCreate(
            project_name="Collaborative Dashboard",
            description="Real-time generic dashboard",
            skills_covered=["React", "Node.js"]
        )
        # Re-create active roadmap for adding recommended content
        active_analysis_id = str(ObjectId())
        self.mock_db["skill_analyses"].docs.append({
            "_id": ObjectId(active_analysis_id),
            "user_id": self.user_id,
            "target_role": "Backend Engineer",
        })
        active_payload = LearningRoadmapCreate(
            analysis_id=active_analysis_id,
            roadmap_type=RoadmapType.PLAN_30
        )
        active_roadmap = await self.ctrl.create_roadmap(self.user_id, active_payload)
        active_roadmap_id = active_roadmap["id"]

        project = await self.ctrl.create_project(active_roadmap_id, self.user_id, project_payload)
        self.assertEqual(project["project_name"], "Collaborative Dashboard")

        assessment_payload = AssessmentCreate(title="Algorithms Assessment", passing_score=80.0)
        assessment = await self.ctrl.create_assessment(active_roadmap_id, self.user_id, assessment_payload)
        self.assertEqual(assessment["passing_score"], 80.0)

        # List them
        projects = await self.ctrl.get_projects(active_roadmap_id, self.user_id)
        self.assertEqual(len(projects), 1)

        assessments = await self.ctrl.get_assessments(active_roadmap_id, self.user_id)
        self.assertEqual(len(assessments), 1)

        # 7. Recalculate Roadmap with a new Skill Gap Analysis
        new_analysis_id = str(ObjectId())
        self.mock_db["skill_analyses"].docs.append({
            "_id": ObjectId(new_analysis_id),
            "user_id": self.user_id,
            "target_role": "Backend Engineer",
        })
        self.mock_db["weak_skills"].docs.append({
            "analysis_id": new_analysis_id,
            "skill_name": "System Design"
        })

        recalculated = await self.ctrl.recalculate_roadmap(active_roadmap_id, self.user_id, new_analysis_id)
        self.assertEqual(recalculated["analysis_id"], new_analysis_id)

        # Verify that pending tasks have been updated with System Design topics
        phases_active = await self.ctrl.get_phases(active_roadmap_id, self.user_id)
        tasks_active = await self.ctrl.get_tasks(phases_active[0]["id"], self.user_id)
        self.assertIn("System Design", tasks_active[0]["title"])


if __name__ == "__main__":
    unittest.main()
