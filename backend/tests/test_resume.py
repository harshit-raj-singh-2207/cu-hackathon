import io
import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.services.resume_service import ResumeService


class FakeCollection:
    def __init__(self):
        self.document = None

    async def find_one(self, query):
        if self.document and self.document.get("user_id") == query.get("user_id"):
            return dict(self.document)
        return None

    async def replace_one(self, query, document, upsert=False):
        self.document = {"_id": "resume-id", **document}

    async def delete_one(self, query):
        self.document = None


class FakeDatabase:
    def __init__(self):
        self.collection = FakeCollection()

    def __getitem__(self, name):
        return self.collection


class ResumeServiceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp_dir = tempfile.TemporaryDirectory(dir=Path.cwd())
        self.service = ResumeService(FakeDatabase(), Path(self.temp_dir.name))

    async def asyncTearDown(self):
        self.temp_dir.cleanup()

    @staticmethod
    def upload_file(name, content, content_type):
        return UploadFile(filename=name, file=io.BytesIO(content), headers={"content-type": content_type})

    async def test_upload_replace_get_and_delete(self):
        uploaded = await self.service.upload("user-1", self.upload_file("cv.pdf", b"%PDF-test", "application/pdf"))
        self.assertEqual(uploaded["original_name"], "cv.pdf")
        self.assertEqual(uploaded["upload_status"], "uploaded")

        with self.assertRaises(HTTPException) as conflict:
            await self.service.upload("user-1", self.upload_file("again.pdf", b"%PDF-test", "application/pdf"))
        self.assertEqual(conflict.exception.status_code, 409)

        replaced = await self.service.upload("user-1", self.upload_file("cv.docx", b"docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), replace=True)
        self.assertEqual(replaced["original_name"], "cv.docx")
        file_path, metadata = await self.service.get_file("user-1")
        self.assertTrue(file_path.is_file())
        self.assertEqual(metadata["file_type"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document")

        await self.service.delete("user-1")
        with self.assertRaises(HTTPException) as missing:
            await self.service.get("user-1")
        self.assertEqual(missing.exception.status_code, 404)

    async def test_rejects_unsupported_and_oversized_files(self):
        with self.assertRaises(HTTPException) as unsupported:
            await self.service.upload("user-2", self.upload_file("cv.txt", b"text", "text/plain"))
        self.assertEqual(unsupported.exception.status_code, 415)

        large_content = b"a" * (self.service.MAX_FILE_SIZE_BYTES + 1)
        with self.assertRaises(HTTPException) as oversized:
            await self.service.upload("user-3", self.upload_file("cv.pdf", large_content, "application/pdf"))
        self.assertEqual(oversized.exception.status_code, 413)
