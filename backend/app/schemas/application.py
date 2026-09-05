from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.application import ApplicationStage
from app.schemas.candidate import CandidateOut
from app.schemas.job_posting import JobPostingOut

class ApplicationCreate(BaseModel):
    job_posting_id: UUID = Field(..., description="ID of target job posting")
    candidate_id: UUID = Field(..., description="ID of candidate applying")
    notes: Optional[str] = Field(None, description="Initial application notes")

class ApplicationStageUpdate(BaseModel):
    stage: ApplicationStage = Field(..., description="Target pipeline stage: applied, screening, interview, offer, hired, rejected")
    notes: Optional[str] = Field(None, description="Updated stage evaluation notes")

class ApplicationOut(BaseModel):
    id: UUID
    organization_id: UUID
    job_posting_id: UUID
    candidate_id: UUID
    stage: ApplicationStage
    score: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    candidate: Optional[CandidateOut] = None
    job_posting: Optional[JobPostingOut] = None

    model_config = ConfigDict(from_attributes=True)
