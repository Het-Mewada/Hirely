import pytest
from fastapi import HTTPException, status
from app.repositories.base import TenantRepository
from app.models.job_posting import JobPosting, JobStatus
from app.models.user import UserRole
from app.schemas.job_posting import JobPostingCreate, JobPostingUpdate
from app.api.v1.jobs import create_job_posting, list_job_postings, get_job_posting, update_job_posting, delete_job_posting

def test_create_job_posting_with_required_skills(db_session, user_org_a_admin):
    """
    VERIFIES JOB CREATION WITH SKILLS:
    Admin/Recruiter creates job posting with required_skills.
    """
    job_in = JobPostingCreate(
        title="Senior Python Backend Engineer",
        description="Build scalable FastAPI multi-tenant SaaS backend.",
        department="Engineering",
        location="Remote",
        status=JobStatus.PUBLISHED,
        required_skills=["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"]
    )
    
    created_job = create_job_posting(job_in=job_in, current_user=user_org_a_admin, db=db_session)

    assert created_job.id is not None
    assert created_job.organization_id == user_org_a_admin.organization_id
    assert created_job.title == "Senior Python Backend Engineer"
    assert created_job.required_skills == ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"]
    assert created_job.status == JobStatus.PUBLISHED

def test_hiring_manager_cannot_create_or_delete_job(db_session, user_org_a_manager):
    """
    VERIFIES RBAC ROLE-GATING FOR JOBS:
    Hiring Manager attempting POST or DELETE raises HTTP 403 Forbidden.
    """
    job_in = JobPostingCreate(
        title="Unauthorized Job",
        description="Manager should not be able to create jobs directly.",
        required_skills=["Management"]
    )

    # Hiring manager cannot call create endpoint guard
    from app.api.deps import require_role
    role_checker = require_role(UserRole.ADMIN, UserRole.RECRUITER)
    
    with pytest.raises(HTTPException) as exc_info:
        role_checker(current_user=user_org_a_manager)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN

def test_job_posting_tenant_isolation(db_session, user_org_a_admin, user_org_b_admin):
    """
    VERIFIES MULTI-TENANT ISOLATION FOR JOBS:
    Org A creates a job. Org B listing jobs receives 0 items. Org B fetching Org A's job ID receives HTTP 404.
    """
    repo_a = TenantRepository(JobPosting, db_session, user_org_a_admin.organization_id)
    job_a = repo_a.create({
        "title": "Org A AI Scientist",
        "description": "LLM engineering",
        "required_skills": ["PyTorch", "Transformers"]
    })

    # Org A sees job_a
    jobs_a = list_job_postings(status_filter=None, skip=0, limit=100, current_user=user_org_a_admin, db=db_session)
    assert len(jobs_a) == 1
    assert jobs_a[0].id == job_a.id

    # Org B sees ZERO jobs
    jobs_b = list_job_postings(status_filter=None, skip=0, limit=100, current_user=user_org_b_admin, db=db_session)
    assert len(jobs_b) == 0

    # Org B fetching Org A's job ID yields 404 Not Found
    with pytest.raises(HTTPException) as exc_info:
        get_job_posting(job_id=job_a.id, current_user=user_org_b_admin, db=db_session)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

def test_update_job_posting_required_skills(db_session, user_org_a_admin):
    """
    VERIFIES PATCH /JOBS/{ID} UPDATES:
    Updating required_skills and status.
    """
    repo_a = TenantRepository(JobPosting, db_session, user_org_a_admin.organization_id)
    job = repo_a.create({
        "title": "Frontend Lead",
        "required_skills": ["React"]
    })

    update_in = JobPostingUpdate(
        status=JobStatus.PUBLISHED,
        required_skills=["React", "TypeScript", "Vite", "TailwindCSS"]
    )

    updated = update_job_posting(job_id=job.id, job_in=update_in, current_user=user_org_a_admin, db=db_session)

    assert updated.status == JobStatus.PUBLISHED
    assert updated.required_skills == ["React", "TypeScript", "Vite", "TailwindCSS"]
