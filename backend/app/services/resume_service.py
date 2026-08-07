from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Final
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.models.resume import ResumeDB


class ResumeService:
    """Manage one locally stored PDF or DOCX resume per authenticated user."""

    MAX_FILE_SIZE_BYTES: Final[int] = 5 * 1024 * 1024
    CHUNK_SIZE: Final[int] = 1024 * 1024
    ALLOWED_TYPES: Final[dict[str, str]] = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    def __init__(self, database, storage_dir: Path | None = None):
        self.collection = database["resumes"]
        self.storage_dir = storage_dir or Path(__file__).resolve().parents[2] / "static" / "resumes"

    @staticmethod
    def _serialize(document: dict) -> dict:
        result = dict(document)
        result["id"] = str(result.pop("_id"))
        return result

    def _validate_file(self, file: UploadFile) -> tuple[str, str]:
        original_name = Path(file.filename or "").name
        if not original_name:
            raise HTTPException(status_code=400, detail="A resume file is required")

        extension = Path(original_name).suffix.lower()
        expected_type = self.ALLOWED_TYPES.get(extension)
        if not expected_type:
            raise HTTPException(status_code=415, detail="Only PDF and DOCX resume files are supported")

        if file.content_type and file.content_type not in {expected_type, "application/octet-stream"}:
            raise HTTPException(status_code=415, detail="The file content type does not match its extension")
        return original_name, extension

    async def _write_file(self, file: UploadFile, destination: Path) -> int:
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        temporary_path = destination.with_suffix(destination.suffix + ".uploading")
        size = 0
        try:
            with temporary_path.open("wb") as output:
                while chunk := await file.read(self.CHUNK_SIZE):
                    size += len(chunk)
                    if size > self.MAX_FILE_SIZE_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                            detail="Resume must not exceed 5 MB",
                        )
                    output.write(chunk)
            os.replace(temporary_path, destination)
            return size
        except Exception:
            temporary_path.unlink(missing_ok=True)
            destination.unlink(missing_ok=True)
            raise
        finally:
            await file.close()

    async def upload(self, user_id: str, file: UploadFile, *, replace: bool = False) -> dict:
        original_name, extension = self._validate_file(file)
        existing = await self.collection.find_one({"user_id": user_id})
        if existing and not replace:
            raise HTTPException(status_code=409, detail="A resume already exists. Use PUT /resume/replace to replace it")

        file_name = f"{user_id}_{uuid4().hex}{extension}"
        destination = self.storage_dir / file_name
        file_size = await self._write_file(file, destination)
        document = ResumeDB(
            user_id=user_id,
            file_name=file_name,
            original_name=original_name,
            file_type=self.ALLOWED_TYPES[extension],
            file_size=file_size,
            upload_date=datetime.now(timezone.utc),
            storage_path=f"/static/resumes/{file_name}",
            upload_status="uploaded",
        ).model_dump(exclude={"id"})

        try:
            await self.collection.replace_one({"user_id": user_id}, document, upsert=True)
        except Exception:
            destination.unlink(missing_ok=True)
            raise HTTPException(status_code=500, detail="Could not save resume metadata")

        if existing:
            self._path_for(existing).unlink(missing_ok=True)
        stored = await self.collection.find_one({"user_id": user_id})
        return self._serialize(stored)

    async def get(self, user_id: str) -> dict:
        resume = await self.collection.find_one({"user_id": user_id})
        if not resume:
            raise HTTPException(status_code=404, detail="No resume found for this user")
        if not self._path_for(resume).is_file():
            raise HTTPException(status_code=404, detail="Resume file is unavailable")
        return self._serialize(resume)

    async def get_file(self, user_id: str) -> tuple[Path, dict]:
        metadata = await self.get(user_id)
        return self._path_for(metadata), metadata

    async def delete(self, user_id: str) -> None:
        resume = await self.collection.find_one({"user_id": user_id})
        if not resume:
            raise HTTPException(status_code=404, detail="No resume found for this user")
        await self.collection.delete_one({"_id": resume["_id"]})
        self._path_for(resume).unlink(missing_ok=True)

    def _path_for(self, resume: dict) -> Path:
        """Use a generated file name only; never trust a stored path."""
        return self.storage_dir / Path(resume["file_name"]).name
