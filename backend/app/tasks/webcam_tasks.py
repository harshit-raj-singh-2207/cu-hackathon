import asyncio
import logging
from app.celery_app import celery_app
from app.database import get_database, connect_to_mongo, db_helper

logger = logging.getLogger("WebcamTasks")

async def run_summary_generation(session_id: str):
    """Async implementation of report generation."""
    if db_helper.client is None:
        logger.info("Connecting to MongoDB in worker context...")
        await connect_to_mongo()

    db = get_database()
    if db is None:
        raise ConnectionError("Database is not connected")

    from app.services.webcam_analysis_service import WebcamAnalysisService
    service = WebcamAnalysisService(db)
    summary = await service.generate_final_summary_internal(session_id)
    logger.info(f"Summary successfully generated for session {session_id}: {summary}")
    return summary


@celery_app.task(name="app.tasks.webcam_tasks.generate_session_summary")
def generate_session_summary(session_id: str):
    """Celery task to compile report card metrics asynchronously."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(run_summary_generation(session_id))
