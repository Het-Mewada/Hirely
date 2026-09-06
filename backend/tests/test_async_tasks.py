import pytest
from uuid import uuid4
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.job_posting import JobPosting
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStage, ProcessingStatus
from app.tasks.resume_tasks import process_resume_application_task, trigger_resume_processing

def test_process_resume_application_task(db_session):
    # Setup test org, user, job, candidate
    org = Organization(name="Test Async Org", slug=f"async-org-{uuid4()}")
    db_session.add(org)
    db_session.commit()

    job = JobPosting(
        organization_id=org.id,
        title="Async Python Engineer",
        description="Looking for Python and FastAPI engineer with 3 years experience.",
        required_skills=["Python", "FastAPI"]
    )
    cand = Candidate(
        organization_id=org.id,
        first_name="Async",
        last_name="Tester",
        email=f"async.{uuid4()}@test.com",
        resume_text="Experienced Python Developer with 3 years in FastAPI and PostgreSQL.",
        parsed_skills=["Python", "FastAPI"]
    )
    db_session.add_all([job, cand])
    db_session.commit()

    app = Application(
        organization_id=org.id,
        job_posting_id=job.id,
        candidate_id=cand.id,
        stage=ApplicationStage.APPLIED,
        status=ProcessingStatus.PENDING
    )
    db_session.add(app)
    db_session.commit()

    assert app.status == ProcessingStatus.PENDING

    from app.tasks.resume_tasks import run_resume_processing_logic
    run_resume_processing_logic(
        application_id=str(app.id),
        candidate_id=str(cand.id),
        job_posting_id=str(job.id),
        organization_id=str(org.id),
        db=db_session
    )


    db_session.refresh(app)
    assert app.status == ProcessingStatus.SCORED
    assert app.match_score is not None
    assert app.match_score > 50.0

    assert app.score_breakdown is not None
    assert "skills_score" in app.score_breakdown

def test_trigger_resume_processing_fallback(db_session):
    org = Organization(name="Test Fallback Org", slug=f"fallback-org-{uuid4()}")
    db_session.add(org)
    db_session.commit()

    job = JobPosting(
        organization_id=org.id,
        title="Fallback Engineer",
        description="Python developer needed.",
        required_skills=["Python"]
    )
    cand = Candidate(
        organization_id=org.id,
        first_name="Fallback",
        last_name="Candidate",
        email=f"fallback.{uuid4()}@test.com",
        resume_text="Python developer.",
        parsed_skills=["Python"]
    )
    db_session.add_all([job, cand])
    db_session.commit()

    app = Application(
        organization_id=org.id,
        job_posting_id=job.id,
        candidate_id=cand.id,
        stage=ApplicationStage.APPLIED,
        status=ProcessingStatus.PENDING
    )
    db_session.add(app)
    db_session.commit()

    # Trigger helper function (will fallback or eager run)
    trigger_resume_processing(
        application_id=str(app.id),
        candidate_id=str(cand.id),
        job_posting_id=str(job.id),
        organization_id=str(org.id),
        db=db_session
    )

    db_session.refresh(app)
    assert app.status == ProcessingStatus.SCORED
    assert app.match_score is not None
