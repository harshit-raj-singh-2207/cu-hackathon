import asyncio
import unittest
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from app.controllers.skill_analysis_controller import SkillAnalysisController
from app.services.skill_analysis_service import SkillAnalysisService
from app.models.skill_analysis import SkillLevel, SeverityLevel
from app.schemas.skill_analysis import (
    SkillAnalysisCreate,
    SkillScoreInput,
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

    async def create_index(self, *args, **kwargs):
        pass

    def _find_matches(self, query):
        matches = []
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if k == "$or":
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


# We need UUID generation for temporary ID linkage in service
import uuid
# We inject uuid4 mock to make it predictable or let service use real uuid
from uuid import uuid4


class SkillAnalysisTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.mock_db = MockDatabase()
        
        self.user_id = str(ObjectId())
        self.mock_db["users"].docs.append({
            "_id": ObjectId(self.user_id),
            "email": "skills-test@copilot.dev",
            "is_active": True,
        })
        
        self.mock_db["interview_sessions"].docs.append({
            "session_id": "session-skill-101",
            "user_id": self.user_id,
            "interview_status": "Completed",
            "interview_name": "Fullstack Developer",
        })

        self.ctrl = SkillAnalysisController(self.mock_db)

    async def test_create_and_retrieve_skill_analysis(self):
        # 1. Create analysis with custom scores
        scores_input = [
            SkillScoreInput(skill_name="React", category="Technical", obtained_score=9.0, maximum_score=10.0, weight=1.0, confidence=95.0, remarks="Superb virtual DOM knowledge"),
            SkillScoreInput(skill_name="TypeScript", category="Technical", obtained_score=5.0, maximum_score=10.0, weight=1.0, confidence=80.0, remarks="Needs type safety practice"),
            SkillScoreInput(skill_name="DSA", category="Coding", obtained_score=4.0, maximum_score=10.0, weight=1.5, confidence=70.0, remarks="Struggled with tree traversal")
        ]

        payload = SkillAnalysisCreate(
            interview_session_id="session-skill-101",
            custom_scores=scores_input
        )

        analysis = await self.ctrl.create_analysis(self.user_id, payload)
        self.assertIsNotNone(analysis["id"])
        self.assertEqual(analysis["overall_grade"], "C") # weighted: (90*1 + 50*1 + 40*1.5)/3.5 = 200/3.5 = 57.14 (Grade C)
        self.assertAlmostEqual(analysis["overall_score"], 57.14, places=1)
        analysis_id = analysis["id"]

        # 2. Prevent duplicate creation
        with self.assertRaises(HTTPException) as ctx:
            await self.ctrl.create_analysis(self.user_id, payload)
        self.assertEqual(ctx.exception.status_code, 409)

        # 3. Retrieve Scores, Strengths, Weaknesses, Recommendations, and Readiness
        scores = await self.ctrl.get_scores(analysis_id, self.user_id)
        self.assertEqual(len(scores), 3)
        react_score = next(s for s in scores if s["skill_name"] == "React")
        ts_score = next(s for s in scores if s["skill_name"] == "TypeScript")
        dsa_score = next(s for s in scores if s["skill_name"] == "DSA")
        self.assertEqual(react_score["level"], SkillLevel.EXPERT) # React: 90%
        self.assertEqual(ts_score["level"], SkillLevel.INTERMEDIATE) # TS: 50%
        self.assertEqual(dsa_score["level"], SkillLevel.BEGINNER) # DSA: 40%

        strengths = await self.ctrl.get_strengths(analysis_id, self.user_id)
        self.assertEqual(len(strengths), 1)
        self.assertEqual(strengths[0]["skill_name"], "React")

        weaknesses = await self.ctrl.get_weaknesses(analysis_id, self.user_id)
        self.assertEqual(len(weaknesses), 2)
        # TS (50%) and DSA (40%) are weak skills (score < 70)
        self.assertEqual(weaknesses[0]["skill_name"], "TypeScript")
        self.assertEqual(weaknesses[1]["skill_name"], "DSA")

        # Every weak skill must generate at least one recommendation
        recommendations = await self.ctrl.get_recommendations(analysis_id, self.user_id)
        self.assertEqual(len(recommendations), 2)
        self.assertEqual(recommendations[0]["skill_name"], "TypeScript")
        self.assertEqual(recommendations[1]["skill_name"], "DSA")

        readiness = await self.ctrl.get_readiness(analysis_id, self.user_id)
        self.assertEqual(readiness["target_role"], "Fullstack Developer")
        self.assertIsNotNone(readiness["readiness_percentage"])

        # 4. Check ownership validation (using random user_id)
        with self.assertRaises(HTTPException) as ctx:
            await self.ctrl.get_analysis(analysis_id, "another-user")
        self.assertEqual(ctx.exception.status_code, 403)

        # 5. List analyses
        items, total = await self.ctrl.list_analyses(self.user_id)
        self.assertEqual(total, 1)
        self.assertEqual(items[0]["id"], analysis_id)

        # 6. Delete analysis
        await self.ctrl.delete_analysis(analysis_id, self.user_id)
        # Verify it cascade deleted everything
        self.assertEqual(len(self.mock_db["skill_analyses"].docs), 0)
        self.assertEqual(len(self.mock_db["skill_scores"].docs), 0)
        self.assertEqual(len(self.mock_db["weak_skills"].docs), 0)
        self.assertEqual(len(self.mock_db["strength_skills"].docs), 0)
        self.assertEqual(len(self.mock_db["learning_recommendations"].docs), 0)
        self.assertEqual(len(self.mock_db["career_readiness"].docs), 0)


if __name__ == "__main__":
    unittest.main()
