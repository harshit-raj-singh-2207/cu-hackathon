from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)

from app.api.deps import get_current_user
from app.database import get_database

from app.controllers.communication_analysis_controller import (
    CommunicationAnalysisController
)

from app.schemas.communication_analysis import (
    CommunicationAnalysisCreate,
    CommunicationAnalysisUpdate,
    CommunicationAnalysisResponse,
    CommunicationAnalysisStatsResponse,
)


router = APIRouter()



def get_controller():

    db = get_database()

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable",
        )

    return CommunicationAnalysisController(db)



# CREATE ANALYSIS
@router.post(
    "",
    response_model=CommunicationAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new communication analysis",
)
async def create_analysis(
    payload: CommunicationAnalysisCreate,
    current_user: dict = Depends(get_current_user),
    ctrl: CommunicationAnalysisController = Depends(get_controller),
):

    return await ctrl.create_analysis(
        current_user["id"],
        payload
    )



# GET LATEST ANALYSIS
@router.get(
    "/latest",
    response_model=CommunicationAnalysisResponse,
    summary="Retrieve latest communication analysis",
)
async def get_latest_analysis(
    current_user: dict = Depends(get_current_user),
    ctrl: CommunicationAnalysisController = Depends(get_controller),
):

    return await ctrl.get_latest_analysis(
        current_user["id"]
    )



# GET STATS
@router.get(
    "/stats",
    response_model=CommunicationAnalysisStatsResponse,
    summary="Get communication analysis statistics",
)
async def get_statistics(
    current_user: dict = Depends(get_current_user),
    ctrl: CommunicationAnalysisController = Depends(get_controller),
):

    return await ctrl.get_statistics(
        current_user["id"]
    )



# GET SINGLE ANALYSIS
@router.get(
    "/{analysis_id}",
    response_model=CommunicationAnalysisResponse,
    summary="Retrieve communication analysis record",
)
async def get_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CommunicationAnalysisController = Depends(get_controller),
):

    return await ctrl.get_analysis(
        analysis_id,
        current_user["id"]
    )



# GET ALL HISTORY
@router.get(
    "",
    summary="List communication analysis history",
)
async def list_analyses(
    interview_id: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None),

    sort_by: str = Query(
        "created_at"
    ),

    sort_order: str = Query(
        "desc"
    ),

    page: int = Query(
        1,
        ge=1
    ),

    limit: int = Query(
        20,
        ge=1,
        le=100
    ),

    current_user: dict = Depends(get_current_user),
    ctrl: CommunicationAnalysisController = Depends(get_controller),
):

    items, total = await ctrl.list_analyses(
        user_id=current_user["id"],
        interview_id=interview_id,
        session_id=session_id,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
    }



# UPDATE ANALYSIS
@router.put(
    "/{analysis_id}",
    response_model=CommunicationAnalysisResponse,
    summary="Update communication analysis",
)
async def update_analysis(
    analysis_id: str,
    payload: CommunicationAnalysisUpdate,
    current_user: dict = Depends(get_current_user),
    ctrl: CommunicationAnalysisController = Depends(get_controller),
):

    return await ctrl.update_analysis(
        analysis_id,
        current_user["id"],
        payload
    )



# DELETE ANALYSIS
@router.delete(
    "/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete communication analysis",
)
async def delete_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    ctrl: CommunicationAnalysisController = Depends(get_controller),
):

    await ctrl.delete_analysis(
        analysis_id,
        current_user["id"]
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )