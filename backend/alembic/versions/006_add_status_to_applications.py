"""add status to applications

Revision ID: 006_add_status
Revises: 005_add_match_score
Create Date: 2026-09-06 12:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '006_add_status'
down_revision: Union[str, None] = '005_add_match_score'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

processing_status_enum = sa.Enum('PENDING', 'PROCESSING', 'SCORED', 'FAILED', name='processingstatus')

def upgrade() -> None:
    processing_status_enum.create(op.get_bind(), checkfirst=True)
    op.add_column('applications', sa.Column('status', processing_status_enum, nullable=False, server_default='PENDING'))

def downgrade() -> None:
    op.drop_column('applications', 'status')
    processing_status_enum.drop(op.get_bind(), checkfirst=True)
