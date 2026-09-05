from pydantic import BaseModel, EmailStr, ConfigDict
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

class UserOut(UserBase):
    id: UUID
    organization_id: UUID
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
