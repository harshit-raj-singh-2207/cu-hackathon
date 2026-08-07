"""Idempotently seed 280 deterministic, realistic Indian technology jobs."""

import asyncio
import hashlib
import json
from datetime import datetime, timedelta, timezone
from urllib.parse import quote_plus
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne
from app.config import settings
from app.utils.search_normalization import normalize_search_text, search_tokens
from app.utils.skill_normalization import normalize_skills

COMPANIES = ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Capgemini", "Tech Mahindra", "HCLTech", "IBM", "Deloitte", "EY", "KPMG", "PwC", "Amazon", "Microsoft", "Google", "Flipkart", "Meesho", "Razorpay", "PhonePe", "Paytm", "Zoho", "Freshworks", "Swiggy", "Zomato", "CRED", "BrowserStack", "Postman", "Salesforce", "Oracle", "SAP", "Adobe", "Nagarro", "Publicis Sapient", "Persistent Systems", "LTIMindtree", "Mphasis", "Genpact", "Stripe", "Atlassian"]
LOCATIONS = [
    ("Bengaluru", "Bengaluru", "Karnataka"), ("Hyderabad", "Hyderabad", "Telangana"),
    ("Pune", "Pune", "Maharashtra"), ("Gurugram", "Gurugram", "Haryana"),
    ("Noida", "Noida", "Uttar Pradesh"), ("Delhi NCR", "Delhi", "Delhi"),
    ("Mumbai", "Mumbai", "Maharashtra"), ("Chennai", "Chennai", "Tamil Nadu"),
    ("Chandigarh", "Chandigarh", "Chandigarh"), ("Mohali", "Mohali", "Punjab"),
    ("Jaipur", "Jaipur", "Rajasthan"), ("Ahmedabad", "Ahmedabad", "Gujarat"),
    ("Kolkata", "Kolkata", "West Bengal"), ("Kochi", "Kochi", "Kerala"),
    ("Indore", "Indore", "Madhya Pradesh"), ("Remote India", "Remote", "India"),
    ("Work From Home", "Remote", "India"),
]
TITLE_PROFILES = [
    ("Frontend Developer", ["HTML", "CSS", "JavaScript", "React"], ["TypeScript", "Redux"]),
    ("Senior Frontend Engineer", ["React", "TypeScript", "CSS", "Git"], ["Next.js", "GraphQL"]),
    ("React Developer", ["React", "JavaScript", "HTML", "CSS"], ["Redux", "Jest"]),
    ("React.js Intern", ["React", "JavaScript", "Git"], ["Tailwind CSS", "Jest"]),
    ("MERN Stack Developer", ["React", "Node.js", "Express.js", "MongoDB"], ["Docker", "AWS"]),
    ("Full Stack Developer", ["JavaScript", "React", "Node.js", "REST API"], ["TypeScript", "PostgreSQL"]),
    ("Backend Developer", ["REST API", "SQL", "Git", "Docker"], ["AWS", "Redis"]),
    ("Node.js Developer", ["Node.js", "Express.js", "MongoDB", "REST API"], ["TypeScript", "GraphQL"]),
    ("Express.js Developer", ["Node.js", "Express.js", "REST API"], ["MongoDB", "Jest"]),
    ("Python Developer", ["Python", "SQL", "Git", "REST API"], ["FastAPI", "Docker"]),
    ("FastAPI Developer", ["Python", "FastAPI", "REST API", "PostgreSQL"], ["Docker", "AWS"]),
    ("Django Developer", ["Python", "Django", "SQL", "REST API"], ["PostgreSQL", "Docker"]),
    ("Java Developer", ["Java", "OOP", "DSA", "SQL"], ["Spring Boot", "Docker"]),
    ("Spring Boot Developer", ["Java", "Spring Boot", "REST API", "SQL"], ["Docker", "AWS"]),
    ("Software Engineer", ["DSA", "OOP", "Git", "SQL"], ["Docker", "AWS"]),
    ("Software Developer", ["DSA", "OOP", "Git"], ["JavaScript", "Python"]),
    ("Software Engineer Intern", ["DSA", "OOP", "Git"], ["Java", "Python"]),
    ("Associate Software Engineer", ["DSA", "OOP", "Git"], ["Java", "SQL"]),
    ("Graduate Engineer Trainee", ["DSA", "OOP", "Git"], ["Java", "Python"]),
    ("Data Analyst", ["SQL", "Excel", "Pandas"], ["Power BI", "Tableau"]),
    ("Business Analyst", ["Excel", "SQL", "Power BI"], ["Tableau", "Python"]),
    ("Data Scientist", ["Python", "Pandas", "NumPy", "Machine Learning"], ["TensorFlow", "SQL"]),
    ("Machine Learning Engineer", ["Python", "Machine Learning", "TensorFlow"], ["PyTorch", "Docker"]),
    ("Machine Learning Intern", ["Python", "NumPy", "Pandas"], ["Machine Learning", "TensorFlow"]),
    ("AI Engineer", ["Python", "Machine Learning", "PyTorch"], ["TensorFlow", "AWS"]),
    ("DevOps Engineer", ["Linux", "Docker", "CI/CD", "AWS"], ["Kubernetes", "Azure"]),
    ("Cloud Engineer", ["AWS", "Linux", "Docker"], ["Kubernetes", "Azure"]),
    ("AWS Engineer", ["AWS", "Linux", "CI/CD"], ["Docker", "Kubernetes"]),
    ("QA Engineer", ["Selenium", "Git", "SQL"], ["Playwright", "Jest"]),
    ("Automation Test Engineer", ["Selenium", "Playwright", "Java"], ["Jest", "CI/CD"]),
    ("UI Developer", ["HTML", "CSS", "JavaScript"], ["React", "Tailwind CSS"]),
    ("Web Developer", ["HTML", "CSS", "JavaScript"], ["React", "Node.js"]),
    ("Mobile App Developer", ["JavaScript", "Git", "REST API"], ["React", "Java"]),
    ("Android Developer", ["Java", "OOP", "REST API"], ["Git", "SQL"]),
    ("Database Developer", ["SQL", "MySQL", "PostgreSQL"], ["MongoDB", "Python"]),
    ("MongoDB Developer", ["MongoDB", "Node.js", "JavaScript"], ["Python", "Docker"]),
    ("Cybersecurity Analyst", ["Linux", "Python", "SQL"], ["AWS", "Docker"]),
    ("Technical Support Engineer", ["Linux", "SQL", "Git"], ["AWS", "Python"]),
    ("Redux Developer", ["React", "Redux", "JavaScript"], ["TypeScript", "Jest"]),
]
DEPARTMENTS = ["Computer Science", "Information Technology", "Electronics", "Electrical Engineering"]
ANCHOR = datetime(2026, 7, 1, tzinfo=timezone.utc)


