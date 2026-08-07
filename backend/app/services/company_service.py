from datetime import datetime, timezone
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from fastapi import HTTPException, status
from app.schemas.company import CompanyCreate, CompanyUpdate

DEFAULT_COMPANIES = [
    ("Google", "https://logo.clearbit.com/google.com", "Hard"), ("Amazon", "https://logo.clearbit.com/amazon.com", "Hard"),
    ("Microsoft", "https://logo.clearbit.com/microsoft.com", "Hard"), ("TCS", "https://logo.clearbit.com/tcs.com", "Medium"),
    ("Infosys", "https://logo.clearbit.com/infosys.com", "Medium"), ("Wipro", "https://logo.clearbit.com/wipro.com", "Medium"),
    ("Accenture", "https://logo.clearbit.com/accenture.com", "Hard"), ("Cognizant", "https://logo.clearbit.com/cognizant.com", "Medium"),
    ("Capgemini", "https://logo.clearbit.com/capgemini.com", "Medium"),
]

def normalize_name(name: str) -> str:
    return " ".join(name.lower().split())

def serialize_company(document: dict) -> dict:
    document = dict(document)
    document["id"] = str(document.pop("_id"))
    document.pop("name_normalized", None)
    return document

class CompanyService:
    def __init__(self, database): self.collection = database["companies"]

    async def list(self, skip: int = 0, limit: int = 100):
        documents = await self.collection.find({}).sort("name", 1).skip(skip).limit(limit).to_list(length=limit)
        return [serialize_company(item) for item in documents], await self.collection.count_documents({})

    async def get(self, company_id: str):
        if not ObjectId.is_valid(company_id): raise HTTPException(status_code=404, detail="Company not found")
        company = await self.collection.find_one({"_id": ObjectId(company_id)})
        if not company: raise HTTPException(status_code=404, detail="Company not found")
        return serialize_company(company)

    async def create(self, payload: CompanyCreate):
        now = datetime.now(timezone.utc)
        document = payload.model_dump()
        document.update({"name_normalized": normalize_name(payload.name), "created_at": now, "updated_at": now})
        try:
            result = await self.collection.insert_one(document)
        except DuplicateKeyError:
            raise HTTPException(status_code=409, detail="A company with this name already exists")
        document["_id"] = result.inserted_id
        return serialize_company(document)

    async def update(self, company_id: str, payload: CompanyUpdate):
        await self.get(company_id)
        update = payload.model_dump(exclude_unset=True)
        if not update: raise HTTPException(status_code=400, detail="Provide at least one field to update")
        if "name" in update: update["name_normalized"] = normalize_name(update["name"])
        update["updated_at"] = datetime.now(timezone.utc)
        try:
            await self.collection.update_one({"_id": ObjectId(company_id)}, {"$set": update})
        except DuplicateKeyError:
            raise HTTPException(status_code=409, detail="A company with this name already exists")
        return await self.get(company_id)

    async def delete(self, company_id: str):
        await self.get(company_id)
        await self.collection.delete_one({"_id": ObjectId(company_id)})

async def seed_default_companies(database):
    service = CompanyService(database)
    for name, logo, difficulty in DEFAULT_COMPANIES:
        if not await service.collection.find_one({"name_normalized": normalize_name(name)}):
            payload = CompanyCreate(name=name, logo=logo, difficulty_level=difficulty, interview_pattern=["HR", "Technical", "Coding", "Behavioral"], hr_round="Culture fit, motivation, and career goals.", technical_round="Role-specific fundamentals and problem solving.", coding_round="Programming assessment and data structures.", behavioral_round="Past experience assessed with the STAR method.")
            await service.create(payload)