import re
import datetime
import logging
from typing import List, Dict, Tuple, Any, Optional

logger = logging.getLogger(__name__)

# Curated Technical Skills Taxonomy
# Key: Canonical Skill Name
# Value: List of pattern variants and aliases
SKILLS_TAXONOMY: Dict[str, List[str]] = {
    # Programming Languages
    "Python": ["Python", "Python3", "Py"],
    "JavaScript": ["JavaScript", "JS", "ECMAScript"],
    "TypeScript": ["TypeScript", "TS"],
    "Java": ["Java"],
    "C++": ["C++", "Cpp"],
    "C#": ["C#", "CSharp", ".NET"],
    "Go": ["Go", "Golang"],
    "Rust": ["Rust"],
    "Ruby": ["Ruby"],
    "PHP": ["PHP"],
    "SQL": ["SQL", "Structured Query Language"],
    "HTML": ["HTML", "HTML5"],
    "CSS": ["CSS", "CSS3"],
    "Bash": ["Bash", "Shell", "Shell Scripting"],
    "R": ["R"],
    "Swift": ["Swift"],
    "Kotlin": ["Kotlin"],

    # Frontend Frameworks & UI
    "React": ["React", "React.js", "ReactJS"],
    "Next.js": ["Next.js", "NextJS", "Next"],
    "Vue.js": ["Vue", "Vue.js", "VueJS"],
    "Angular": ["Angular", "AngularJS", "Angular.js"],
    "Svelte": ["Svelte", "SvelteKit"],
    "TailwindCSS": ["Tailwind", "TailwindCSS", "Tailwind CSS"],
    "Redux": ["Redux", "Redux Toolkit"],
    "Bootstrap": ["Bootstrap"],

    # Backend Frameworks
    "FastAPI": ["FastAPI", "Fast API"],
    "Django": ["Django", "Django REST Framework", "DRF"],
    "Flask": ["Flask"],
    "Node.js": ["Node", "Node.js", "NodeJS"],
    "Express.js": ["Express", "Express.js", "ExpressJS"],
    "Spring Boot": ["Spring", "Spring Boot", "Spring MVC"],
    "Ruby on Rails": ["Rails", "Ruby on Rails"],
    "NestJS": ["NestJS", "Nest.js"],
    "GraphQL": ["GraphQL"],
    "REST API": ["REST", "RESTful", "REST API", "RESTful API"],
    "Microservices": ["Microservices", "Microservice Architecture"],

    # Databases
    "PostgreSQL": ["PostgreSQL", "Postgres", "Postgre"],
    "MySQL": ["MySQL"],
    "MongoDB": ["MongoDB", "Mongo"],
    "Redis": ["Redis"],
    "Elasticsearch": ["Elasticsearch", "Elastic Search"],
    "SQLite": ["SQLite"],
    "Cassandra": ["Cassandra"],
    "DynamoDB": ["DynamoDB"],
    "Firebase": ["Firebase", "Firestore"],

    # Cloud & DevOps
    "AWS": ["AWS", "Amazon Web Services", "EC2", "S3", "Lambda"],
    "Azure": ["Azure", "Microsoft Azure"],
    "GCP": ["GCP", "Google Cloud", "Google Cloud Platform"],
    "Docker": ["Docker", "Docker Compose"],
    "Kubernetes": ["Kubernetes", "K8s"],
    "Terraform": ["Terraform"],
    "CI/CD": ["CI/CD", "CICD", "Continuous Integration"],
    "GitHub Actions": ["GitHub Actions"],
    "Nginx": ["Nginx"],
    "Linux": ["Linux", "Ubuntu", "CentOS", "Debian"],
    "Git": ["Git", "GitHub", "GitLab"],

    # AI / Machine Learning & Data Science
    "PyTorch": ["PyTorch"],
    "TensorFlow": ["TensorFlow"],
    "Scikit-Learn": ["Scikit-Learn", "Sklearn", "Scikit Learn"],
    "Pandas": ["Pandas"],
    "NumPy": ["NumPy"],
    "spaCy": ["spaCy", "Spacy"],
    "OpenCV": ["OpenCV"],
    "LLMs": ["LLM", "LLMs", "Large Language Models"],
    "LangChain": ["LangChain"],

    # Testing & Developer Tools
    "Pytest": ["Pytest"],
    "Jest": ["Jest"],
    "Jira": ["Jira"],
    "Postman": ["Postman"],
    "Vite": ["Vite"],
    "Webpack": ["Webpack"],
    "Celery": ["Celery"],
    "RabbitMQ": ["RabbitMQ"],
    "Kafka": ["Kafka", "Apache Kafka"],
    "Agile": ["Agile", "Scrum"],
    "TDD": ["TDD", "Test Driven Development"]
}

