from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.job_posting import JobPosting, JobStatus
from app.repositories.base import TenantRepository
from app.schemas.job_posting import JobPostingCreate, JobPostingUpdate, JobPostingOut

router = APIRouter(prefix="/jobs", tags=["Job Postings"])

@router.post("", response_model=JobPostingOut, status_code=status.HTTP_201_CREATED)
def create_job_posting(
    job_in: JobPostingCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """
    Create a new Job Posting with required skills.
    Role-gated: Only ADMIN and RECRUITER can create job postings.
    """
    repo = TenantRepository(JobPosting, db, current_user.organization_id)
    created_job = repo.create(job_in.model_dump())
    return JobPostingOut.model_validate(created_job)

@router.get("", response_model=List[JobPostingOut])
def list_job_postings(
    status_filter: Optional[JobStatus] = Query(None, alias="status", description="Filter by job status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all job postings for the caller's organization.
    Accessible to all authenticated tenant users (Admin, Recruiter, Hiring Manager).
    """
    repo = TenantRepository(JobPosting, db, current_user.organization_id)
    if status_filter:
        jobs = repo.filter_by(status=status_filter)
    else:
        jobs = repo.list(skip=skip, limit=limit)
    return [JobPostingOut.model_validate(j) for j in jobs]

@router.get("/{job_id}", response_model=JobPostingOut)
def get_job_posting(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a single job posting by ID.
    Enforces tenant isolation: Returns 404 if job does not exist or belongs to another tenant.
    """
    repo = TenantRepository(JobPosting, db, current_user.organization_id)
    job = repo.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job posting with ID '{job_id}' not found."
        )
    return JobPostingOut.model_validate(job)

@router.patch("/{job_id}", response_model=JobPostingOut)
def update_job_posting(
    job_id: UUID,
    job_in: JobPostingUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """
    Update a job posting (description, required_skills, status, location, etc.).
    Role-gated: Only ADMIN and RECRUITER can update job postings.
    """
    repo = TenantRepository(JobPosting, db, current_user.organization_id)
    update_data = job_in.model_dump(exclude_unset=True)
    if not update_data:
        job = repo.get(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.")
        return JobPostingOut.model_validate(job)

    updated_job = repo.update(job_id, update_data)
    if not updated_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job posting with ID '{job_id}' not found or cannot be modified."
        )
    return JobPostingOut.model_validate(updated_job)

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_posting(
    job_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """
    Delete a job posting.
    Role-gated: Only ADMIN and RECRUITER can delete job postings.
    """
    repo = TenantRepository(JobPosting, db, current_user.organization_id)
    success = repo.delete(job_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job posting with ID '{job_id}' not found or cannot be deleted."
        )
    return None
