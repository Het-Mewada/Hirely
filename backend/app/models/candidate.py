import uuid
from sqlalchemy import Column, String, Text, Float, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base, TimestampMixin

class Candidate(Base, TimestampMixin):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    email = Column(String(255), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    resume_url = Column(String(500), nullable=True)
    resume_text = Column(Text, nullable=True)

    # spaCy Parsed Structured Data
    parsed_skills = Column(JSON, nullable=True)
    estimated_experience_years = Column(Float, nullable=True)
    parsed_education = Column(JSON, nullable=True)
    parsed_entities = Column(JSON, nullable=True)



    # Relationships
    organization = relationship("Organization", back_populates="candidates")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
