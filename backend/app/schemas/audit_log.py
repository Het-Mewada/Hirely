from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime
from app.schemas.user import UserOut

class AuditLogOut(BaseModel):
    id: UUID
    organization_id: UUID
    user_id: Optional[UUID] = Field(None, description="Actor user ID who performed the action")
    actor_id: Optional[UUID] = Field(None, description="Alias for user_id")
    action: str = Field(..., description="Action performed, e.g. application.stage_changed, user.role_changed, job.updated")
    entity_type: Optional[str] = Field(None, description="Target entity type, e.g. Application, JobPosting, User")
    target_type: Optional[str] = Field(None, description="Alias for entity_type")
    entity_id: Optional[str] = Field(None, description="Target entity ID")
    target_id: Optional[str] = Field(None, description="Alias for entity_id")
    details: Optional[Dict] = Field(None, description="Event payload details")
    created_at: datetime
    user: Optional[UserOut] = None
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
