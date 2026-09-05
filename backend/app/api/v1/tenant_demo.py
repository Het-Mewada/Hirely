from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.candidate import Candidate
from app.repositories.base import TenantRepository

router = APIRouter(prefix="/demo", tags=["Multi-Tenant & RBAC Demo"])

@router.get("/admin-only")
def admin_only_endpoint(current_user: User = Depends(require_role(UserRole.ADMIN))):
    """
    Role-gated endpoint accessible ONLY to users with ADMIN role.
    """
    return {
        "message": "Access granted: Admin privileged action executed.",
        "user_id": str(current_user.id),
        "organization_id": str(current_user.organization_id),
        "role": current_user.role.value
    }

@router.get("/recruiter-only")
def recruiter_only_endpoint(current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER))):
    """
    Role-gated endpoint accessible to ADMIN and RECRUITER roles.
    """
    return {
        "message": "Access granted: Recruiter endpoint accessed.",
        "user_id": str(current_user.id),
        "organization_id": str(current_user.organization_id),
        "role": current_user.role.value
    }

@router.get("/candidates")
def list_my_tenant_candidates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Demonstrates multi-tenant query scoping via TenantRepository.
    Every query is automatically scoped to current_user.organization_id.
    Org A can NEVER see Org B's candidate data.
    """
    repo = TenantRepository(Candidate, db, current_user.organization_id)
    candidates = repo.list()
    return {
        "organization_id": str(current_user.organization_id),
        "count": len(candidates),
        "candidates": [
            {
                "id": str(c.id),
                "email": c.email,
                "name": f"{c.first_name} {c.last_name}",
                "organization_id": str(c.organization_id)
            }
            for c in candidates
        ]
    }
