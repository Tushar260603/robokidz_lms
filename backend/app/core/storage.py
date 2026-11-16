import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException, status
from app.core.config import get_settings

settings = get_settings()

ALLOWED_EXTENSIONS = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "txt": "text/plain",
}


class LocalStorage:
    def __init__(self, upload_dir: str | None = None):
        self.upload_dir = upload_dir or settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    def get_path(self, stored_name: str) -> str:
        # Sanitize against path traversal attacks
        safe_name = os.path.basename(stored_name)
        return os.path.join(self.upload_dir, safe_name)

    async def save(self, file: UploadFile) -> tuple[str, str, int]:
        """
        Validates extension and content-type, enforces MAX_UPLOAD_MB,
        saves using uuid4().hex + ext, and returns:
        (stored_name, content_type, size_bytes).
        """
        filename = file.filename or ""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '.{ext}' is not supported. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS.keys()))}"
            )

        expected_mime = ALLOWED_EXTENSIONS[ext]
        # In case the browser sends generic octet-stream or slight variation, ensure it's not disguised
        declared_mime = (file.content_type or "").lower()
        if declared_mime and declared_mime != expected_mime and declared_mime != "application/octet-stream":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"MIME type '{file.content_type}' does not match expected type for '.{ext}'"
            )

        stored_name = f"{uuid.uuid4().hex}.{ext}"
        destination = self.get_path(stored_name)

        max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
        size_bytes = 0

        try:
            async with aiofiles.open(destination, "wb") as out_file:
                while chunk := await file.read(1024 * 64):  # 64KB chunks
                    size_bytes += len(chunk)
                    if size_bytes > max_bytes:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File size exceeds limit of {settings.MAX_UPLOAD_MB}MB"
                        )
                    await out_file.write(chunk)
        except Exception:
            self.delete(stored_name)
            raise

        mime_type = declared_mime if declared_mime and declared_mime != "application/octet-stream" else expected_mime
        return stored_name, mime_type, size_bytes

    def delete(self, stored_name: str) -> bool:
        """Deletes file from disk safely."""
        path = self.get_path(stored_name)
        if os.path.exists(path):
            try:
                os.remove(path)
                return True
            except OSError:
                return False
        return False


storage = LocalStorage()
