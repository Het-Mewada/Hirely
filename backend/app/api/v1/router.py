from fastapi import APIRouter
from app.api.v1 import health, auth, tenant_demo, jobs

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(tenant_demo.router)
api_router.include_router(jobs.router)
