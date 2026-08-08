"""
app/services/ai.py
------------------
Resume analysis service.

Workflow
--------
1. Call `analyze_resume(text, job_description?)` with the extracted plain text.
2. The function runs two passes in parallel:
   a. Local heuristic scoring (always available, zero latency).
   b. LLM enhancement via Gemini (primary) or OpenAI (fallback), if an API
      key is configured. The LLM enriches suggestions and missing-keyword
      detection from the job description.
3. Returns an `AnalysisResult` dataclass that maps 1-to-1 with
   `app/schemas/analyzer.AnalysisResponse`.

Provider selection is driven by `settings.AI_PROVIDER`:
    "gemini"  → google-generativeai
    "openai"  → openai
If the key is empty or the call fails, the service falls back gracefully to
the local heuristic result without raising an error.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Optional

from app.config import settings
from app.services.parser import scan_skills

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Return type (mirrors AnalysisResponse schema exactly)
# ---------------------------------------------------------------------------

@dataclass
class SkillResult:
    name: str
    relevance: Optional[float] = None


@dataclass
class CheckResult:
    label: str
    passed: bool
    detail: Optional[str] = None


@dataclass
class AnalysisResult:
    score: int
    extracted_skills: list[SkillResult] = field(default_factory=list)
    missing_keywords: list[str] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)
    checks: list[CheckResult] = field(default_factory=list)
    resume_filename: Optional[str] = None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def analyze_resume(
    text: str,
    job_description: Optional[str] = None,
    resume_filename: Optional[str] = None,
) -> AnalysisResult:
    """
    Analyse resume plain-text and return a structured report.

    Args:
        text:             Plain text extracted by parser.extract_text().
        job_description:  Optional JD text for keyword-gap analysis.
        resume_filename:  Original filename, embedded in the response.

    Returns:
        AnalysisResult ready to be returned from the /analyze endpoint.
    """
    # ── Step 1: local heuristic baseline ────────────────────────────────────
    result = _heuristic_analysis(text, job_description, resume_filename)

    # ── Step 2: LLM enrichment (best-effort; silently skipped on failure) ───
    if _llm_available():
        try:
            result = await _llm_enrich(result, text, job_description)
        except Exception as exc:
            logger.warning("LLM enrichment failed, using heuristic result: %s", exc)

    return result


# ---------------------------------------------------------------------------
# Heuristic analysis (no external calls)
# ---------------------------------------------------------------------------

# Scoring weights
_W_SKILLS = 30          # up to 30 pts for skill coverage
_W_CONTACT = 15         # contact details present
_W_EDUCATION = 10       # education section present
_W_EXPERIENCE = 15      # experience / work section present
_W_METRICS = 15         # quantified achievements
_W_LENGTH = 15          # appropriate resume length

# Regex patterns for heuristic checks
_RE_EMAIL = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_RE_PHONE = re.compile(r"(\+?\d[\d\s\-().]{7,}\d)")
_RE_LINKEDIN = re.compile(r"linkedin\.com/in/", re.IGNORECASE)
_RE_METRICS = re.compile(
    r"(\d+\s*%|\$\s*\d[\d,]*|\d+[xX]\s|\b\d+\s*(users|customers|clients|ms|seconds|"
    r"projects|team|engineers|repos|deployments|requests|transactions))",
    re.IGNORECASE,
)
_RE_EDUCATION = re.compile(
    r"\b(bachelor|master|phd|b\.?sc|m\.?sc|b\.?tech|m\.?tech|degree|university|"
    r"college|diploma|gpa|cgpa)\b",
    re.IGNORECASE,
)
_RE_EXPERIENCE = re.compile(
    r"\b(experience|work history|employment|professional background|career|"
    r"internship|position|role|engineer|developer|analyst|manager|lead)\b",
    re.IGNORECASE,
)
_RE_ACTION_VERBS = re.compile(
    r"\b(led|built|designed|developed|implemented|optimized|reduced|increased|"
    r"launched|delivered|managed|created|improved|architected|migrated|automated)\b",
    re.IGNORECASE,
)


def _heuristic_analysis(
    text: str,
    job_description: Optional[str],
    resume_filename: Optional[str],
) -> AnalysisResult:
    """Score the resume using regex-based rules; no API calls needed."""

    words = text.split()
    word_count = len(words)

    # ── Skills ───────────────────────────────────────────────────────────────
    found_skills = scan_skills(text)
    skill_score = min(_W_SKILLS, int(len(found_skills) / 2))  # 2 skills → 1 pt, cap at 30

    # ── Contact details ───────────────────────────────────────────────────────
    has_email = bool(_RE_EMAIL.search(text))
    has_phone = bool(_RE_PHONE.search(text))
    has_linkedin = bool(_RE_LINKEDIN.search(text))
    contact_score = 0
    if has_email:
        contact_score += 7
    if has_phone:
        contact_score += 5
    if has_linkedin:
        contact_score += 3

    # ── Education ─────────────────────────────────────────────────────────────
    has_education = bool(_RE_EDUCATION.search(text))
    education_score = _W_EDUCATION if has_education else 0

    # ── Experience ────────────────────────────────────────────────────────────
    has_experience = bool(_RE_EXPERIENCE.search(text))
    experience_score = _W_EXPERIENCE if has_experience else 0

    # ── Quantified metrics ────────────────────────────────────────────────────
    metric_hits = len(_RE_METRICS.findall(text))
    has_metrics = metric_hits >= 2
    metrics_score = _W_METRICS if has_metrics else int(metric_hits * (_W_METRICS / 2))

    # ── Length (ideal: 300–700 words for 1-page; up to 1200 for 2-page) ──────
    if 300 <= word_count <= 1200:
        length_score = _W_LENGTH
    elif word_count < 300:
        length_score = int(_W_LENGTH * (word_count / 300))
    else:
        length_score = max(0, _W_LENGTH - int((word_count - 1200) / 100))

    total_score = min(
        100,
        skill_score + contact_score + education_score +
        experience_score + metrics_score + length_score,
    )

    # ── Format checks ─────────────────────────────────────────────────────────
    checks = [
        CheckResult(
            label="Contact details present",
            passed=has_email and has_phone,
            detail=None if (has_email and has_phone)
                   else "Add a phone number and professional email address.",
        ),
        CheckResult(
            label="Education section detected",
            passed=has_education,
            detail=None if has_education
                   else "Include an Education section with your degree and institution.",
        ),
        CheckResult(
            label="Work experience section detected",
            passed=has_experience,
            detail=None if has_experience
                   else "Add a Work Experience section with job titles and responsibilities.",
        ),
        CheckResult(
            label="Quantified achievements present",
            passed=has_metrics,
            detail=None if has_metrics
                   else f"Found only {metric_hits} metric(s). Add measurable results "
                        f"(e.g. 'Reduced load time by 40%') for a stronger impact.",
        ),
        CheckResult(
            label="Action verbs used",
            passed=bool(_RE_ACTION_VERBS.search(text)),
            detail=None if _RE_ACTION_VERBS.search(text)
                   else "Start bullet points with strong action verbs like 'Led', 'Built', 'Optimized'.",
        ),
        CheckResult(
            label="LinkedIn profile linked",
            passed=has_linkedin,
            detail=None if has_linkedin
                   else "Add your LinkedIn URL to improve recruiter trust and ATS matching.",
        ),
        CheckResult(
            label="Resume length appropriate",
            passed=300 <= word_count <= 1200,
            detail=None if 300 <= word_count <= 1200
                   else (
                       "Resume is too short. Expand your experience and skill sections."
                       if word_count < 300
                       else "Resume may be too long. Aim for 1–2 pages (≤1200 words)."
                   ),
        ),
    ]

    # ── Heuristic suggestions ─────────────────────────────────────────────────
    suggestions: list[str] = []
    if not has_metrics:
        suggestions.append(
            "Quantify your impact: replace vague phrases with specific numbers "
            "(e.g. 'Increased API throughput by 35%', 'Managed a team of 6 engineers')."
        )
    if not _RE_ACTION_VERBS.search(text):
        suggestions.append(
            "Start every bullet point with a strong action verb "
            "(e.g. 'Architected', 'Automated', 'Delivered', 'Optimised')."
        )
    if not has_linkedin:
        suggestions.append("Add your LinkedIn profile URL to the contact section.")
    if word_count < 300:
        suggestions.append(
            "Your resume is very short. Expand your experience descriptions and add "
            "project details to give ATS parsers more keywords to match."
        )
    if len(found_skills) < 5:
        suggestions.append(
            "List your technical skills explicitly in a dedicated 'Skills' section "
            "so ATS systems can match them against job requirements."
        )

    # ── Keyword gap (job description provided) ────────────────────────────────
    missing_keywords: list[str] = []
    if job_description:
        jd_skills = set(s.lower() for s in scan_skills(job_description))
        resume_skills = set(s.lower() for s in found_skills)
        missing_keywords = [s for s in jd_skills if s not in resume_skills]

        if missing_keywords:
            suggestions.append(
                f"Your resume is missing {len(missing_keywords)} skill(s) mentioned in the "
                f"job description: {', '.join(missing_keywords[:5])}{'...' if len(missing_keywords) > 5 else ''}. "
                "Add them where genuinely applicable."
            )

    skill_results = [SkillResult(name=s) for s in found_skills]

    return AnalysisResult(
        score=total_score,
        extracted_skills=skill_results,
        missing_keywords=missing_keywords,
        suggestions=suggestions,
        checks=checks,
        resume_filename=resume_filename,
    )


# ---------------------------------------------------------------------------
# LLM enrichment
# ---------------------------------------------------------------------------

def _llm_available() -> bool:
    """Return True if the configured provider has an API key set."""
    provider = settings.AI_PROVIDER.lower()
    if provider == "gemini":
        return bool(settings.GEMINI_API_KEY)
    if provider == "openai":
        return bool(settings.OPENAI_API_KEY)
    return False


async def _llm_enrich(
    base: AnalysisResult,
    text: str,
    job_description: Optional[str],
) -> AnalysisResult:
    """
    Send resume text + base heuristic result to the LLM and ask it to:
      - Produce 3–5 high-quality, tailored improvement suggestions
      - Identify missing keywords (if JD provided)
      - Optionally adjust the score ±10 pts

    The LLM must respond with a JSON object. On parse failure the base result
    is returned unchanged.
    """
    prompt = _build_prompt(text, base, job_description)

    provider = settings.AI_PROVIDER.lower()
    if provider == "gemini":
        raw_json = await _call_gemini(prompt)
    elif provider == "openai":
        raw_json = await _call_openai(prompt)
    else:
        logger.warning("Unknown AI_PROVIDER '%s', skipping LLM step.", provider)
        return base

    return _merge_llm_response(base, raw_json)


def _build_prompt(
    text: str,
    base: AnalysisResult,
    job_description: Optional[str],
) -> str:
    jd_section = (
        f"\n\n## Target Job Description\n{job_description[:3000]}"
        if job_description else ""
    )
    skills_found = ", ".join(s.name for s in base.extracted_skills) or "none detected"

    return f"""You are an expert ATS resume coach. Analyse the resume below and return ONLY a valid JSON object — no markdown, no prose.

