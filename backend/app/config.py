"""
Application configuration — loaded from environment / .env file.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the project root (backend/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


class _Settings:
    """Centralised settings object consumed as ``from app.config import settings``."""

    # ── API ─────────────────────────────────────────────────────────────────
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "CareerCopilot Backend"

    # ── MongoDB ─────────────────────────────────────────────────────────────
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "careercopilot")

    # ── JWT / Auth ──────────────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production-super-secret-key-2024")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # ── AI / LLM ────────────────────────────────────────────────────────────
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")           # "gemini" | "openai"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # ── ATS ─────────────────────────────────────────────────────────────────
    ATS_PASSING_SCORE: int = int(os.getenv("ATS_PASSING_SCORE", "70"))

    # ── CORS ────────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")

    # ── Static / uploads ────────────────────────────────────────────────────
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(Path(__file__).resolve().parent.parent / "static" / "uploads"))
    RESUME_DIR: str = os.getenv("RESUME_DIR", str(Path(__file__).resolve().parent.parent / "static" / "resumes"))


settings = _Settings()
