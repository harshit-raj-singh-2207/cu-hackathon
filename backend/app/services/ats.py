"""
app/services/ats.py
-------------------
ATS (Applicant Tracking System) compatibility checker.

Workflow
--------
1. Extract keywords from the job description (local NLP + skill scanner).
2. Match each keyword against the resume text, capturing context snippets.
3. Score each resume section independently.
4. Compute an overall weighted score.
5. Optionally enrich recommendations via Gemini / OpenAI (same provider
   selection as ai.py, reuses settings.AI_PROVIDER).

Returns an `ATSResult` dataclass that maps 1-to-1 with
`app/schemas/ats.ATSCheckResponse`.
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
# Return types  (mirror ATSCheckResponse schema)
# ---------------------------------------------------------------------------

@dataclass
class KeywordMatchResult:
    keyword: str
    found: bool
    context: Optional[str] = None


@dataclass
class SectionScoreResult:
    section: str
    score: int
    feedback: Optional[str] = None


@dataclass
class ATSResult:
    overall_score: int
    match_level: str
    job_title: Optional[str]
    keyword_matches: list[KeywordMatchResult] = field(default_factory=list)
    matched_count: int = 0
    total_keywords: int = 0
    match_percentage: float = 0.0
    section_scores: list[SectionScoreResult] = field(default_factory=list)
    missing_keywords: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)
    passes_ats_threshold: bool = False


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def check_ats(
    resume_text: str,
    job_description: str,
    job_title: Optional[str] = None,
) -> ATSResult:
    """
    Run a full ATS compatibility check of a resume against a job description.

    Args:
        resume_text:     Plain text from the resume (via parser.extract_text).
        job_description: Raw JD text pasted by the user.
        job_title:       Optional display label for the report.

    Returns:
        ATSResult ready to be serialised as ATSCheckResponse.
    """
    # ── Step 1: local analysis ───────────────────────────────────────────────
    result = _local_ats_check(resume_text, job_description, job_title)

    # ── Step 2: LLM enrichment (best-effort) ────────────────────────────────
    if _llm_available():
        try:
            result = await _llm_enrich(result, resume_text, job_description, job_title)
        except Exception as exc:
            logger.warning("ATS LLM enrichment failed, using local result: %s", exc)

    return result


# ---------------------------------------------------------------------------
# Local ATS engine
# ---------------------------------------------------------------------------

# Regex helpers for section detection
_SECTION_PATTERNS: dict[str, re.Pattern] = {
    "Summary":    re.compile(r"\b(summary|objective|profile|about me)\b", re.IGNORECASE),
    "Skills":     re.compile(r"\b(skills|technologies|tech stack|tools|competencies)\b", re.IGNORECASE),
    "Experience": re.compile(r"\b(experience|work history|employment|career|positions? held)\b", re.IGNORECASE),
    "Education":  re.compile(r"\b(education|academic|degree|university|college|qualification)\b", re.IGNORECASE),
    "Projects":   re.compile(r"\b(projects?|portfolio|open.?source|side.?project)\b", re.IGNORECASE),
    "Certifications": re.compile(r"\b(certifications?|certificates?|credentials?|courses?|training)\b", re.IGNORECASE),
}

# Stop words to skip when extracting JD keywords
_STOP_WORDS: frozenset[str] = frozenset({
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "must", "shall", "can",
    "we", "our", "you", "your", "they", "their", "this", "that", "these",
    "those", "it", "its", "he", "she", "his", "her", "us", "them", "who",
    "what", "which", "where", "when", "how", "why", "not", "no", "nor",
    "so", "yet", "both", "either", "neither", "each", "few", "more",
    "most", "other", "some", "such", "than", "too", "very", "just",
    "about", "above", "after", "also", "any", "because", "before",
    "between", "during", "if", "into", "like", "over", "per", "than",
    "through", "up", "while", "work", "role", "team", "position",
    "candidate", "looking", "seeking", "join", "help", "using", "use",
    "new", "strong", "good", "great", "excellent", "able", "ability",
    "well", "highly", "must", "required", "preferred", "plus",
})


def _extract_jd_keywords(job_description: str) -> list[str]:
    """
    Extract meaningful keywords from a job description.

    Strategy (ordered by priority):
    1. Known tech skills via scan_skills() from parser.py
    2. Capitalised multi-word phrases (e.g. "Machine Learning", "REST APIs")
    3. Meaningful single tokens ≥4 chars not in stop words
    """
    keywords: dict[str, str] = {}  # lower → original-case (dedup)

    # Pass 1: recognised tech skills (highest confidence)
    for skill in scan_skills(job_description):
        keywords[skill.lower()] = skill

    # Pass 2: capitalised multi-word noun phrases (2–3 words)
    for match in re.finditer(r"\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\b", job_description):
        phrase = match.group()
        key = phrase.lower()
        if key not in keywords and not any(w.lower() in _STOP_WORDS for w in phrase.split()):
            keywords[key] = phrase

    # Pass 3: meaningful single tokens
    for token in re.findall(r"\b[a-zA-Z][\w\+\#\.]*\b", job_description):
        key = token.lower()
        if (
            key not in keywords
            and key not in _STOP_WORDS
            and len(token) >= 4
        ):
            keywords[key] = token

    return list(keywords.values())


def _find_keyword_in_text(keyword: str, text: str) -> tuple[bool, Optional[str]]:
    """
    Case-insensitive keyword search. Returns (found, context_snippet).
    Context is up to 80 chars around the first match.
    """
    pattern = re.compile(r"\b" + re.escape(keyword) + r"\b", re.IGNORECASE)
    match = pattern.search(text)
    if not match:
        return False, None

    start = max(0, match.start() - 40)
    end = min(len(text), match.end() + 40)
    context = "..." + text[start:end].strip() + "..."
    return True, context


def _score_section(section_name: str, resume_text: str, jd_keywords: list[str]) -> SectionScoreResult:
    """
    Score a specific resume section by how many JD keywords appear in it.
    Falls back to full-text scoring if the section isn't found.
    """
    # Try to isolate the section text (rough heuristic: text after the section header)
    pattern = _SECTION_PATTERNS.get(section_name)
    section_text = resume_text  # default: full text

    if pattern:
        m = pattern.search(resume_text)
        if m:
            # Take up to 1000 chars after the header as the "section"
            section_text = resume_text[m.start(): m.start() + 1000]

    if not jd_keywords:
        return SectionScoreResult(section=section_name, score=0, feedback="No keywords to match.")

    hits = sum(1 for kw in jd_keywords if re.search(r"\b" + re.escape(kw) + r"\b", section_text, re.IGNORECASE))
    score = min(100, int((hits / len(jd_keywords)) * 100))

    if score >= 80:
        feedback = "Strong keyword coverage in this section."
    elif score >= 60:
        feedback = "Decent coverage — a few more targeted keywords would help."
    elif score >= 40:
        feedback = "Moderate coverage — consider adding more relevant keywords."
    else:
        feedback = "Low coverage — this section needs more JD-relevant terms."

    return SectionScoreResult(section=section_name, score=score, feedback=feedback)


def _score_to_level(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 50:
        return "Fair"
    return "Poor"


def _local_ats_check(
    resume_text: str,
    job_description: str,
    job_title: Optional[str],
) -> ATSResult:
    """Full ATS check using local NLP — no API calls."""

    # ── 1. Keyword extraction ────────────────────────────────────────────────
    jd_keywords = _extract_jd_keywords(job_description)

    # Keep to a sensible max to avoid noise
    jd_keywords = jd_keywords[:60]

    # ── 2. Keyword matching ──────────────────────────────────────────────────
    keyword_matches: list[KeywordMatchResult] = []
    for kw in jd_keywords:
        found, context = _find_keyword_in_text(kw, resume_text)
        keyword_matches.append(KeywordMatchResult(keyword=kw, found=found, context=context))

    matched = [m for m in keyword_matches if m.found]
    matched_count = len(matched)
    total_keywords = len(jd_keywords)
    match_pct = round((matched_count / total_keywords * 100), 1) if total_keywords else 0.0

    missing_keywords = [m.keyword for m in keyword_matches if not m.found]

    # ── 3. Section scoring ───────────────────────────────────────────────────
    section_scores = [
        _score_section(sec, resume_text, jd_keywords)
        for sec in ["Skills", "Experience", "Education", "Projects", "Certifications"]
    ]

    # ── 4. Overall score (keyword match weighted 60%, section avg 40%) ───────
    section_avg = (
        sum(s.score for s in section_scores) / len(section_scores)
        if section_scores else 0
    )
    overall_score = min(100, int(match_pct * 0.60 + section_avg * 0.40))

    # ── 5. Heuristic recommendations ────────────────────────────────────────
    recommendations: list[str] = []

    top_missing = missing_keywords[:5]
    if top_missing:
        recommendations.append(
            f"Add these missing keywords where applicable: {', '.join(top_missing)}."
        )

    skills_sec = next((s for s in section_scores if s.section == "Skills"), None)
    if skills_sec and skills_sec.score < 60:
        recommendations.append(
            "Expand your Skills section with technologies listed in the job description."
        )

    exp_sec = next((s for s in section_scores if s.section == "Experience"), None)
    if exp_sec and exp_sec.score < 60:
        recommendations.append(
            "Weave more JD keywords naturally into your Experience bullet points."
        )

    if match_pct < 50:
        recommendations.append(
            "Your overall keyword match is below 50%. Tailor your resume specifically "
            "for this role by mirroring the language used in the job description."
        )

    if not recommendations:
        recommendations.append(
            "Your resume aligns well with this job description. "
            "Focus on quantifying achievements to stand out further."
        )

    passes = overall_score >= settings.ATS_PASSING_SCORE

    return ATSResult(
        overall_score=overall_score,
        match_level=_score_to_level(overall_score),
        job_title=job_title,
        keyword_matches=keyword_matches,
        matched_count=matched_count,
        total_keywords=total_keywords,
        match_percentage=match_pct,
        section_scores=section_scores,
        missing_keywords=missing_keywords,
        recommendations=recommendations,
        passes_ats_threshold=passes,
    )


# ---------------------------------------------------------------------------
# LLM enrichment
# ---------------------------------------------------------------------------

def _llm_available() -> bool:
    provider = settings.AI_PROVIDER.lower()
    if provider == "gemini":
        return bool(settings.GEMINI_API_KEY)
    if provider == "openai":
        return bool(settings.OPENAI_API_KEY)
    return False


def _build_ats_prompt(
    base: ATSResult,
    resume_text: str,
    job_description: str,
    job_title: Optional[str],
) -> str:
    missing_sample = ", ".join(base.missing_keywords[:10]) or "none"
    title_line = f"Job Title: {job_title}" if job_title else ""

    return f"""You are an expert ATS consultant. Analyse the resume against the job description and return ONLY a valid JSON object — no markdown, no prose.

