import pytest
from app.services.extractor import ResumeExtractorService, SKILLS_TAXONOMY
from app.repositories.base import TenantRepository
from app.models.candidate import Candidate

SAMPLE_RESUME_TEXT = """
Alex Johnson
Senior Fullstack Engineer
Email: alex@example.com | Phone: +1 555-0199

SUMMARY:
Passionate Software Engineer with experience building scalable microservices and web applications.
Proficient in Python, FastAPI, React, TypeScript, PostgreSQL, Docker, and AWS.

EXPERIENCE:
Senior Developer — TechCorp Inc. (2020 - Present)
- Architected REST APIs using FastAPI and PostgreSQL.
- Built responsive UI dashboards with React, TypeScript, and TailwindCSS.
- Deployed microservices on AWS using Docker and Kubernetes.

Software Engineer — Acme Solutions (2017 - 2020)
- Developed backend services using Python, Django, and Redis.
- Implemented CI/CD pipelines with GitHub Actions.

EDUCATION:
B.S. in Computer Science — State University (2013 - 2017)
"""

def test_spacy_skill_extraction_taxonomy():
    """
    VERIFIES SPACY PHRASEMATCHER SKILL EXTRACTION:
    Extracts skills against curated taxonomy and maps aliases to canonical names.
    """
    parsed = ResumeExtractorService.extract_entities(SAMPLE_RESUME_TEXT)
    skills = parsed["skills"]

    assert "Python" in skills
    assert "FastAPI" in skills
    assert "React" in skills
    assert "TypeScript" in skills
    assert "PostgreSQL" in skills
    assert "Docker" in skills
    assert "AWS" in skills
    assert "Kubernetes" in skills
    assert "TailwindCSS" in skills
    assert "Django" in skills
    assert "Redis" in skills
    assert "CI/CD" in skills

def test_spacy_experience_years_estimation():
    """
    VERIFIES EXPERIENCE YEARS ESTIMATION VIA NER & DATE RANGES:
    Calculates total experience span from 2017 to Present (current year - 2017 >= 6 years).
    """
    parsed = ResumeExtractorService.extract_entities(SAMPLE_RESUME_TEXT)
    estimated_years = parsed["estimated_experience_years"]
    date_ranges = parsed["parsed_entities"]["date_ranges"]

    assert estimated_years >= 6.0
    assert any("2020" in dr for dr in date_ranges)
    assert any("2017" in dr for dr in date_ranges)

def test_spacy_education_extraction():
    """
    VERIFIES DEGREE & EDUCATION PATTERN EXTRACTION:
    Extracts degree qualification lines matching B.S., B.Tech, M.S., etc.
    """
    parsed = ResumeExtractorService.extract_entities(SAMPLE_RESUME_TEXT)
    education = parsed["education"]

    assert len(education) >= 1
    assert any("B.S. in Computer Science" in edu for edu in education)

def test_candidate_resume_upload_populates_parsed_entities(db_session, user_org_a_admin, candidate_org_a):
    """
    VERIFIES END-TO-END CANDIDATE DB PERSISTENCE OF PARSED ENTITIES:
    Updating Candidate model saves parsed_skills, estimated_experience_years, parsed_education to PostgreSQL.
    """
    cand_repo = TenantRepository(Candidate, db_session, user_org_a_admin.organization_id)
    parsed = ResumeExtractorService.extract_entities(SAMPLE_RESUME_TEXT)

    updated = cand_repo.update(candidate_org_a.id, {
        "resume_text": SAMPLE_RESUME_TEXT,
        "parsed_skills": parsed["skills"],
        "estimated_experience_years": parsed["estimated_experience_years"],
        "parsed_education": parsed["education"],
        "parsed_entities": parsed["parsed_entities"]
    })

    assert updated.parsed_skills is not None
    assert "Python" in updated.parsed_skills
    assert updated.estimated_experience_years >= 6.0
    assert len(updated.parsed_education) >= 1
