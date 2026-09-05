"""add required_skills to job_postings

Revision ID: 002_add_required_skills
Revises: 001_initial_schema
Create Date: 2026-09-05 15:48:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_required_skills'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('job_postings', sa.Column('required_skills', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('job_postings', 'required_skills')
