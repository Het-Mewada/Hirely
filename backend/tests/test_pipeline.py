import pytest
from fastapi import HTTPException, status
from app.repositories.base import TenantRepository
from app.models.candidate import Candidate
from app.models.job_posting import JobPosting, JobStatus
from app.models.application import Application, ApplicationStage
from app.schemas.candidate import CandidateCreate, CandidateUpdate
from app.schemas.application import ApplicationCreate, ApplicationStageUpdate
from app.api.v1.candidates import create_candidate, list_candidates, get_candidate, update_candidate
from app.api.v1.applications import create_application, list_applications, get_application, update_application_stage

def test_candidate_crud(db_session, user_org_a_admin):
    """
    VERIFIES CANDIDATE CRUD:
    Creates candidate, retrieves by ID, and updates details.
    """
    cand_in = CandidateCreate(
        email="alex.dev@gmail.com",
        first_name="Alex",
        last_name="Developer",
        phone="+1234567890",
        resume_url="https://s3.amazonaws.com/hirely/resumes/alex.pdf"
    )
    
    created = create_candidate(candidate_in=cand_in, current_user=user_org_a_admin, db=db_session)
    assert created.id is not None
    assert created.email == "alex.dev@gmail.com"
    assert created.organization_id == user_org_a_admin.organization_id

    # Fetch candidate
    fetched = get_candidate(candidate_id=created.id, current_user=user_org_a_admin, db=db_session)
    assert fetched.id == created.id

    # Update candidate
    update_in = CandidateUpdate(phone="+1999888777")
    updated = update_candidate(candidate_id=created.id, candidate_in=update_in, current_user=user_org_a_admin, db=db_session)
    assert updated.phone == "+1999888777"

def test_application_pipeline_stage_transitions(db_session, user_org_a_admin):
    """
    VERIFIES APPLICATION PIPELINE STAGE TRANSITIONS:
    Links candidate to job posting, starting at APPLIED.
    Transitions through pipeline: APPLIED -> SCREENING -> INTERVIEW -> OFFER -> HIRED.
    """
    # 1. Create Job & Candidate
    job_repo = TenantRepository(JobPosting, db_session, user_org_a_admin.organization_id)
    job = job_repo.create({"title": "Fullstack Engineer", "status": JobStatus.PUBLISHED})

    cand_repo = TenantRepository(Candidate, db_session, user_org_a_admin.organization_id)
    cand = cand_repo.create({"email": "sam@dev.com", "first_name": "Sam", "last_name": "Coder"})

    # 2. Create Application (Initial stage = APPLIED)
    app_in = ApplicationCreate(
        job_posting_id=job.id,
        candidate_id=cand.id,
        notes="Strong GitHub portfolio"
    )
    app_created = create_application(app_in=app_in, current_user=user_org_a_admin, db=db_session)
    
    assert app_created.id is not None
    assert app_created.stage == ApplicationStage.APPLIED

    # 3. Move pipeline to SCREENING
    s1 = update_application_stage(
        application_id=app_created.id,
        stage_in=ApplicationStageUpdate(stage=ApplicationStage.SCREENING, notes="Resume screening passed"),
        current_user=user_org_a_admin,
        db=db_session
    )
    assert s1.stage == ApplicationStage.SCREENING

    # 4. Move pipeline to INTERVIEW
    s2 = update_application_stage(
        application_id=app_created.id,
        stage_in=ApplicationStageUpdate(stage=ApplicationStage.INTERVIEW, notes="Technical interview scheduled"),
        current_user=user_org_a_admin,
        db=db_session
    )
    assert s2.stage == ApplicationStage.INTERVIEW

    # 5. Move pipeline to OFFER
    s3 = update_application_stage(
        application_id=app_created.id,
        stage_in=ApplicationStageUpdate(stage=ApplicationStage.OFFER, notes="Offer letter dispatched"),
        current_user=user_org_a_admin,
        db=db_session
    )
    assert s3.stage == ApplicationStage.OFFER

    # 6. Move pipeline to HIRED
    s4 = update_application_stage(
        application_id=app_created.id,
        stage_in=ApplicationStageUpdate(stage=ApplicationStage.HIRED, notes="Offer accepted! Onboarding start date set."),
        current_user=user_org_a_admin,
        db=db_session
    )
    assert s4.stage == ApplicationStage.HIRED

def test_application_tenant_isolation(db_session, user_org_a_admin, user_org_b_admin):
    """
    VERIFIES MULTI-TENANT ISOLATION FOR APPLICATIONS:
    Org A creates an application.
    Org B cannot see or alter Org A's application pipeline stage.
    """
    job_repo = TenantRepository(JobPosting, db_session, user_org_a_admin.organization_id)
    job = job_repo.create({"title": "Org A DevOps Engineer"})

    cand_repo = TenantRepository(Candidate, db_session, user_org_a_admin.organization_id)
    cand = cand_repo.create({"email": "devops@orga.com", "first_name": "Dev", "last_name": "Ops"})

    app_repo = TenantRepository(Application, db_session, user_org_a_admin.organization_id)
    app_a = app_repo.create({
        "job_posting_id": job.id,
        "candidate_id": cand.id,
        "stage": ApplicationStage.APPLIED
    })

    # Org B attempting to fetch Org A's application ID yields 404
    with pytest.raises(HTTPException) as exc_info:
        get_application(application_id=app_a.id, current_user=user_org_b_admin, db=db_session)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

    # Org B attempting to update Org A's application stage yields 404
    with pytest.raises(HTTPException) as exc_info:
        update_application_stage(
            application_id=app_a.id,
            stage_in=ApplicationStageUpdate(stage=ApplicationStage.REJECTED),
            current_user=user_org_b_admin,
            db=db_session
        )
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
