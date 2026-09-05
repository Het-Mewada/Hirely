from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.candidate import Candidate
from app.repositories.base import TenantRepository
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateOut

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

@router.get("", response_model=List[CandidateOut])
def list_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all candidates for caller's organization.
    Accessible to all authenticated tenant users.
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
