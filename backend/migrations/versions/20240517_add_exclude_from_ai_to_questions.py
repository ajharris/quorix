"""
Add exclude_from_ai field to questions table
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20240517_add_exclude_from_ai_to_questions'
down_revision = '20240516_add_user_event_role'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('questions', sa.Column('exclude_from_ai', sa.Boolean(), nullable=False, server_default=sa.false()))

def downgrade():
    op.drop_column('questions', 'exclude_from_ai')