def _slug(value: str) -> str:
    return "-".join(search_tokens(value))


def build_seed_jobs() -> list[dict]:
    """Build the same 280 records on every run without randomness."""
    jobs: list[dict] = []
    for index in range(280):
        title, required, preferred = TITLE_PROFILES[index % len(TITLE_PROFILES)]
        company = COMPANIES[(index * 7) % len(COMPANIES)]
        location, city, state = LOCATIONS[(index * 5) % len(LOCATIONS)]
        variant = index // len(TITLE_PROFILES)
        workplace = "remote" if city == "Remote" else ("hybrid" if index % 3 == 0 else "onsite")
        employment = "internship" if "Intern" in title or "Trainee" in title else ("contract" if index % 17 == 0 else "full-time")
        level = "fresher" if employment == "internship" or "Associate" in title or "Trainee" in title else ("senior" if "Senior" in title or variant >= 5 else "mid-level")
        min_exp, max_exp = (0, 1) if level == "fresher" else ((5, 10) if level == "senior" else (1 + variant % 2, 5 + variant % 3))
        salary_min, salary_max = ((300000, 800000) if level == "fresher" else ((1800000, 4000000) if level == "senior" else (800000, 1800000)))
        seed_key = f"job-{index + 1:03d}-{_slug(title)}-{_slug(company)}"
        summary = f"{company} is hiring a {title} for its {location} technology team."
        responsibilities = [f"Build and maintain production-grade {title.lower()} solutions", "Collaborate with product, design, and engineering teams", "Write tested, maintainable code and improve delivery quality"]
        normalized = normalize_skills([*required, *preferred])
        posted_at = ANCHOR + timedelta(days=index % 45)
        document = {
            "seed_key": seed_key, "title": title, "normalized_title": normalize_search_text(title),
            "company": company, "normalized_company": normalize_search_text(company),
            "company_logo_url": f"https://ui-avatars.com/api/?name={quote_plus(company)}&background=2563eb&color=fff",
            "company_logo": None, "location": location, "normalized_location": normalize_search_text(location),
            "city": city, "state": state, "country": "India", "workplace_type": workplace,
            "employment_type": employment, "experience_level": level, "min_experience": min_exp,
            "max_experience": max_exp, "salary_min": salary_min + (index % 4) * 50000,
            "salary_max": min(4000000, salary_max + (index % 4) * 100000), "salary_currency": "INR", "salary_period": "year",
            "summary": summary, "description": summary + " The role offers ownership, mentorship, and measurable product impact.",
            "responsibilities": responsibilities, "required_skills": required, "preferred_skills": preferred,
            "normalized_skills": normalized, "missing_skill_suggestions": preferred,
            "eligibility_departments": DEPARTMENTS if level == "fresher" else [],
            "eligible_passing_years": [2025, 2026, 2027] if level == "fresher" else [],
            "min_cgpa": 6.0 + (index % 4) * 0.5 if level == "fresher" else None,
            "openings": 1 + index % 12, "posted_at": posted_at,
            "application_deadline": posted_at + timedelta(days=90), "application_url": f"https://careers.example.com/{seed_key}",
            "is_active": True, "created_at": ANCHOR, "updated_at": ANCHOR,
            "search_terms": list(dict.fromkeys([*search_tokens(title), *search_tokens(company), *search_tokens(location), *( ["bangalore"] if location == "Bengaluru" else []), *normalized])),
        }
        comparable = {key: value.isoformat() if isinstance(value, datetime) else value for key, value in document.items() if key not in {"created_at", "updated_at"}}
        document["content_hash"] = hashlib.sha256(json.dumps(comparable, sort_keys=True).encode()).hexdigest()
        jobs.append(document)
    return jobs


JOBS = build_seed_jobs()


async def seed() -> None:
    """Bulk-upsert changed jobs and report inserted, updated, and skipped counts."""
    client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=15000)
    database = client[settings.DATABASE_NAME]
    await client.admin.command("ping")
    existing = {row["seed_key"]: row.get("content_hash") async for row in database["jobs"].find({"seed_key": {"$in": [job["seed_key"] for job in JOBS]}}, {"seed_key": 1, "content_hash": 1})}
    changed = [job for job in JOBS if existing.get(job["seed_key"]) != job["content_hash"]]
    operations = [UpdateOne({"seed_key": job["seed_key"]}, {"$set": {key: value for key, value in job.items() if key != "created_at"}, "$setOnInsert": {"created_at": job["created_at"]}}, upsert=True) for job in changed]
    inserted = updated = 0
    if operations:
        result = await database["jobs"].bulk_write(operations, ordered=False)
        inserted, updated = result.upserted_count, result.modified_count
    skipped = len(JOBS) - len(changed)
    print(f"Job seed complete: total={len(JOBS)} inserted={inserted} updated={updated} skipped={skipped}")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
