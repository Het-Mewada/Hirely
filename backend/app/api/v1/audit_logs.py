from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.repositories.base import TenantRepository
from app.schemas.audit_log import AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["Audit Logging"])

@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action name e.g. application.stage_changed, user.role_changed"),
    entity_type: Optional[str] = Query(None, description="Filter by target entity type e.g. Application, JobPosting, User"),
    actor_id: Optional[UUID] = Query(None, alias="user_id", description="Filter by actor user ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Retrieve audit log trail for the caller's organization.
    Role-gated: ADMIN only.
    Enforces strict tenant isolation.
    """
    repo = TenantRepository(AuditLog, db, current_user.organization_id)
    
    filters = {}
    if action:
        filters["action"] = action
    if entity_type:
        filters["entity_type"] = entity_type
    if actor_id:
        filters["user_id"] = actor_id

    if filters:
        logs = repo.filter_by(**filters)
        # Apply pagination manually for filter_by list
        logs = logs[skip:skip + limit]
    else:
        # Order by created_at DESC
        logs = db.query(AuditLog).filter(
            AuditLog.organization_id == current_user.organization_id
        ).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    # Map aliases actor_id, target_type, target_id
    result = []
    for log in logs:
        out = AuditLogOut.model_validate(log)
        out.actor_id = log.user_id
        out.target_type = log.entity_type
        out.target_id = log.entity_id

        if log.user:
            out.actor_name = log.user.full_name
            out.actor_email = log.user.email
        elif isinstance(log.details, dict):
            email = log.details.get("resumed_by") or log.details.get("cancelled_by") or log.details.get("updated_by") or log.details.get("cardholder")
            out.actor_email = email
            out.actor_name = log.details.get("cardholder") or email

        result.append(out)

    return result
