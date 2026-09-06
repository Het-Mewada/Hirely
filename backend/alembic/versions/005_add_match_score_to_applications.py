"""add match_score and score_breakdown to applications

Revision ID: 005_add_match_score
Revises: 004_add_parsed_fields
Create Date: 2026-09-06 11:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005_add_match_score'
down_revision: Union[str, None] = '004_add_parsed_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('applications', sa.Column('match_score', sa.Float(), nullable=True))
    op.add_column('applications', sa.Column('score_breakdown', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('applications', 'score_breakdown')
    op.drop_column('applications', 'match_score')
