import unittest
from datetime import datetime, timezone
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user
from app.api.v1.companies import get_company_service

class FakeCompanyService:
    def __init__(self): self.items = {}; self.sequence = 0
    def _item(self, payload, company_id):
        now = datetime.now(timezone.utc)
        return {"id": company_id, **payload, "created_at": now, "updated_at": now}
    async def list(self, skip=0, limit=100):
        values = list(self.items.values())[skip:skip + limit]
        return values, len(self.items)
    async def get(self, company_id):
        if company_id not in self.items: raise HTTPException(status_code=404, detail="Company not found")
        return self.items[company_id]
    async def create(self, payload):
        if any(item["name"].lower() == payload.name.lower() for item in self.items.values()): raise HTTPException(status_code=409, detail="A company with this name already exists")
        self.sequence += 1
        company_id = str(self.sequence)
        self.items[company_id] = self._item(payload.model_dump(), company_id)
        return self.items[company_id]
    async def update(self, company_id, payload):
        item = await self.get(company_id)
        changes = payload.model_dump(exclude_unset=True)
        if not changes: raise HTTPException(status_code=400, detail="Provide at least one field to update")
        item.update(changes); item["updated_at"] = datetime.now(timezone.utc)
        return item
    async def delete(self, company_id):
        await self.get(company_id); del self.items[company_id]

PAYLOAD = {"name": "Example Corp", "logo": "https://example.com/logo.png", "difficulty_level": "Medium", "interview_pattern": ["HR", "Technical", "Coding", "Behavioral"], "hr_round": "Culture and motivation", "technical_round": "Backend fundamentals", "coding_round": "Algorithms", "behavioral_round": "STAR examples"}

class CompanyApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.service = FakeCompanyService()
        app.dependency_overrides[get_company_service] = lambda: cls.service
        app.dependency_overrides[get_current_user] = lambda: {"id": "test-user", "email": "test@example.com"}
        cls.client = TestClient(app)
    @classmethod
    def tearDownClass(cls): app.dependency_overrides.clear()
    def test_crud_endpoints(self):
        self.assertEqual(self.client.get("/api/v1/companies/").status_code, 200)
        created = self.client.post("/api/v1/companies/", json=PAYLOAD)
        self.assertEqual(created.status_code, 201)
        company_id = created.json()["id"]
        self.assertEqual(self.client.get(f"/api/v1/companies/{company_id}").status_code, 200)
        changed = self.client.patch(f"/api/v1/companies/{company_id}", json={"difficulty_level": "Hard"})
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(changed.json()["difficulty_level"], "Hard")
        self.assertEqual(self.client.delete(f"/api/v1/companies/{company_id}").status_code, 204)
        self.assertEqual(self.client.get(f"/api/v1/companies/{company_id}").status_code, 404)

if __name__ == "__main__": unittest.main()