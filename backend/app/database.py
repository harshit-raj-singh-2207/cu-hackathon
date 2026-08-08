"""
Async MongoDB connection via Motor.

Usage across the app::

    from app.database import get_database
    db = get_database()
    users = await db["users"].find_one({"email": email})
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    """Open the Motor client and select the database.  Called once at startup."""
    global _client, _database
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    _database = _client[settings.MONGODB_DB_NAME]

    # Create indexes that the app depends on
    try:
        await _database["users"].create_index("email", unique=True)
        await _database["token_blacklist"].create_index("expires_at", expireAfterSeconds=0, name="token_blacklist_ttl")
    except Exception as e:
        print(f"[!] Index creation notice: {e}")

    print(f"[+] Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_mongo_connection() -> None:
    """Gracefully shut down the Motor client.  Called once at shutdown."""
    global _client, _database
    if _client is not None:
        _client.close()
        _client = None
        _database = None
        print("[-] MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Return the active database handle (non-async, used as a synchronous getter)."""
    if _database is None:
        raise RuntimeError(
            "Database is not initialised — call connect_to_mongo() first "
            "(this should happen automatically at FastAPI startup)."
        )
    return _database

def get_resumes_collection():
    return get_database()["resumes"]

def get_ats_results_collection():
    return get_database()["ats_results"]

class DBHelper:
    def get_db(self):
        return get_database()

db_helper = DBHelper()
