from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    slug: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationOut(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
