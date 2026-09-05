import os
import pytest
from fastapi import HTTPException, status, UploadFile
from io import BytesIO
from app.repositories.base import TenantRepository
from app.models.candidate import Candidate
from app.services.storage import StorageService
from app.api.v1.candidates import download_candidate_resume

def test_upload_valid_pdf_resume(db_session, user_org_a_admin, candidate_org_a):
    """
    VERIFIES PDF RESUME FILE UPLOAD:
    Saves file to tenant-isolated path: uploads/{org_id}/resumes/{candidate_id}_{filename}.
    """
    mock_pdf_content = b"%PDF-1.5 Sample Resume Document Content for Test"
    file = UploadFile(filename="alex_resume.pdf", file=BytesIO(mock_pdf_content))

    rel_url, abs_path = StorageService.save_candidate_resume(
        organization_id=user_org_a_admin.organization_id,
        candidate_id=candidate_org_a.id,
        file=file,
        content=mock_pdf_content
    )

    assert rel_url == f"/api/v1/candidates/{candidate_org_a.id}/resume"
    assert os.path.exists(abs_path)
    assert str(user_org_a_admin.organization_id) in abs_path
    assert str(candidate_org_a.id) in abs_path

    # Clean up test file on disk
    if os.path.exists(abs_path):
        os.remove(abs_path)

def test_upload_invalid_file_extension():
    """
    VERIFIES FILE EXTENSION VALIDATION:
    Rejects disallowed file types (.exe, .sh, .bat).
    """
    file = UploadFile(filename="malicious_script.exe", file=BytesIO(b"executable content"))
    
    with pytest.raises(HTTPException) as exc_info:
        StorageService.validate_file(file, b"executable content")

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid file type" in exc_info.value.detail

def test_upload_oversized_file():
    """
    VERIFIES FILE SIZE VALIDATION:
    Rejects files exceeding 10MB limit.
    """
    oversized_content = b"X" * (11 * 1024 * 1024)  # 11 MB
    file = UploadFile(filename="large_resume.pdf", file=BytesIO(oversized_content))

    with pytest.raises(HTTPException) as exc_info:
        StorageService.validate_file(file, oversized_content)

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "exceeds maximum allowed limit" in exc_info.value.detail

def test_download_resume_tenant_isolation(db_session, user_org_a_admin, user_org_b_admin, candidate_org_a):
    """
    VERIFIES TENANT ISOLATION FOR RESUME DOWNLOADS:
    Candidate A belongs to Org A.
    Org B user attempting download receives HTTP 404.
    """
    # Org A candidate has resume_url set
    cand_repo_a = TenantRepository(Candidate, db_session, user_org_a_admin.organization_id)
    cand_repo_a.update(candidate_org_a.id, {"resume_url": f"/api/v1/candidates/{candidate_org_a.id}/resume"})

    # Org B user attempting download receives 404
    with pytest.raises(HTTPException) as exc_info:
        download_candidate_resume(candidate_id=candidate_org_a.id, current_user=user_org_b_admin, db=db_session)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

def test_download_resume_filename_format(db_session, user_org_a_admin, candidate_org_a):
    """
    VERIFIES DOWNLOAD FILENAME FORMAT:
    Ensures downloaded filename is formatted as candidate-email_Resume.ext.
    """
    mock_pdf_content = b"%PDF-1.5 Sample Resume"
    file = UploadFile(filename="original_cv.pdf", file=BytesIO(mock_pdf_content))
    rel_url, abs_path = StorageService.save_candidate_resume(
        organization_id=user_org_a_admin.organization_id,
        candidate_id=candidate_org_a.id,
        file=file,
        content=mock_pdf_content
    )
    cand_repo_a = TenantRepository(Candidate, db_session, user_org_a_admin.organization_id)
    cand_repo_a.update(candidate_org_a.id, {"resume_url": rel_url})

    response = download_candidate_resume(candidate_id=candidate_org_a.id, current_user=user_org_a_admin, db=db_session)
    assert response.filename == f"{candidate_org_a.email}_Resume.pdf"

    if os.path.exists(abs_path):
        os.remove(abs_path)

