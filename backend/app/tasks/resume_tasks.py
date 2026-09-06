import logging
from uuid import UUID
from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.application import Application, ProcessingStatus
from app.models.candidate import Candidate
from app.models.job_posting import JobPosting
from app.services.parser import ResumeParserService
from app.services.extractor import ResumeExtractorService
from app.services.scoring import ScoringService
from app.services.storage import StorageService

logger = logging.getLogger(__name__)

def run_resume_processing_logic(application_id: str, candidate_id: str, job_posting_id: str, organization_id: str, db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        app_uuid = UUID(application_id)
        cand_uuid = UUID(candidate_id)
        job_uuid = UUID(job_posting_id)
        org_uuid = UUID(organization_id)

        application = db.query(Application).filter(
            Application.id == app_uuid,
            Application.organization_id == org_uuid
        ).first()

        if not application:
            logger.error(f"Application {application_id} not found for task processing.")
            return

        # 1. Update status to PROCESSING
        application.status = ProcessingStatus.PROCESSING
        db.commit()

        candidate = db.query(Candidate).filter(
            Candidate.id == cand_uuid,
            Candidate.organization_id == org_uuid
        ).first()

        job = db.query(JobPosting).filter(
            JobPosting.id == job_uuid,
            JobPosting.organization_id == org_uuid
        ).first()

        if not candidate or not job:
            logger.error(f"Candidate {candidate_id} or Job {job_posting_id} missing for application {application_id}.")
            application.status = ProcessingStatus.FAILED
            db.commit()
            return

        # 2. Extract text and entities if resume text is present or file exists
        if candidate.resume_url and not candidate.resume_text:
            try:
                abs_path = StorageService.get_resume_file_path(
                    organization_id=org_uuid,
                    candidate_id=cand_uuid,
                    resume_path_or_url=candidate.resume_url
                )
                with open(abs_path, "rb") as f:
                    file_bytes = f.read()

                extracted_text, _ = ResumeParserService.extract_text_from_file(
                    filename=candidate.resume_url,
                    content=file_bytes
                )
                candidate.resume_text = extracted_text
            except Exception as e:
                logger.warning(f"Could not load resume file for candidate {candidate_id}: {e}")

        if candidate.resume_text:
            parsed = ResumeExtractorService.extract_entities(candidate.resume_text)
            candidate.parsed_skills = parsed.get("skills", [])
            candidate.estimated_experience_years = parsed.get("estimated_experience_years", 0.0)
            candidate.parsed_education = parsed.get("education", [])
            candidate.parsed_entities = parsed.get("parsed_entities", {})
            db.commit()

        # 3. Calculate ATS custom match score & breakdown
        breakdown = ScoringService.compute_match_score(candidate, job)
        final_score = breakdown.get("final_score", 0.0)

        # 4. Update Application status to SCORED
        application.score = final_score
        application.match_score = final_score
        application.score_breakdown = breakdown
        application.status = ProcessingStatus.SCORED
        db.commit()

        logger.info(f"Successfully processed and scored application {application_id} with score {final_score}%")

    except Exception as exc:
        logger.exception(f"Error processing resume task for application {application_id}: {exc}")
        db.rollback()
        try:
            app_to_fail = db.query(Application).filter(Application.id == UUID(application_id)).first()
            if app_to_fail:
                app_to_fail.status = ProcessingStatus.FAILED
                db.commit()
        except Exception:
            pass
    finally:
        if close_db:
            db.close()


@celery_app.task(bind=True, name="process_resume_application_task")
def process_resume_application_task(self, application_id: str, candidate_id: str, job_posting_id: str, organization_id: str):
    """
    Async Celery task to process resume PDF text extraction, spaCy NER parsing,
    and ATS custom match score computation in the background.
    """
    run_resume_processing_logic(application_id, candidate_id, job_posting_id, organization_id)


def trigger_resume_processing(application_id: str, candidate_id: str, job_posting_id: str, organization_id: str, db=None):
    """
    Helper function to dispatch Celery task asynchronously.
    Falls back to synchronous execution if Redis is unavailable or task eager mode is active.
    """
    if db is not None:
        run_resume_processing_logic(
            application_id=str(application_id),
            candidate_id=str(candidate_id),
            job_posting_id=str(job_posting_id),
            organization_id=str(organization_id),
            db=db
        )
        return

    try:
        process_resume_application_task.delay(
            application_id=str(application_id),
            candidate_id=str(candidate_id),
            job_posting_id=str(job_posting_id),
            organization_id=str(organization_id)
        )
    except Exception as err:
        logger.warning(f"Celery dispatch failed ({err}). Executing task synchronously in fallback mode.")
        run_resume_processing_logic(
            application_id=str(application_id),
            candidate_id=str(candidate_id),
            job_posting_id=str(job_posting_id),
            organization_id=str(organization_id)
        )
