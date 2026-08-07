from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

# ─── Module-level client holder ────────────────────────────────────────────────
# Populated on startup, torn down on shutdown (see lifespan in main.py)
_client: AsyncIOMotorClient | None = None


# ─── Lifecycle helpers (called from main.py lifespan) ──────────────────────────

async def connect_db() -> None:
    """Create the Motor client and verify the connection."""
    global _client
    try:
        _client = AsyncIOMotorClient(settings.MONGODB_URL)
        await _client.admin.command("ping")
        print(f"Connected to MongoDB database: {settings.DATABASE_NAME}")
    except Exception as e:
        print(f"Warning: Primary MongoDB connection failed ({e}). Attempting local fallback...")
        try:
            _client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
            await _client.admin.command("ping")
            print("Connected to fallback local MongoDB database.")
        except Exception as err:
            print(f"Offline Mode: All MongoDB database connections failed ({err}). Database operations will be mocked.")
            _client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=1000)


async def close_db() -> None:
    """Close the Motor client gracefully."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        print("MongoDB connection closed.")


# ─── Dependency / accessor ─────────────────────────────────────────────────────

def get_database() -> AsyncIOMotorDatabase:
    """
    Return the active database instance.

    Usage in a route:
        db: AsyncIOMotorDatabase = Depends(get_database)

    Usage outside a route (services, etc.):
        from app.database import get_database
        db = get_database()
    """
    if _client is None:
        raise RuntimeError(
            "Database client is not initialised. "
            "Make sure connect_db() is called during app startup."
        )
    return _client[settings.DATABASE_NAME]


# ─── Collection accessors ──────────────────────────────────────────────────────
# Thin helpers so services never hard-code collection names.

def get_users_collection():
    return get_database()["users"]


def get_resumes_collection():
    return get_database()["resumes"]


def get_ats_results_collection():
    return get_database()["ats_results"]


def get_interviews_collection():
    return get_database()["interviews"]


def get_coding_collection():
    return get_database()["coding_sessions"]


def get_jobs_collection():
    return get_database()["jobs"]


def get_analytics_collection():
    return get_database()["analytics"]
