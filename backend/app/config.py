from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    # ─── App ───────────────────────────────────────────────────────────────
    PROJECT_NAME: str = "CareerCopilot AI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        """Safely handle generic DEBUG values inherited from the host environment."""
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "development"}:
                return True
            if normalized in {
                "0",
                "false",
                "no",
                "off",
                "warn",
                "warning",
                "error",
                "info",
                "release",
                "production",
            }:
                return False
        return value

    # ─── MongoDB ───────────────────────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "careercopilot"

    # ─── JWT / Auth ────────────────────────────────────────────────────────
    SECRET_KEY: str = "ai-career-copilot-super-secret-jwt-signing-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── AI / LLM ──────────────────────────────────────────────────────────
    # Google Gemini (primary)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # OpenAI (fallback / optional)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Which provider to use: "gemini" | "openai"
    AI_PROVIDER: str = "gemini"

    # ─── File Uploads ──────────────────────────────────────────────────────
    # Max resume file size in bytes (default 5 MB)
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024
    ALLOWED_RESUME_EXTENSIONS: List[str] = [".pdf", ".docx", ".doc"]
    RESUME_UPLOAD_DIR: str = "static/resumes"
    GENERAL_UPLOAD_DIR: str = "static/uploads"

    # ─── CORS ──────────────────────────────────────────────────────────────
    # Comma-separated origins in .env, e.g. CORS_ORIGINS=http://localhost:3000,https://myapp.com
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",   # React dev server
        "http://localhost:5173",   # Vite dev server
    ]

    # ─── ATS Scoring ───────────────────────────────────────────────────────
    # Minimum ATS score to consider a resume "good" (0-100)
    ATS_PASSING_SCORE: int = 70

    # ─── Pydantic Settings ─────────────────────────────────────────────────
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


# Single shared instance — import this everywhere
settings = Settings()
