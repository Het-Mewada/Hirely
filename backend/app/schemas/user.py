from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.RECRUITER
    organization_id: UUID

class UserInviteRequest(UserBase):
    role: UserRole = UserRole.RECRUITER
    password: Optional[str] = None

class UserRoleUpdateRequest(BaseModel):
    role: UserRole

class UserOut(UserBase):
    id: UUID
    organization_id: UUID
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

