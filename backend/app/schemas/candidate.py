from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class CandidateBase(BaseModel):
    email: EmailStr = Field(..., description="Candidate email address")
    first_name: str = Field(..., min_length=1, max_length=100, description="Candidate first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Candidate last name")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    resume_url: Optional[str] = Field(None, max_length=500, description="URL or reference path to resume document")

class CandidateCreate(CandidateBase):
    pass

class CandidateUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    resume_url: Optional[str] = Field(None, max_length=500)

class CandidateOut(CandidateBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
