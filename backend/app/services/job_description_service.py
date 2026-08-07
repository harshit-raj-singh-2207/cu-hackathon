from __future__ import annotations

import re
from collections import Counter
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException

from app.models.job_description import JobDescriptionDocument
from app.schemas.job_description import JobDescriptionParseRequest


class JobDescriptionService:
    """Persist and deterministically structure job descriptions without AI enrichment."""

    TECHNOLOGIES = {
        "python", "java", "javascript", "typescript", "c#", "c++", "go", "golang", "rust", "php",
        "react", "angular", "vue", "node.js", "nodejs", "fastapi", "django", "flask", "spring boot",
        "express", "next.js", "html", "css", "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
        "docker", "kubernetes", "aws", "azure", "gcp", "git", "github", "linux", "rest", "graphql",
        "kafka", "rabbitmq", "terraform", "jenkins", "figma",
    }
    SKILLS = {
        "data structures", "algorithms", "system design", "microservices", "api design", "rest api",
        "problem solving", "communication", "leadership", "teamwork", "agile", "scrum", "testing",
        "unit testing", "ci/cd", "object oriented programming", "database design", "cloud computing",
        "security", "authentication", "debugging", "code review", "stakeholder management",
    }
    SECTION_PATTERNS = {
        "responsibilities": re.compile(r"(?:responsibilities|what you(?:'|’)ll do|your role|duties)\s*:?") ,
        "qualifications": re.compile(r"(?:qualifications|requirements|what you(?:'|’)ll need|must have|preferred qualifications)\s*:?") ,
    }
    STOP_WORDS = {
        "and", "are", "the", "with", "for", "that", "this", "will", "from", "your", "our", "you",
        "their", "have", "has", "job", "role", "team", "work", "working", "years", "year", "experience",
        "skills", "required", "preferred", "candidate", "ability", "strong", "including", "within", "into",
        "about", "using", "build", "development", "developer", "software", "technical", "must", "should",
    }

    def __init__(self, database):
        self.collection = database["job_descriptions"]

    @staticmethod
    def _serialize(document: dict) -> dict:
        result = dict(document)
        result["id"] = str(result.pop("_id"))
        result.pop("user_id", None)
        result.pop("raw_text", None)
        return result

    @staticmethod
    def _find_terms(text: str, terms: set[str]) -> list[str]:
        matches = []
        for term in terms:
            pattern = rf"(?<!\w){re.escape(term)}(?!\w)"
            if re.search(pattern, text, flags=re.IGNORECASE):
                matches.append(term)
        return sorted(matches, key=str.lower)

    def _section_lines(self, text: str, section: str) -> list[str]:
        match = self.SECTION_PATTERNS[section].search(text.lower())
        if not match:
            return []
        following = text[match.end():]
        next_section = re.search(r"\n\s*(?:[A-Z][A-Za-z /&-]{2,}|What you(?:'|’)ll|Requirements|Qualifications)\s*:", following)
        block = following[:next_section.start()] if next_section else following
        lines = []
        for line in block.splitlines():
            cleaned = re.sub(r"^\s*(?:[-•*]|\d+[.)])\s*", "", line).strip()
            if cleaned and len(cleaned) >= 8:
                lines.append(cleaned)
        return lines[:20]

    def _keywords(self, text: str) -> list[str]:
        words = re.findall(r"[A-Za-z][A-Za-z+#.]{2,}", text.lower())
        counts = Counter(word for word in words if word not in self.STOP_WORDS)
        return [word for word, _ in counts.most_common(20)]

    def parse(self, text: str) -> dict:
        technologies = self._find_terms(text, self.TECHNOLOGIES)
        skills = self._find_terms(text, self.SKILLS)
        skills = sorted(set(skills + [item for item in technologies if item not in {"html", "css"}]), key=str.lower)
        experience = list(dict.fromkeys(re.findall(r"\b\d+(?:\s*[-–]\s*\d+)?\+?\s*(?:years?|yrs?)\b", text, flags=re.IGNORECASE)))
        return {
            "skills": skills,
            "technologies": technologies,
            "experience": experience,
            "responsibilities": self._section_lines(text, "responsibilities"),
            "qualifications": self._section_lines(text, "qualifications"),
            "keywords": self._keywords(text),
        }

    async def create(self, user_id: str, payload: JobDescriptionParseRequest) -> dict:
        now = datetime.now(timezone.utc)
        document = JobDescriptionDocument(
            user_id=user_id,
            raw_text=payload.job_description,
            **self.parse(payload.job_description),
            created_at=now,
            updated_at=now,
        ).model_dump(exclude={"id"})
        result = await self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return self._serialize(document)

    async def get(self, job_description_id: str, user_id: str) -> dict:
        if not ObjectId.is_valid(job_description_id):
            raise HTTPException(status_code=404, detail="Job description not found")
        document = await self.collection.find_one({"_id": ObjectId(job_description_id), "user_id": user_id})
        if not document:
            raise HTTPException(status_code=404, detail="Job description not found")
        return self._serialize(document)