## Resume Text (truncated to 4000 chars)
{text[:4000]}
{jd_section}

## Heuristic Pre-Analysis
- Score: {base.score}/100
- Skills found: {skills_found}
- Missing keywords: {', '.join(base.missing_keywords) or 'n/a'}

## Your Task
Return a JSON object with EXACTLY these keys:
{{
  "score_adjustment": <integer between -10 and +10, positive to raise, negative to lower>,
  "suggestions": [<3 to 5 high-quality, specific, actionable strings>],
  "missing_keywords": [<list of important keywords from the JD absent in the resume>]
}}

Rules:
- "suggestions" must be specific to THIS resume — no generic advice.
- Each suggestion must be a single sentence under 25 words.
- "missing_keywords" should be empty list [] if no JD was provided.
- Return raw JSON only. Do NOT wrap in ```json``` or add any other text.
"""


async def _call_gemini(prompt: str) -> str:
    import google.generativeai as genai  # type: ignore

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    # Run the synchronous SDK call in a thread pool to stay async-safe
    import asyncio
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: model.generate_content(prompt),
    )
    return response.text


async def _call_openai(prompt: str) -> str:
    from openai import AsyncOpenAI  # type: ignore

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    chat = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=600,
    )
    return chat.choices[0].message.content or ""


def _merge_llm_response(base: AnalysisResult, raw_json: str) -> AnalysisResult:
    """
    Parse the LLM JSON response and overlay it onto the heuristic result.
    Falls back to `base` unchanged if the JSON is invalid.
    """
    try:
        # Strip markdown fences if the model ignored the instruction
        cleaned = re.sub(r"```(?:json)?|```", "", raw_json).strip()
        data = json.loads(cleaned)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning("LLM returned invalid JSON: %s | raw=%s", exc, raw_json[:200])
        return base

    adjustment = int(data.get("score_adjustment", 0))
    new_score = max(0, min(100, base.score + adjustment))

    llm_suggestions: list[str] = data.get("suggestions", [])
    llm_missing: list[str] = data.get("missing_keywords", [])

    # Merge: prefer LLM suggestions when present, keep heuristic ones as fallback
    final_suggestions = llm_suggestions if llm_suggestions else base.suggestions
    final_missing = llm_missing if llm_missing else base.missing_keywords

    return AnalysisResult(
        score=new_score,
        extracted_skills=base.extracted_skills,
        missing_keywords=final_missing,
        suggestions=final_suggestions,
        checks=base.checks,
        resume_filename=base.resume_filename,
    )


# ---------------------------------------------------------------------------
# Dynamic AI Roadmap Generation
# ---------------------------------------------------------------------------

async def generate_learning_roadmap_from_goal(goal: str) -> list[dict]:
    """
    Generates a 4-week JSON roadmap array based on the user's goal string
    using Gemini or OpenAI. Returns a parsed list of dicts matching the frontend format.
    """
    if not _llm_available():
        raise RuntimeError("AI Provider not properly configured. Cannot generate roadmap.")

    prompt = f"""You are an expert technical Career Coach. The user has the following career goal:
