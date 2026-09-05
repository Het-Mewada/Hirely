from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.job_posting import JobStatus

class JobPostingBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Job posting title")
    description: Optional[str] = Field(None, description="Detailed job description")
    department: Optional[str] = Field(None, max_length=100, description="Department name")
    location: Optional[str] = Field(None, max_length=100, description="Job location")
    status: JobStatus = Field(JobStatus.DRAFT, description="Job status")
    required_skills: List[str] = Field(default_factory=list, description="List of required skills for candidate matching")

class JobPostingCreate(JobPostingBase):
    pass

class JobPostingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    department: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    status: Optional[JobStatus] = None
    required_skills: Optional[List[str]] = None

class JobPostingOut(JobPostingBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