_nlp = None
_matcher = None

def get_spacy_nlp_and_matcher():
    """
    Lazy loads spaCy nlp model (en_core_web_sm) and initializes PhraseMatcher with SKILLS_TAXONOMY.
    Auto-downloads model if missing.
    """
    global _nlp, _matcher
    if _nlp is not None and _matcher is not None:
        return _nlp, _matcher

    import spacy
    from spacy.matcher import PhraseMatcher

    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        logger.info("Downloading spaCy model 'en_core_web_sm'...")
        spacy.cli.download("en_core_web_sm")
        nlp = spacy.load("en_core_web_sm")

    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")

    # Add taxonomy patterns to matcher
    for canonical_name, aliases in SKILLS_TAXONOMY.items():
        patterns = [nlp.make_doc(alias) for alias in aliases]
        matcher.add(canonical_name, patterns)

    _nlp = nlp
    _matcher = matcher
    return _nlp, _matcher


class ResumeExtractorService:
    """
    Service for extracting structured data (skills, experience years, education, entities)
    from raw resume text using spaCy PhraseMatcher and NER.
    """

    @staticmethod
    def extract_entities(raw_text: str) -> Dict[str, Any]:
        """
        Processes raw text and returns a structured object:
        {
          "skills": ["Python", "FastAPI", "React", ...],
          "estimated_experience_years": 4.5,
          "education": ["B.S. in Computer Science - State University"],
          "parsed_entities": {
            "organizations": [...],
            "date_ranges": [...]
          }
        }
        """
        if not raw_text or not raw_text.strip() or raw_text.startswith("[NEEDS_MANUAL_REVIEW]"):
            return {
                "skills": [],
                "estimated_experience_years": 0.0,
                "education": [],
                "parsed_entities": {"organizations": [], "date_ranges": []}
            }

        nlp, matcher = get_spacy_nlp_and_matcher()
        doc = nlp(raw_text)

        # 1. Extract Skills using PhraseMatcher
        extracted_skills = ResumeExtractorService._extract_skills(doc, matcher)

        # 2. Estimate Experience Years using NER & Date Patterns
        estimated_years, date_ranges = ResumeExtractorService._estimate_experience(doc, raw_text)

        # 3. Extract Education Credentials & Certification Items
        education_items, certification_items, org_entities = ResumeExtractorService._extract_education_and_orgs(doc, raw_text)

        return {
            "skills": extracted_skills,
            "estimated_experience_years": estimated_years,
            "education": education_items,
            "parsed_entities": {
                "organizations": org_entities,
                "date_ranges": date_ranges,
                "certifications": certification_items
            }
        }

    @staticmethod
    def _extract_skills(doc, matcher) -> List[str]:
        matches = matcher(doc)
        found_skills = set()
        for match_id, start, end in matches:
            canonical_skill = doc.vocab.strings[match_id]
            found_skills.add(canonical_skill)
        return sorted(list(found_skills))

    @staticmethod
    def _estimate_experience(doc, raw_text: str) -> Tuple[float, List[str]]:
        now = datetime.datetime.now()
        current_year = now.year
        current_month = now.month
        date_ranges = []
        durations_in_years = []

        month_map = {
            "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
            "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
            "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9,
            "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12
        }

        education_keywords = [
            "education", "academic", "b.s.", "b.a.", "b.tech", "b.e.", "bachelor", "bachelors",
            "m.s.", "m.a.", "m.tech", "master", "masters", "m.b.a.", "mba",
            "ph.d", "phd", "doctorate", "associate degree", "diploma", "institute",
            "university", "college", "school", "certification", "workshop", "course"
        ]

        range_pattern = re.compile(
            r'\b(?:(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+)?(19\d\d|20\d\d)\s*(?:-|–|—|to)\s*(?:(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+)?(19\d\d|20\d\d|present|current|now)\b',
            re.IGNORECASE
        )

        lines = raw_text.splitlines()
        in_education_section = False

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            line_lower = line_str.lower()

            # Section header tracking
            if "education" in line_lower or "academic" in line_lower or "certification" in line_lower:
                in_education_section = True
            elif any(h in line_lower for h in ["experience", "employment", "work history", "career history", "projects"]):
                in_education_section = False

            # Flag if current line is education or certification related
            is_edu_line = in_education_section or any(k in line_lower for k in education_keywords)

            for match in range_pattern.finditer(line_str):
                start_m_str = match.group(1)
                start_yr = int(match.group(2))
                end_m_str = match.group(3)
                end_val = match.group(4).lower()

                start_m = month_map.get(start_m_str.lower(), 1) if start_m_str else 1

                if end_val in ["present", "current", "now"]:
                    end_yr = current_year
                    end_m = current_month
                else:
                    end_yr = int(end_val)
                    end_m = month_map.get(end_m_str.lower(), 12) if end_m_str else 12

                if 1970 <= start_yr <= current_year and start_yr <= end_yr <= current_year + 1:
                    start_months = start_yr * 12 + start_m
                    end_months = end_yr * 12 + end_m
                    months_diff = end_months - start_months + 1

                    if months_diff > 0:
                        yrs = round(months_diff / 12.0, 1)
                        range_str = f"{start_m_str.capitalize() + ' ' if start_m_str else ''}{start_yr} - {end_val.capitalize()}"
                        date_ranges.append(range_str)
                        if not is_edu_line:
                            durations_in_years.append(yrs)

        # Also check explicit mentions like "5+ years of experience" or "3 years experience"
        exp_mention_pattern = re.compile(r'\b(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience\b', re.IGNORECASE)
        explicit_years = []
        for match in exp_mention_pattern.finditer(raw_text):
            try:
                yrs = float(match.group(1))
                if 0.5 <= yrs <= 40:
                    explicit_years.append(yrs)
            except ValueError:
                pass

        if durations_in_years:
            # Sum up durations of work experience roles
            total_years = sum(durations_in_years)
            if explicit_years:
                total_years = max(total_years, max(explicit_years))
        elif explicit_years:
            total_years = max(explicit_years)
        else:
            total_years = 0.0

        return round(total_years, 1), sorted(list(set(date_ranges)))

    @staticmethod
    def _extract_education_and_orgs(doc, raw_text: str) -> Tuple[List[str], List[str], List[str]]:
        degree_keywords = [
            "b.s.", "b.a.", "b.tech", "b.e.", "bachelor", "bachelors",
            "m.s.", "m.a.", "m.tech", "master", "masters", "m.b.a.", "mba",
            "ph.d", "phd", "doctorate", "associate degree", "diploma"
        ]

        cert_keywords = [
            "certificate", "certification", "certifications", "certified",
            "workshop", "edutech", "coursera", "udemy", "nptel", "training",
            "bootcamp", "technosparx", "yhills"
        ]

        education_lines = []
        certification_lines = []
        lines = raw_text.splitlines()

        left_sec = ""
        right_sec = ""

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Split multi-column text segments (3 or more consecutive spaces)
            parts = [p.strip() for p in re.split(r'\s{3,}', line_str) if p.strip()]

            # Track section headers (e.g., EDUCATION, CERTIFICATIONS)
            headers = ["education", "certification", "certifications", "academic", "projects", "experience"]
            if any(h in line_str.lower() for h in headers):
                if len(parts) >= 2:
                    left_sec = parts[0].lower()
                    right_sec = parts[1].lower()
                else:
                    left_sec = parts[0].lower()
                    right_sec = ""
                continue

            for idx, part in enumerate(parts):
                part_lower = part.lower()
                current_sec = right_sec if (idx >= 1 and right_sec) else left_sec

                is_cert_sec = "cert" in current_sec
                is_cert_kw = any(ck in part_lower for ck in cert_keywords)
                is_degree = any(deg in part_lower for deg in degree_keywords)

                if (is_cert_sec or is_cert_kw) and not is_degree:
                    if len(part) <= 150 and not any(h in part_lower for h in ["education", "certifications", "projects"]):
                        certification_lines.append(part)
                elif is_degree:
                    if len(part) <= 150 and not any(h in part_lower for h in ["education", "certifications", "projects"]):
                        education_lines.append(part)

        # Deduplicate
        education_lines = sorted(list(set(education_lines)))
        certification_lines = sorted(list(set(certification_lines)))

        # Extract ORG entities using spaCy NER
        org_entities = set()
        for ent in doc.ents:
            if ent.label_ == "ORG":
                cleaned = ent.text.strip()
                if len(cleaned) > 2 and not cleaned.lower().startswith("http"):
                    org_entities.add(cleaned)

        return education_lines, certification_lines, sorted(list(org_entities))[:10]
