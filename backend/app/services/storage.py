import os
import re
from uuid import UUID
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

class StorageService:
    """
    Tenant-Isolated Resume File Storage Service.
    Enforces per-tenant path isolation, file extension restrictions, and size limits.
    """
    
    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        # Remove unsafe characters
        filename = os.path.basename(filename)
        filename = re.sub(r'[^\w\.-]', '_', filename)
        return filename

    @classmethod
    def validate_file(cls, file: UploadFile, content: bytes) -> None:
        # 1. Validate file extension
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{ext}'. Allowed extensions are: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        # 2. Validate file size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size ({len(content) / (1024*1024):.2f} MB) exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB} MB."
            )

    @classmethod
    def get_tenant_resume_dir(cls, organization_id: UUID) -> str:
        dir_path = os.path.join(settings.STORAGE_DIR, str(organization_id), "resumes")
        os.makedirs(dir_path, exist_ok=True)
        return dir_path

    @classmethod
    def save_candidate_resume(cls, organization_id: UUID, candidate_id: UUID, file: UploadFile, content: bytes) -> Tuple[str, str]:
        """
        Saves resume file under uploads/{organization_id}/resumes/{candidate_id}_{filename}.
        Returns (relative_path, absolute_path).
        """
        cls.validate_file(file, content)
        
        tenant_dir = cls.get_tenant_resume_dir(organization_id)
        safe_filename = cls._sanitize_filename(file.filename or "resume.pdf")
        stored_filename = f"{candidate_id}_{safe_filename}"
        
        abs_path = os.path.join(tenant_dir, stored_filename)
        
        with open(abs_path, "wb") as f:
            f.write(content)
            
        relative_path = f"/api/v1/candidates/{candidate_id}/resume"
        return relative_path, abs_path

    @classmethod
    def get_resume_file_path(cls, organization_id: UUID, candidate_id: UUID, resume_path_or_url: str) -> str:
        """
        Retrieves local absolute file path for a candidate resume, ensuring tenant path boundaries.
        """
        tenant_dir = cls.get_tenant_resume_dir(organization_id)
        
        # Look for files matching the candidate ID in the tenant resume directory
        if os.path.exists(tenant_dir):
            for fname in os.listdir(tenant_dir):
                if fname.startswith(str(candidate_id)):
                    return os.path.join(tenant_dir, fname)
                    
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found on disk."
        )
