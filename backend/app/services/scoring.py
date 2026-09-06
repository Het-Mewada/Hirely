import re
import logging
from typing import Dict, Any, List
from app.models.candidate import Candidate
from app.models.job_posting import JobPosting

logger = logging.getLogger(__name__)

class ScoringService:
    """
    Explicit, explainable ATS match scoring service.
    
    Scoring Formula Breakdown:
    - Skill Overlap (60% Weight): (matched_skills / required_skills) * 0.6
    - Experience Fit (30% Weight): (candidate_years / required_years) * 0.3
    - Keyword/TF-IDF Similarity (10% Weight): Cosine similarity between resume text and job description * 0.1
    
    Produces a 0-100 score and a detailed explainable breakdown dictionary.
    """

    @staticmethod
    def compute_match_score(candidate: Candidate, job: JobPosting) -> Dict[str, Any]:
        # 1. Skill Overlap Calculation (60% Weight)
        cand_skills = set(candidate.parsed_skills or [])
        req_skills = job.required_skills or []
        
        matched_skills = []
        missing_skills = []
        
        if req_skills:
            for r in req_skills:
                matched = False
                for c in cand_skills:
                    if c.lower() == r.lower():
                        matched_skills.append(c)
                        matched = True
                        break
                if not matched:
                    missing_skills.append(r)
            
            skill_ratio = len(matched_skills) / len(req_skills) if req_skills else 1.0
            skills_score = min(skill_ratio * 100.0, 100.0)
        else:
            skills_score = 100.0
            matched_skills = list(cand_skills)

        skills_component = skills_score * 0.60

        # 2. Experience Fit Score (30% Weight)
        cand_exp = candidate.estimated_experience_years or 0.0
        job_req_exp = ScoringService._estimate_job_required_experience(job.description or "")
        
        if job_req_exp > 0:
            exp_ratio = min(cand_exp / job_req_exp, 1.0)
            experience_score = exp_ratio * 100.0
        else:
            experience_score = 100.0

        experience_component = experience_score * 0.30

        # 3. TF-IDF Cosine Text Similarity (10% Weight)
        similarity_score = ScoringService._compute_tfidf_similarity(
            candidate.resume_text or "",
            job.description or ""
        )
        similarity_component = similarity_score * 0.10

        # 4. Combine Final 0-100 Match Score
        final_score = round(skills_component + experience_component + similarity_component, 1)

        breakdown = {
            "final_score": final_score,
            "skills_score": round(skills_score, 1),
            "experience_score": round(experience_score, 1),
            "similarity_score": round(similarity_score, 1),
            "weighted_components": {
                "skills_component": round(skills_component, 1),
                "experience_component": round(experience_component, 1),
                "similarity_component": round(similarity_component, 1)
            },
            "matched_skills": sorted(list(set(matched_skills))),
            "missing_skills": sorted(list(set(missing_skills))),
            "candidate_experience_years": cand_exp,
            "job_required_experience_years": job_req_exp,
            "weights": {
                "skills": 0.60,
                "experience": 0.30,
                "similarity": 0.10
            }
        }
        return breakdown

    @staticmethod
    def _estimate_job_required_experience(description: str) -> float:
        match = re.search(r'\b(\d{1,2})\+?\s*(?:years?|yrs?)\b', description, re.IGNORECASE)
        if match:
            try:
                val = float(match.group(1))
                if 1 <= val <= 20:
                    return val
            except ValueError:
                pass
        return 2.0

    @staticmethod
    def _compute_tfidf_similarity(resume_text: str, job_description: str) -> float:
        if not resume_text or not resume_text.strip() or not job_description or not job_description.strip():
            return 50.0

        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity

            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
            sim_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            sim_val = float(sim_matrix[0][0])
            return round(sim_val * 100.0, 1)
        except Exception as e:
            logger.error(f"Error computing TF-IDF similarity: {str(e)}")
            return 50.0
