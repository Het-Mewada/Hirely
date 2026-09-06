from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    slug: str
    plan: str = "free"

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationOut(OrganizationBase):
    id: UUID
    plan: str = "free"
    billing_cycle: Optional[str] = "annual"
    plan_expires_at: Optional[datetime] = None
    last_payment_txn: Optional[str] = None
    cancel_at_period_end: Optional[bool] = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PlanUpdateRequest(BaseModel):
    plan: str = Field(..., description="Plan tier: 'free' or 'pro'")

class CheckoutRequest(BaseModel):
    plan_tier: str = Field("pro", description="Selected plan: 'pro' or 'free'")
    billing_cycle: str = Field("annual", description="Billing cycle: 'annual' (1 Year) or 'monthly'")
    card_number: str = Field(..., description="Credit card number")
    card_exp: str = Field(..., description="Card expiration MM/YY")
    card_cvc: str = Field(..., description="CVC code")
    cardholder_name: Optional[str] = Field("Authorized Subscriber", description="Cardholder full name")

class CheckoutResponse(BaseModel):
    status: str = "success"
    message: str
    organization: OrganizationOut
    receipt: Dict[str, Any]
