# Hirely

> An AI-powered Applicant Tracking System (ATS) and Resume Screening Platform.

## Project Architecture

Hirely is organized as a monorepo consisting of:

- **`backend/`**: FastAPI service handling API endpoints, database models, background services, and AI integrations.
- **`frontend/`**: Modern Vite + React + TypeScript web client interface.
- **`docker-compose.yml`**: Docker orchestration for PostgreSQL, Redis, FastAPI Backend, and React Frontend.

## Quick Start (Docker)

To launch the full stack locally using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

## Quick Start (Local Development)

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## spaCy NER & Skills Taxonomy

Hirely uses **spaCy NLP** (`en_core_web_sm`) and spaCy's `PhraseMatcher` to convert raw resume text into structured candidate profiles:

- **Skills Extraction**: Uses a curated taxonomy of 100+ technical skills across 7 domains (Languages, Frontend, Backend, Databases, Cloud/DevOps, AI/ML, Tools). Pattern variants and aliases map to canonical skill names (e.g. `Postgres` -> `PostgreSQL`, `JS` -> `JavaScript`).
- **Experience Estimation**: Uses spaCy `DATE` NER entities and date range pattern matchers (e.g. `2018 - 2023`, `2020 - Present`) to calculate total career experience in years.
- **Education Extraction**: Identifies academic degree patterns (`B.S.`, `B.Tech`, `M.S.`, `Ph.D`) coupled with spaCy `ORG` entities.

For detailed taxonomy inclusion/exclusion rationale, normalization rules, and architectural design choices, see [TAXONOMY_DESIGN.md](file:///c:/Users/Mewada%20Het/Desktop/ATS%20Checker/TAXONOMY_DESIGN.md).

## Repository

GitHub: [https://github.com/Het-Mewada/Hirely.git](https://github.com/Het-Mewada/Hirely.git)