{title_line}

## Job Description (truncated to 3000 chars)
{job_description[:3000]}

## Resume Text (truncated to 3000 chars)
{resume_text[:3000]}

## Local Pre-Analysis
- Keyword match: {base.match_percentage}% ({base.matched_count}/{base.total_keywords})
- Missing keywords (sample): {missing_sample}
- Overall score: {base.overall_score}/100

## Your Task
Return a JSON object with EXACTLY these keys:
{{
  "score_adjustment": <integer -10 to +10>,
  "recommendations": [<3 to 5 specific, actionable strings tailored to THIS job>],
  "additional_missing_keywords": [<keywords you spotted that local analysis missed>]
}}

Rules:
- Each recommendation must be a single sentence under 30 words.
- "additional_missing_keywords" should be an empty list [] if nothing is missing.
- Return raw JSON only. Do NOT wrap in ```json``` or add extra text.
"""


async def _call_gemini(prompt: str) -> str:
    import google.generativeai as genai  # type: ignore
    import asyncio

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
    return response.text


async def _call_openai(prompt: str) -> str:
    from openai import AsyncOpenAI  # type: ignore

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    chat = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=500,
    )
    return chat.choices[0].message.content or ""


async def _llm_enrich(
    base: ATSResult,
    resume_text: str,
    job_description: str,
    job_title: Optional[str],
) -> ATSResult:
    """Call the configured LLM and overlay its output onto the local result."""
    prompt = _build_ats_prompt(base, resume_text, job_description, job_title)

    provider = settings.AI_PROVIDER.lower()
    if provider == "gemini":
        raw_json = await _call_gemini(prompt)
    elif provider == "openai":
        raw_json = await _call_openai(prompt)
    else:
        return base

    try:
        cleaned = re.sub(r"```(?:json)?|```", "", raw_json).strip()
        data = json.loads(cleaned)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning("ATS LLM returned invalid JSON: %s | raw=%s", exc, raw_json[:200])
        return base

    # Apply score adjustment
    adjustment = int(data.get("score_adjustment", 0))
    new_score = max(0, min(100, base.overall_score + adjustment))

    # Merge recommendations — prefer LLM when available
    llm_recs: list[str] = data.get("recommendations", [])
    final_recs = llm_recs if llm_recs else base.recommendations

    # Merge missing keywords — union of local + LLM additions
    extra_missing: list[str] = data.get("additional_missing_keywords", [])
    all_missing = list(dict.fromkeys(base.missing_keywords + extra_missing))  # dedup, order-preserving

    return ATSResult(
        overall_score=new_score,
        match_level=_score_to_level(new_score),
        job_title=base.job_title,
        keyword_matches=base.keyword_matches,
        matched_count=base.matched_count,
        total_keywords=base.total_keywords,
        match_percentage=base.match_percentage,
        section_scores=base.section_scores,
        missing_keywords=all_missing,
        recommendations=final_recs,
        passes_ats_threshold=new_score >= settings.ATS_PASSING_SCORE,
    )
