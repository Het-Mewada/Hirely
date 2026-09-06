"""add parsed fields to candidates

Revision ID: 004_add_parsed_fields
Revises: 003_add_resume_text
Create Date: 2026-09-06 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_add_parsed_fields'
down_revision: Union[str, None] = '003_add_resume_text'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('candidates', sa.Column('parsed_skills', sa.JSON(), nullable=True))
    op.add_column('candidates', sa.Column('estimated_experience_years', sa.Float(), nullable=True))
    op.add_column('candidates', sa.Column('parsed_education', sa.JSON(), nullable=True))
    op.add_column('candidates', sa.Column('parsed_entities', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('candidates', 'parsed_entities')
    op.drop_column('candidates', 'parsed_education')
    op.drop_column('candidates', 'estimated_experience_years')
    op.drop_column('candidates', 'parsed_skills')
