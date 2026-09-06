from fastapi import APIRouter
from app.api.v1 import health, auth, tenant_demo, jobs, candidates, applications, users, audit_logs, organizations

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(tenant_demo.router)
api_router.include_router(jobs.router)
api_router.include_router(candidates.router)
api_router.include_router(applications.router)
api_router.include_router(users.router)
api_router.include_router(audit_logs.router)
api_router.include_router(organizations.router)

