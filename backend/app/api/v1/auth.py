import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import OrganizationSignupRequest, LoginRequest, TokenResponse, ChangePasswordRequest
from app.schemas.user import UserOut
from app.schemas.organization import OrganizationOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(req: OrganizationSignupRequest, db: Session = Depends(get_db)):
    """
    Creates an Organization + first User (role=admin) in a single atomic database transaction.
    """
    # 1. Generate or validate slug
    slug = req.company_slug.strip() if req.company_slug else slugify(req.company_name)
    if not slug:
        slug = "org-" + req.company_name[:10].lower()

    # 2. Check if slug already exists
    existing_org = db.query(Organization).filter(Organization.slug == slug).first()
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An organization with this slug already exists. Please choose a different company slug."
        )

    # 3. Check if admin email already exists globally or in organization
    existing_user = db.query(User).filter(User.email == req.admin_email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # 4. Atomic transaction: Organization + Admin User + Audit Log
    try:
        organization = Organization(
            name=req.company_name,
            slug=slug
        )
        db.add(organization)
        db.flush()  # Flush to populate organization.id for foreign keys

        admin_user = User(
            organization_id=organization.id,
            email=req.admin_email.lower(),
            hashed_password=hash_password(req.admin_password),
            full_name=req.admin_full_name,
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.flush()  # Flush to populate admin_user.id

        audit_log = AuditLog(
            organization_id=organization.id,
            user_id=admin_user.id,
            action="organization.created",
            entity_type="Organization",
            entity_id=str(organization.id),
            details={"company_name": organization.name, "admin_email": admin_user.email}
        )
        db.add(audit_log)

        db.commit()
        db.refresh(organization)
        db.refresh(admin_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create organization and admin user: {str(e)}"
        )

    # 5. Issue JWT Token containing user_id, organization_id, and role
    access_token = create_access_token(
        subject=str(admin_user.id),
        organization_id=str(organization.id),
        role=admin_user.role.value
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(admin_user),
        organization=OrganizationOut.model_validate(organization)
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates user email and password, returning JWT token containing user_id, organization_id, and role.
    """
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    organization = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated organization not found"
        )

    # Log audit event
    try:
        audit_log = AuditLog(
            organization_id=organization.id,
            user_id=user.id,
            action="user.login",
            entity_type="User",
            entity_id=str(user.id),
            details={"email": user.email}
        )
        db.add(audit_log)
        db.commit()
    except Exception:
        db.rollback()

    access_token = create_access_token(
        subject=str(user.id),
        organization_id=str(organization.id),
        role=user.role.value
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        organization=OrganizationOut.model_validate(organization)
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the authenticated user profile, confirming JWT token decoding and tenant context.
    """
    return UserOut.model_validate(current_user)

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows an authenticated user to change their password by providing old and new password.
    """
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user.hashed_password = hash_password(req.new_password)

    try:
        audit_log = AuditLog(
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            action="user.password_changed",
            entity_type="User",
            entity_id=str(current_user.id),
            details={"email": current_user.email}
        )
        db.add(audit_log)
        db.commit()
    except Exception:
        db.rollback()

    return {"message": "Password changed successfully"}

