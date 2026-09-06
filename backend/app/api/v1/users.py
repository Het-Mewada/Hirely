from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.repositories.base import TenantRepository
from app.schemas.user import UserOut, UserInviteRequest, UserRoleUpdateRequest
from app.core.security import hash_password
from app.services.audit import AuditLogger

router = APIRouter(prefix="/users", tags=["Users & Team Management"])

@router.post("/invite", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def invite_user(
    invite_in: UserInviteRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Invite a new user to the caller's organization with a assigned role.
    Role-gated: ADMIN only.
    Generates an audit log entry (`user.invited`).
    """
    repo = TenantRepository(User, db, current_user.organization_id)
    
    # Check if email exists
    existing = db.query(User).filter(User.email == invite_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{invite_in.email}' already exists."
        )

    temp_password = invite_in.password or "HirelyPass2026!"
    user = repo.create({
        "email": invite_in.email.lower(),
        "full_name": invite_in.full_name,
        "role": invite_in.role,
        "hashed_password": hash_password(temp_password),
        "is_active": True
    })

    # Log audit event
    AuditLogger.log(
        db=db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="user.invited",
        entity_type="User",
        entity_id=str(user.id),
        details={
            "invited_email": user.email,
            "role": user.role.value,
            "invited_by": current_user.email
        }
    )

    return UserOut.model_validate(user)

@router.patch("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: UUID,
    role_in: UserRoleUpdateRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Change role for a user within the caller's organization.
    Role-gated: ADMIN only.
    Generates an audit log entry (`user.role_changed`).
    """
    repo = TenantRepository(User, db, current_user.organization_id)
    target_user = repo.get(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found in your organization."
        )

    previous_role = target_user.role.value

    # Last Admin Protection
    if target_user.role == UserRole.ADMIN and role_in.role != UserRole.ADMIN:
        admin_count = db.query(User).filter(
            User.organization_id == current_user.organization_id,
            User.role == UserRole.ADMIN,
            User.is_active == True
        ).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Last Admin Protection: Cannot demote the last remaining Admin in your organization."
            )

    updated_user = repo.update(user_id, {"role": role_in.role})

    # Log audit event
    AuditLogger.log(
        db=db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="user.role_changed",
        entity_type="User",
        entity_id=str(user_id),
        details={
            "target_user_email": target_user.email,
            "previous_role": previous_role,
            "new_role": role_in.role.value
        }
    )

    return UserOut.model_validate(updated_user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Remove a team member from the caller's organization.
    Role-gated: ADMIN only.
    Enforces Last Admin Protection (cannot delete the last remaining Admin).
    """
    repo = TenantRepository(User, db, current_user.organization_id)
    target_user = repo.get(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found."
        )

    if target_user.role == UserRole.ADMIN:
        admin_count = db.query(User).filter(
            User.organization_id == current_user.organization_id,
            User.role == UserRole.ADMIN,
            User.is_active == True
        ).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Last Admin Protection: Cannot remove the last remaining Admin in your organization."
            )

    deleted_email = target_user.email
    repo.delete(user_id)

    AuditLogger.log(
        db=db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="user.deleted",
        entity_type="User",
        entity_id=str(user_id),
        details={"deleted_email": deleted_email}
    )

    return None

@router.get("", response_model=List[UserOut])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all team members for the caller's organization.
    """
    repo = TenantRepository(User, db, current_user.organization_id)
    users = repo.list(skip=skip, limit=limit)
    return [UserOut.model_validate(u) for u in users]
