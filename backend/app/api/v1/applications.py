from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.candidate import Candidate
from app.models.job_posting import JobPosting
from app.models.application import Application, ApplicationStage, ProcessingStatus
from app.models.audit_log import AuditLog
from app.repositories.base import TenantRepository
from app.schemas.application import ApplicationCreate, ApplicationStageUpdate, ApplicationOut
from app.services.scoring import ScoringService
from app.tasks.resume_tasks import trigger_resume_processing

router = APIRouter(prefix="/applications", tags=["Applications & Pipeline"])

@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Link a Candidate to a Job Posting.
    Initial pipeline stage = 'applied'. Initial status = 'pending'.
    Triggers async resume extraction + custom ATS match scoring task via Celery.
    Enforces that both candidate and job posting belong to caller's organization.
    """
    cand_repo = TenantRepository(Candidate, db, current_user.organization_id)
    job_repo = TenantRepository(JobPosting, db, current_user.organization_id)
    app_repo = TenantRepository(Application, db, current_user.organization_id)

    # 1. Validate Candidate belongs to caller tenant
    candidate = cand_repo.get(app_in.candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID '{app_in.candidate_id}' not found in your organization."
        )

    # 2. Validate Job Posting belongs to caller tenant
    job = job_repo.get(app_in.job_posting_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job posting with ID '{app_in.job_posting_id}' not found in your organization."
        )

    # 3. Check for duplicate application
    existing_apps = app_repo.filter_by(
        job_posting_id=app_in.job_posting_id,
        candidate_id=app_in.candidate_id
    )
    if existing_apps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate has already submitted an application for this job posting."
        )

    # 4. Create application with status = PENDING
    application = app_repo.create({
        "job_posting_id": app_in.job_posting_id,
        "candidate_id": app_in.candidate_id,
        "stage": ApplicationStage.APPLIED,
        "status": ProcessingStatus.PENDING,
        "notes": app_in.notes
    })

    # Log audit event
    audit_log = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="application.created",
        entity_type="Application",
        entity_id=str(application.id),
        details={
            "job_posting_id": str(app_in.job_posting_id),
            "candidate_id": str(app_in.candidate_id),
            "stage": ApplicationStage.APPLIED.value,
            "status": ProcessingStatus.PENDING.value
        }
    )
    db.add(audit_log)
    db.commit()

    # 5. Dispatch async background task for text extraction & scoring
    trigger_resume_processing(
        application_id=str(application.id),
        candidate_id=str(candidate.id),
        job_posting_id=str(job.id),
        organization_id=str(current_user.organization_id),
        db=db
    )

    return ApplicationOut.model_validate(application)


@router.get("", response_model=List[ApplicationOut])
def list_applications(
    job_posting_id: Optional[UUID] = Query(None, description="Filter applications by job posting ID"),
    stage: Optional[ApplicationStage] = Query(None, description="Filter applications by pipeline stage"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List applications for caller's organization.
    Supports filtering by job_posting_id and pipeline stage.
    """
    app_repo = TenantRepository(Application, db, current_user.organization_id)
    
    filters = {}
    if job_posting_id:
        filters["job_posting_id"] = job_posting_id
    if stage:
        filters["stage"] = stage

    if filters:
        applications = app_repo.filter_by(**filters)
    else:
        applications = app_repo.list(skip=skip, limit=limit)

    # Auto-process any pending or unscored applications
    from app.tasks.resume_tasks import run_resume_processing_logic
    for app in applications:
        if app.status == ProcessingStatus.PENDING or app.match_score is None:
            run_resume_processing_logic(
                application_id=str(app.id),
                candidate_id=str(app.candidate_id),
                job_posting_id=str(app.job_posting_id),
                organization_id=str(current_user.organization_id),
                db=db
            )

    return [ApplicationOut.model_validate(a) for a in applications]


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get application details by ID (tenant-scoped).
    """
    app_repo = TenantRepository(Application, db, current_user.organization_id)
    application = app_repo.get(application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID '{application_id}' not found."
        )
    return ApplicationOut.model_validate(application)

@router.patch("/{application_id}/stage", response_model=ApplicationOut)
def update_application_stage(
    application_id: UUID,
    stage_in: ApplicationStageUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Move a candidate through pipeline stages (applied -> screening -> interview -> offer -> hired / rejected).
    Generates an audit log entry for the stage change.
    """
    app_repo = TenantRepository(Application, db, current_user.organization_id)
    application = app_repo.get(application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID '{application_id}' not found."
        )

    previous_stage = application.stage.value

    # Update stage & notes
    update_data = {"stage": stage_in.stage}
    if stage_in.notes:
        update_data["notes"] = stage_in.notes

    updated_app = app_repo.update(application_id, update_data)

    # Log audit event for pipeline stage transition
    audit_log = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="application.stage_changed",
        entity_type="Application",
        entity_id=str(application_id),
        details={
            "previous_stage": previous_stage,
            "new_stage": stage_in.stage.value,
            "notes": stage_in.notes
        }
    )
    db.add(audit_log)
    db.commit()

    return ApplicationOut.model_validate(updated_app)

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
    db: Session = Depends(get_db)
):
    """
    Delete an application link.
    """
    app_repo = TenantRepository(Application, db, current_user.organization_id)
    success = app_repo.delete(application_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID '{application_id}' not found or cannot be deleted."
        )
    return None

@router.post("/{application_id}/score", response_model=ApplicationOut)
def score_application(
    application_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Triggers explicit, explainable ATS custom match scoring for an application.
    Calculates 60% skill overlap + 30% experience fit + 10% TF-IDF similarity.
    Stores match_score and score_breakdown on the Application record.
    """
    # Subscription Plan Gating for Pro Tier (AI Resume Scoring)
    from app.models.organization import Organization
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if org and org.plan.lower() == "free":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Resume Scoring is a Pro feature. Upgrade your organization plan to Pro to unlock ATS match scoring."
        )

    app_repo = TenantRepository(Application, db, current_user.organization_id)
    application = app_repo.get(application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID '{application_id}' not found."
        )

    cand_repo = TenantRepository(Candidate, db, current_user.organization_id)
    job_repo = TenantRepository(JobPosting, db, current_user.organization_id)

    candidate = cand_repo.get(application.candidate_id)
    job = job_repo.get(application.job_posting_id)

    if not candidate or not job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Associated Candidate or Job Posting not found."
        )

    breakdown = ScoringService.compute_match_score(candidate, job)
    final_score = breakdown["final_score"]

    updated_app = app_repo.update(application_id, {
        "score": final_score,
        "match_score": final_score,
        "score_breakdown": breakdown
    })

    audit_log = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="application.scored",
        entity_type="Application",
        entity_id=str(application_id),
        details=breakdown
    )
    db.add(audit_log)
    db.commit()

    return ApplicationOut.model_validate(updated_app)
