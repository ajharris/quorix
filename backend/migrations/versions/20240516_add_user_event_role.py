"""
Add user_event_roles table for event-dependent user roles
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20240516_add_user_event_role'
down_revision = 'ccf06500088f'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'user_event_roles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('events.id'), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.UniqueConstraint('user_id', 'event_id', 'role', name='uq_user_event_role')
    )

def downgrade():
    op.drop_table('user_event_roles')
