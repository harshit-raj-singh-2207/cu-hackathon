from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResumeResponse(BaseModel):
    """Public metadata for the authenticated user's current resume."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    file_name: str
    original_name: str
    file_type: str
    file_size: int = Field(ge=1)
    upload_date: datetime
    storage_path: str
    upload_status: str


class ResumeUploadResponse(BaseModel):
    message: str
    resume: ResumeResponse


class ResumeDeleteResponse(BaseModel):
    message: str
