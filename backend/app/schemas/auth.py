from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from app.schemas.user import UserOut
from app.schemas.organization import OrganizationOut

class OrganizationSignupRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255, description="Full company/organization name")
    company_slug: Optional[str] = Field(None, min_length=2, max_length=100, description="URL-friendly slug (auto-generated if empty)")
    admin_email: EmailStr = Field(..., description="Admin email address")
    admin_password: str = Field(..., min_length=8, max_length=100, description="Admin password (min 8 chars)")
    admin_full_name: str = Field(..., min_length=2, max_length=255, description="Admin full name")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    organization: OrganizationOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    org_id: Optional[str] = None
    role: Optional[str] = None
