import os
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.candidate import Candidate
from app.models.audit_log import AuditLog
from app.repositories.base import TenantRepository
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateOut
from app.services.storage import StorageService
from app.services.parser import ResumeParserService

router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.post("", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
def create_candidate(
    candidate_in: CandidateCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """
    Create a new candidate profile in caller's organization.
    Role-gated: ADMIN and RECRUITER.
    """
    repo = TenantRepository(Candidate, db, current_user.organization_id)
    
    # Check if candidate email already exists in tenant
    existing = repo.filter_by(email=candidate_in.email.lower())
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Candidate with email '{candidate_in.email}' already exists in your organization."
        )

    data = candidate_in.model_dump()
    data["email"] = data["email"].lower()
    candidate = repo.create(data)
    return CandidateOut.model_validate(candidate)

@router.post("/{candidate_id}/resume", response_model=CandidateOut)
async def upload_candidate_resume(
    candidate_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """
    Upload a resume file (PDF, DOCX, TXT) for a candidate.
    Stored per-tenant under uploads/{organization_id}/resumes/.
    Extracts raw text (Candidate.resume_text) and flags scanned PDFs for manual review.
    Updates Candidate.resume_url field and logs audit event.
    """
    repo = TenantRepository(Candidate, db, current_user.organization_id)
    candidate = repo.get(candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID '{candidate_id}' not found in your organization."
        )

    content = await file.read()
    relative_url, abs_path = StorageService.save_candidate_resume(
        organization_id=current_user.organization_id,
        candidate_id=candidate_id,
        file=file,
        content=content
    )

    # Extract text from uploaded resume PDF/TXT
    extracted_text, needs_manual_review = ResumeParserService.extract_text_from_file(
        filename=file.filename,
        content=content
    )

    # Update candidate resume_url and resume_text
    updated_candidate = repo.update(
        candidate_id,
        {
            "resume_url": relative_url,
            "resume_text": extracted_text
        }
    )

    # Log audit event
    audit_log = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="candidate.resume_uploaded",
        entity_type="Candidate",
        entity_id=str(candidate_id),
        details={
            "filename": file.filename,
            "size_bytes": len(content),
            "text_length": len(extracted_text),
            "needs_manual_review": needs_manual_review
        }
    )
    db.add(audit_log)
    db.commit()

    return CandidateOut.model_validate(updated_candidate)

@router.get("/{candidate_id}/resume")
def download_candidate_resume(
    candidate_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download a candidate's resume file.
    Enforces tenant isolation: Returns 404 if candidate does not exist in caller's organization.
    """
    repo = TenantRepository(Candidate, db, current_user.organization_id)
    candidate = repo.get(candidate_id)
    if not candidate or not candidate.resume_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume for candidate ID '{candidate_id}' not found."
        )

    abs_path = StorageService.get_resume_file_path(
        organization_id=current_user.organization_id,
        candidate_id=candidate_id,
        resume_path_or_url=candidate.resume_url
    )

    _, ext = os.path.splitext(abs_path)
    download_filename = f"{candidate.email}_Resume{ext}"
    return FileResponse(
        path=abs_path,
        filename=download_filename,
        media_type="application/octet-stream"
    )

@router.get("", response_model=List[CandidateOut])
def list_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all candidates for caller's organization.
    """
    repo = TenantRepository(Candidate, db, current_user.organization_id)
    candidates = repo.list(skip=skip, limit=limit)
    return [CandidateOut.model_validate(c) for c in candidates]

@router.get("/{candidate_id}", response_model=CandidateOut)
def get_candidate(
    candidate_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get single candidate by ID. Enforces tenant isolation.
    """
    repo = TenantRepository(Candidate, db, current_user.organization_id)
    candidate = repo.get(candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID '{candidate_id}' not found."
        )
    return CandidateOut.model_validate(candidate)

@router.patch("/{candidate_id}", response_model=CandidateOut)
def update_candidate(
    candidate_id: UUID,
    candidate_in: CandidateUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """
    Update candidate details (name, email, phone, resume_url).
    """
    repo = TenantRepository(Candidate, db, current_user.organization_id)
    update_data = candidate_in.model_dump(exclude_unset=True)
    if not update_data:
        candidate = repo.get(candidate_id)
        if not candidate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")
        return CandidateOut.model_validate(candidate)

    if "email" in update_data and update_data["email"]:
        update_data["email"] = update_data["email"].lower()

    updated = repo.update(candidate_id, update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID '{candidate_id}' not found or cannot be modified."
        )
    return CandidateOut.model_validate(updated)

@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    candidate_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """
    Delete candidate profile.
    """
    repo = TenantRepository(Candidate, db, current_user.organization_id)
    success = repo.delete(candidate_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID '{candidate_id}' not found or cannot be deleted."
        )
    return None
