"""add resume_text to candidates

Revision ID: 003_add_resume_text
Revises: 002_add_required_skills
Create Date: 2026-09-06 10:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_add_resume_text'
down_revision: Union[str, None] = '002_add_required_skills'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('candidates', sa.Column('resume_text', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('candidates', 'resume_text')