"{goal}"

Create a highly detailed, 4-step (4-week) progressive learning roadmap for them.

Rules:
- Return ONLY a raw JSON array. No markdown, no code fences, no comments, no prose.
- Generate EXACTLY 4 objects, one per week (stepNum 1 to 4).
- Set "status" of step 1 to "current" and steps 2, 3, 4 to "locked".
- Each checklist must have exactly 3 items with unique integer ids (e.g. week 1: 101,102,103; week 2: 201,202,203).
- Each resources array must have 2 items.

Return a JSON array matching EXACTLY this structure (no extra fields, no comments):
[
  {{
    "id": 1,
    "stepNum": 1,
    "title": "Clear week title",
    "subtitle": "Short descriptive subtitle",
    "status": "current",
    "duration": "Week 1",
    "resources": [
      {{ "type": "Doc", "name": "Resource name", "href": "#" }},
      {{ "type": "Video", "name": "Video topic to search", "href": "#" }}
    ],
    "checklist": [
      {{ "id": 101, "text": "Specific actionable task 1", "checked": false }},
      {{ "id": 102, "text": "Specific actionable task 2", "checked": false }},
      {{ "id": 103, "text": "Specific actionable task 3", "checked": false }}
    ]
  }},
  {{
    "id": 2,
    "stepNum": 2,
    "title": "Week 2 title",
    "subtitle": "Week 2 subtitle",
    "status": "locked",
    "duration": "Week 2",
    "resources": [
      {{ "type": "Doc", "name": "Resource name", "href": "#" }},
      {{ "type": "Video", "name": "Video topic", "href": "#" }}
    ],
    "checklist": [
      {{ "id": 201, "text": "Task 1", "checked": false }},
      {{ "id": 202, "text": "Task 2", "checked": false }},
      {{ "id": 203, "text": "Task 3", "checked": false }}
    ]
  }},
  {{
    "id": 3,
    "stepNum": 3,
    "title": "Week 3 title",
    "subtitle": "Week 3 subtitle",
    "status": "locked",
    "duration": "Week 3",
    "resources": [
      {{ "type": "Doc", "name": "Resource name", "href": "#" }},
      {{ "type": "Article", "name": "Article topic", "href": "#" }}
    ],
    "checklist": [
      {{ "id": 301, "text": "Task 1", "checked": false }},
      {{ "id": 302, "text": "Task 2", "checked": false }},
      {{ "id": 303, "text": "Task 3", "checked": false }}
    ]
  }},
  {{
    "id": 4,
    "stepNum": 4,
    "title": "Week 4 title",
    "subtitle": "Week 4 subtitle",
    "status": "locked",
    "duration": "Week 4",
    "resources": [
      {{ "type": "Project", "name": "Capstone project idea", "href": "#" }},
      {{ "type": "Doc", "name": "Reference guide", "href": "#" }}
    ],
    "checklist": [
      {{ "id": 401, "text": "Task 1", "checked": false }},
      {{ "id": 402, "text": "Task 2", "checked": false }},
      {{ "id": 403, "text": "Task 3", "checked": false }}
    ]
  }}
]

