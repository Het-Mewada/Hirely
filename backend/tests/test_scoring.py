import pytest
from app.models.candidate import Candidate
from app.models.job_posting import JobPosting
from app.services.scoring import ScoringService

def test_compute_match_score_full():
    cand = Candidate(
        parsed_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        estimated_experience_years=5.0,
        resume_text="Senior Python Developer with 5 years experience building FastAPI web applications and PostgreSQL databases with Docker."
    )
    job = JobPosting(
        required_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        description="We are seeking a Python Developer with 5 years experience in FastAPI, PostgreSQL, and Docker."
    )

    breakdown = ScoringService.compute_match_score(cand, job)
    
    assert breakdown["final_score"] > 80.0
    assert breakdown["skills_score"] == 100.0
    assert breakdown["experience_score"] == 100.0
    assert breakdown["weighted_components"]["skills_component"] == 60.0
    assert breakdown["weighted_components"]["experience_component"] == 30.0
    assert len(breakdown["matched_skills"]) == 4
    assert len(breakdown["missing_skills"]) == 0

def test_compute_match_score_partial_skills():
    cand = Candidate(
        parsed_skills=["Python", "SQL"],
        estimated_experience_years=2.0,
        resume_text="Junior developer with Python and SQL knowledge."
    )
    job = JobPosting(
        required_skills=["Python", "FastAPI", "React", "Docker"],
        description="Required 4 years experience with Python, FastAPI, React, Docker."
    )

    breakdown = ScoringService.compute_match_score(cand, job)
    
    # 1 of 4 required skills matched -> 25% skills score -> 25 * 0.6 = 15.0
    assert breakdown["skills_score"] == 25.0
    assert breakdown["weighted_components"]["skills_component"] == 15.0
    assert "Python" in breakdown["matched_skills"]
    assert "FastAPI" in breakdown["missing_skills"]
    assert breakdown["candidate_experience_years"] == 2.0
    assert breakdown["job_required_experience_years"] == 4.0
    # exp 2 / 4 = 50% -> 50 * 0.3 = 15.0
    assert breakdown["experience_score"] == 50.0

def test_job_required_experience_extraction():
    req1 = ScoringService._estimate_job_required_experience("Must have 5+ years experience")
    assert req1 == 5.0

    req2 = ScoringService._estimate_job_required_experience("Looking for 3 yrs of experience in React")
    assert req2 == 3.0

    req3 = ScoringService._estimate_job_required_experience("Entry level position, no minimum experience")
    assert req3 == 2.0  # Default fallback
