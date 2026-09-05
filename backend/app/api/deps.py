from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Callable
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False
)

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    header_token: str = Depends(reusable_oauth2)
) -> User:
    token = header_token or request.query_params.get("token")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    org_id: str = payload.get("org_id")
    
    if not user_id or not org_id:
        raise credentials_exception
        
    try:
        user_uuid = UUID(user_id)
        org_uuid = UUID(org_id)
    except ValueError:
        raise credentials_exception

    user = db.query(User).filter(
        User.id == user_uuid,
        User.organization_id == org_uuid,
        User.is_active == True
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or inactive"
        )
        
    return user

def require_role(*allowed_roles: UserRole) -> Callable:
    """
    Role-Based Access Control (RBAC) Dependency Factory.
    Enforces that the current authenticated user possesses one of the allowed_roles.
    Returns HTTP 403 Forbidden if user role is unauthorized.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {[r.value for r in allowed_roles]}, but your role is '{current_user.role.value}'"
            )
        return current_user
    return role_checker