Now generate the real content for the goal: "{goal}"
"""
    provider = settings.AI_PROVIDER.lower()
    raw_json = ""
    try:
        if provider == "gemini":
            raw_json = await _call_gemini(prompt)
        elif provider == "openai":
            raw_json = await _call_openai(prompt)

        # Clean markdown wrappers if returned
        cleaned = re.sub(r"```(?:json)?|```", "", raw_json).strip()
        data = json.loads(cleaned)
        
        # Ensure it's a list
        if not isinstance(data, list):
            data = [data]
            
        return data
    except Exception as exc:
        logger.error("Failed to generate AI roadmap from goal: %s | raw=%s", exc, raw_json[:200])
        import traceback
        traceback.print_exc()
        # Fallback format identical to the frontend's fallback so it degrades gracefully
        return [
            {
                "id": 1, "stepNum": 1, "title": "Foundations", "subtitle": f"Introductory skills for {goal[:20]}...", "status": "current", "duration": "Week 1",
                "resources": [{"type": "Search", "name": "Best practices guide", "href": "#"}],
                "checklist": [{"id": 101, "text": "Complete introductory tutorials", "checked": False}, {"id": 102, "text": "Set up environment", "checked": False}]
            },
            {
                "id": 2, "stepNum": 2, "title": "Practical Application", "subtitle": "Building first projects", "status": "locked", "duration": "Week 2",
                "resources": [{"type": "Doc", "name": "Project architecture guidelines", "href": "#"}],
                "checklist": [{"id": 201, "text": "Build MVP", "checked": False}]
            }
        ]
