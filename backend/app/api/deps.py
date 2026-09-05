from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
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
