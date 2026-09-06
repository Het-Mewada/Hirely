from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime

class CandidateBase(BaseModel):
    email: EmailStr = Field(..., description="Candidate email address")
    first_name: str = Field(..., min_length=1, max_length=100, description="Candidate first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Candidate last name")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    resume_url: Optional[str] = Field(None, max_length=500, description="URL or reference path to resume document")
    resume_text: Optional[str] = Field(None, description="Extracted raw text from resume")
    parsed_skills: Optional[List[str]] = Field(None, description="List of technical skills extracted via spaCy PhraseMatcher")
    estimated_experience_years: Optional[float] = Field(None, description="Estimated total experience in years derived via NER & date parsing")
    parsed_education: Optional[List[str]] = Field(None, description="Extracted education degrees and academic credentials")
    parsed_entities: Optional[Dict] = Field(None, description="Extracted NER metadata (organizations, date ranges)")

class CandidateCreate(CandidateBase):
    pass

class CandidateUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    resume_url: Optional[str] = Field(None, max_length=500)
    resume_text: Optional[str] = Field(None)
    parsed_skills: Optional[List[str]] = None
    estimated_experience_years: Optional[float] = None
    parsed_education: Optional[List[str]] = None
    parsed_entities: Optional[Dict] = None



class CandidateOut(CandidateBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
