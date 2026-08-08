from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from app.api.deps import get_current_user
from app.database import get_database
from app.schemas.job_role import ExperienceLevel, JobRoleCreate, JobRoleListResponse, JobRoleResponse, JobRoleUpdate, SortField, SortOrder
from app.services.job_role_service import JobRoleService

router = APIRouter()

def get_job_role_service():
    database = get_database()
    if database is None: raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection is unavailable")
    return JobRoleService(database)

@router.post("/", response_model=JobRoleResponse, status_code=status.HTTP_201_CREATED, summary="Create a job role", description="Creates a job role. Role names are unique, case-insensitively.", responses={409: {"description": "Duplicate role name"}, 422: {"description": "Validation error"}})
async def create_job_role(payload: JobRoleCreate, service: JobRoleService = Depends(get_job_role_service), _: dict = Depends(get_current_user)):
    return await service.create(payload)

@router.get("/", response_model=JobRoleListResponse, summary="List job roles", description="Returns paginated job roles with optional name search, category and experience filters, and sorting.")
async def list_job_roles(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), search: Optional[str] = Query(None, min_length=1), category: Optional[str] = Query(None, min_length=1), experience_level: Optional[ExperienceLevel] = None, sort_by: SortField = "role_name", sort_order: SortOrder = "asc", service: JobRoleService = Depends(get_job_role_service)):
    items, total = await service.list(page=page, page_size=page_size, search=search, category=category, experience_level=experience_level, sort_by=sort_by, sort_order=sort_order)
    return {"items": items, "total": total, "page": page, "page_size": page_size}

@router.get("/{role_id}", response_model=JobRoleResponse, summary="Get a job role", description="Returns one job role by its stable role ID.", responses={404: {"description": "Role not found"}})
async def get_job_role(role_id: str, service: JobRoleService = Depends(get_job_role_service)): return await service.get(role_id)

@router.put("/{role_id}", response_model=JobRoleResponse, summary="Update a job role", description="Updates one or more job-role fields.", responses={400: {"description": "No fields supplied"}, 404: {"description": "Role not found"}, 409: {"description": "Duplicate role name"}})
async def update_job_role(role_id: str, payload: JobRoleUpdate, service: JobRoleService = Depends(get_job_role_service), _: dict = Depends(get_current_user)): return await service.update(role_id, payload)

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a job role", description="Permanently removes a job role.", responses={404: {"description": "Role not found"}})
async def delete_job_role(role_id: str, service: JobRoleService = Depends(get_job_role_service), _: dict = Depends(get_current_user)):
    await service.delete(role_id); return Response(status_code=status.HTTP_204_NO_CONTENT)