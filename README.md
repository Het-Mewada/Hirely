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

## Repository

GitHub: [https://github.com/Het-Mewada/Hirely.git](https://github.com/Het-Mewada/Hirely.git)
