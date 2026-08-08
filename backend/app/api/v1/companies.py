from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status
)

from app.api.deps import get_current_user
from app.database import get_database

from app.schemas.company import (
    CompanyCreate,
    CompanyListResponse,
    CompanyResponse,
    CompanyUpdate
)

from app.services.company_service import CompanyService


router = APIRouter()


# Dependency for Company Service
def get_company_service():

    database = get_database()

    if database is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is unavailable"
        )

    return CompanyService(database)



# GET ALL COMPANIES
@router.get(
    "/",
    response_model=CompanyListResponse,
    summary="List companies"
)
async def list_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    service: CompanyService = Depends(get_company_service)
):

    items, total = await service.list(skip, limit)

    return {
        "items": items,
        "total": total
    }



# GET SINGLE COMPANY
@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
    summary="Get company by ID"
)
async def get_company(
    company_id: str,
    service: CompanyService = Depends(get_company_service)
):

    return await service.get(company_id)



# CREATE COMPANY
@router.post(
    "/",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create company"
)
async def create_company(
    payload: CompanyCreate,
    service: CompanyService = Depends(get_company_service),
    current_user: dict = Depends(get_current_user)
):

    return await service.create(payload)



# UPDATE COMPANY
@router.patch(
    "/{company_id}",
    response_model=CompanyResponse,
    summary="Update company"
)
async def update_company(
    company_id: str,
    payload: CompanyUpdate,
    service: CompanyService = Depends(get_company_service),
    current_user: dict = Depends(get_current_user)
):

    return await service.update(
        company_id,
        payload
    )



# DELETE COMPANY
@router.delete(
    "/{company_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete company"
)
async def delete_company(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
    current_user: dict = Depends(get_current_user)
):

    await service.delete(company_id)

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )