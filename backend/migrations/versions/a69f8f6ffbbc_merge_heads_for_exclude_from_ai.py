"""merge heads for exclude_from_ai

Revision ID: a69f8f6ffbbc
Revises: 20240517_add_exclude_from_ai_to_questions, 163a929792a5
Create Date: 2025-05-17 20:53:09.557852

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a69f8f6ffbbc'
down_revision = ('20240517_add_exclude_from_ai_to_questions', '163a929792a5')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
