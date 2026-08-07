from datetime import datetime, timezone
from uuid import uuid4
from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError
from app.schemas.job_role import JobRoleCreate, JobRoleUpdate

DEFAULT_JOB_ROLES = [
    ("Frontend Developer", "Engineering", ["HTML", "CSS", "JavaScript", "React"], ["Accessibility", "Web performance"], ["JavaScript", "TypeScript"], ["React", "Next.js"], [], ["DOM", "React", "CSS", "Web performance"], "Junior", "45-60 minutes"),
    ("Backend Developer", "Engineering", ["APIs", "Databases", "Problem solving"], ["Distributed systems"], ["Python", "Java"], ["FastAPI", "Spring Boot"], ["PostgreSQL", "Redis"], ["API design", "Authentication", "Database design"], "Junior", "60 minutes"),
    ("Full Stack Developer", "Engineering", ["Frontend", "Backend", "Databases"], ["System design"], ["JavaScript", "TypeScript"], ["React", "Node.js"], ["PostgreSQL", "MongoDB"], ["Web architecture", "APIs", "System design"], "Mid", "60-75 minutes"),
    ("Java Developer", "Engineering", ["Java", "OOP", "Data structures"], ["Microservices"], ["Java"], ["Spring Boot"], ["PostgreSQL"], ["JVM", "Collections", "Spring"], "Junior", "60 minutes"),
    ("Python Developer", "Engineering", ["Python", "OOP", "Problem solving"], ["Async programming"], ["Python"], ["Django", "FastAPI"], ["PostgreSQL"], ["Python", "APIs", "Testing"], "Junior", "60 minutes"),
    ("MERN Stack Developer", "Engineering", ["JavaScript", "MongoDB", "React", "Node.js"], ["TypeScript"], ["JavaScript", "TypeScript"], ["React", "Express"], ["MongoDB"], ["MERN architecture", "REST APIs", "React"], "Junior", "60 minutes"),
    ("AI Engineer", "Artificial Intelligence", ["Machine learning", "Python", "Statistics"], ["MLOps"], ["Python"], ["PyTorch", "Transformers"], ["Vector databases"], ["LLMs", "Model evaluation", "Prompt engineering"], "Mid", "75 minutes"),
    ("Machine Learning Engineer", "Artificial Intelligence", ["Machine learning", "Data pipelines", "Python"], ["Model deployment"], ["Python"], ["Scikit-learn", "TensorFlow"], ["PostgreSQL", "Feature store"], ["ML lifecycle", "Feature engineering", "Model serving"], "Mid", "75 minutes"),
    ("Data Analyst", "Data", ["SQL", "Data analysis", "Communication"], ["Statistics"], ["SQL", "Python"], ["Power BI"], ["PostgreSQL"], ["SQL", "Dashboards", "Business metrics"], "Junior", "45-60 minutes"),
    ("Data Scientist", "Data", ["Statistics", "Machine learning", "Python"], ["Experiment design"], ["Python", "SQL"], ["Scikit-learn"], ["PostgreSQL"], ["Statistics", "A/B testing", "Machine learning"], "Mid", "75 minutes"),
    ("DevOps Engineer", "Cloud & Infrastructure", ["Linux", "Automation", "Cloud"], ["Security"], ["Python", "Bash"], ["Terraform", "Kubernetes"], [], ["CI/CD", "Infrastructure as code", "Monitoring"], "Mid", "60-75 minutes"),
    ("Cloud Engineer", "Cloud & Infrastructure", ["Cloud services", "Networking", "Automation"], ["Cost optimization"], ["Python", "Bash"], ["Terraform"], [], ["Cloud architecture", "Networking", "IAM"], "Mid", "60-75 minutes"),
    ("Cyber Security Analyst", "Security", ["Security monitoring", "Networking", "Incident response"], ["Threat hunting"], ["Python", "Bash"], [], [], ["OWASP", "SIEM", "Incident response"], "Junior", "60 minutes"),
    ("QA Engineer", "Quality Assurance", ["Testing", "Attention to detail", "Automation"], ["Performance testing"], ["Python", "JavaScript"], ["Selenium", "Playwright"], [], ["Test design", "API testing", "Automation"], "Junior", "45-60 minutes"),
    ("Android Developer", "Mobile Development", ["Android", "Kotlin", "Mobile UI"], ["Performance optimization"], ["Kotlin", "Java"], ["Android SDK", "Jetpack Compose"], [], ["Android lifecycle", "Kotlin", "Mobile architecture"], "Junior", "60 minutes"),
    ("iOS Developer", "Mobile Development", ["iOS", "Swift", "Mobile UI"], ["Performance optimization"], ["Swift"], ["SwiftUI", "UIKit"], [], ["iOS lifecycle", "Swift", "Mobile architecture"], "Junior", "60 minutes"),
]

def normalize_name(name: str) -> str: return " ".join(name.lower().split())
def serialize(document: dict) -> dict:
    value = dict(document); value.pop("_id", None); value.pop("role_name_normalized", None); return value

class JobRoleService:
    def __init__(self, database): self.collection = database["job_roles"]

    async def list(self, *, page, page_size, search=None, category=None, experience_level=None, sort_by="role_name", sort_order="asc"):
        query = {}
        if search: query["role_name"] = {"$regex": search.strip(), "$options": "i"}
        if category: query["role_category"] = category
        if experience_level: query["experience_level"] = experience_level
        direction = ASCENDING if sort_order == "asc" else DESCENDING
        cursor = self.collection.find(query).sort(sort_by, direction).skip((page - 1) * page_size).limit(page_size)
        return [serialize(item) for item in await cursor.to_list(length=page_size)], await self.collection.count_documents(query)

    async def get(self, role_id: str):
        role = await self.collection.find_one({"role_id": role_id})
        if not role: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job role not found")
        return serialize(role)

    async def create(self, payload: JobRoleCreate):
        now = datetime.now(timezone.utc)
        role = payload.model_dump()
        role.update({"role_id": str(uuid4()), "role_name_normalized": normalize_name(payload.role_name), "created_at": now, "updated_at": now})
        try: await self.collection.insert_one(role)
        except DuplicateKeyError: raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A job role with this name already exists")
        return serialize(role)

    async def update(self, role_id: str, payload: JobRoleUpdate):
        await self.get(role_id)
        changes = payload.model_dump(exclude_unset=True)
        if not changes: raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least one field to update")
        if "role_name" in changes: changes["role_name_normalized"] = normalize_name(changes["role_name"])
        changes["updated_at"] = datetime.now(timezone.utc)
        try: await self.collection.update_one({"role_id": role_id}, {"$set": changes})
        except DuplicateKeyError: raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A job role with this name already exists")
        return await self.get(role_id)

    async def delete(self, role_id: str):
        await self.get(role_id)
        await self.collection.delete_one({"role_id": role_id})

async def seed_default_job_roles(database):
    service = JobRoleService(database)
    for name, category, required, preferred, languages, frameworks, databases, topics, level, duration in DEFAULT_JOB_ROLES:
        if not await service.collection.find_one({"role_name_normalized": normalize_name(name)}):
            await service.create(JobRoleCreate(role_name=name, role_category=category, required_skills=required, preferred_skills=preferred, programming_languages=languages, frameworks=frameworks, databases=databases, interview_topics=topics, experience_level=level, expected_duration=duration))