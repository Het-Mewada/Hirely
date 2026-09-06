"""add plan to organizations

Revision ID: 007_add_plan
Revises: 006_add_status
Create Date: 2026-09-06 13:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '007_add_plan'
down_revision: Union[str, None] = '006_add_status'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free' NOT NULL;")
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'annual';")
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;")
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_payment_txn VARCHAR(100);")

def downgrade() -> None:
    op.drop_column('organizations', 'last_payment_txn')
    op.drop_column('organizations', 'plan_expires_at')
    op.drop_column('organizations', 'billing_cycle')
    op.drop_column('organizations', 'plan')
