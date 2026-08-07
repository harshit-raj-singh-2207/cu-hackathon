import unittest
from datetime import datetime, timezone
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user
from app.api.v1.job_roles import get_job_role_service

BASE_ROLE = {"role_name": "Platform Engineer", "role_category": "Engineering", "required_skills": ["Python", "Linux"], "preferred_skills": ["Terraform"], "programming_languages": ["Python"], "frameworks": ["FastAPI"], "databases": ["PostgreSQL"], "interview_topics": ["API Design", "Observability"], "experience_level": "Mid", "expected_duration": "60 minutes", "is_active": True}

class FakeJobRoleService:
    def __init__(self): self.items = {}; self.sequence = 0
    async def list(self, *, page, page_size, search=None, category=None, experience_level=None, sort_by="role_name", sort_order="asc"):
        values = list(self.items.values())
        if search: values = [item for item in values if search.lower() in item["role_name"].lower()]
        if category: values = [item for item in values if item["role_category"] == category]
        if experience_level: values = [item for item in values if item["experience_level"] == experience_level]
        values.sort(key=lambda item: item[sort_by], reverse=sort_order == "desc")
        return values[(page - 1) * page_size:page * page_size], len(values)
    async def get(self, role_id):
        if role_id not in self.items: raise HTTPException(status_code=404, detail="Job role not found")
        return self.items[role_id]
    async def create(self, payload):
        if any(item["role_name"].lower() == payload.role_name.lower() for item in self.items.values()): raise HTTPException(status_code=409, detail="A job role with this name already exists")
        self.sequence += 1; role_id = f"role-{self.sequence}"; now = datetime.now(timezone.utc)
        self.items[role_id] = {"role_id": role_id, **payload.model_dump(), "created_at": now, "updated_at": now}
        return self.items[role_id]
    async def update(self, role_id, payload):
        item = await self.get(role_id); changes = payload.model_dump(exclude_unset=True)
        if not changes: raise HTTPException(status_code=400, detail="Provide at least one field to update")
        if "role_name" in changes and any(key != role_id and value["role_name"].lower() == changes["role_name"].lower() for key, value in self.items.items()): raise HTTPException(status_code=409, detail="A job role with this name already exists")
        item.update(changes); item["updated_at"] = datetime.now(timezone.utc); return item
    async def delete(self, role_id): await self.get(role_id); del self.items[role_id]

class JobRoleApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.dependency_overrides[get_job_role_service] = lambda: cls.service
        app.dependency_overrides[get_current_user] = lambda: {"id": "test-user", "email": "test@example.com"}
        cls.client = TestClient(app)
    @classmethod
    def tearDownClass(cls): app.dependency_overrides.clear()
    def setUp(self): self.__class__.service = FakeJobRoleService()
    def create(self, **changes):
        payload = {**BASE_ROLE, **changes}; response = self.client.post("/api/v1/roles/", json=payload); self.assertEqual(response.status_code, 201); return response.json()
    def test_create_get_update_delete(self):
        created = self.create(); role_id = created["role_id"]
        self.assertEqual(self.client.get(f"/api/v1/roles/{role_id}").json()["role_name"], "Platform Engineer")
        updated = self.client.put(f"/api/v1/roles/{role_id}", json={"experience_level": "Senior", "is_active": False})
        self.assertEqual(updated.status_code, 200); self.assertEqual(updated.json()["experience_level"], "Senior"); self.assertFalse(updated.json()["is_active"])
        self.assertEqual(self.client.delete(f"/api/v1/roles/{role_id}").status_code, 204)
    def test_duplicate_and_404_validation(self):
        self.create(); duplicate = self.client.post("/api/v1/roles/", json={**BASE_ROLE, "role_name": "platform engineer"})
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(self.client.get("/api/v1/roles/missing").status_code, 404)
        self.assertEqual(self.client.put("/api/v1/roles/missing", json={"is_active": False}).status_code, 404)
        self.assertEqual(self.client.delete("/api/v1/roles/missing").status_code, 404)
        invalid = self.client.post("/api/v1/roles/", json={**BASE_ROLE, "experience_level": "Expert"})
        self.assertEqual(invalid.status_code, 422)
    def test_pagination_search_filter_and_sorting(self):
        self.create(role_name="Frontend Developer", experience_level="Junior")
        self.create(role_name="Data Analyst", role_category="Data", experience_level="Fresher")
        self.create(role_name="Backend Developer", experience_level="Junior")
        page = self.client.get("/api/v1/roles/?page=1&page_size=1").json(); self.assertEqual((page["total"], len(page["items"])), (3, 1))
        self.assertEqual(self.client.get("/api/v1/roles/?search=front").json()["total"], 1)
        self.assertEqual(self.client.get("/api/v1/roles/?category=Engineering").json()["total"], 2)
        self.assertEqual(self.client.get("/api/v1/roles/?experience_level=Junior").json()["total"], 2)
        sorted_items = self.client.get("/api/v1/roles/?sort_by=role_name&sort_order=desc").json()["items"]
        self.assertEqual(sorted_items[0]["role_name"], "Frontend Developer")
    def test_swagger_openapi(self):
        spec = self.client.get("/api/v1/openapi.json"); self.assertEqual(spec.status_code, 200)
        self.assertIn("/api/v1/roles/", spec.json()["paths"])
        self.assertEqual(self.client.get("/api/v1/docs").status_code, 200)

if __name__ == "__main__": unittest.main()