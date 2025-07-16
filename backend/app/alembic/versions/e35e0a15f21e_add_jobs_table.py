"""add jobs table

Revision ID: e35e0a15f21e
Revises: 1a31ce608336
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'e35e0a15f21e'
down_revision = '1a31ce608336'
branch_labels = None
depends_on = None


def upgrade():
    # Check if files column exists before adding it
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('job')]
    
    if 'files' not in columns:
        op.add_column('job', sa.Column('files', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        
    op.alter_column('job', 'description',
        existing_type=sa.String(length=255),
        type_=sa.String(length=10000),
        existing_nullable=True
    )


def downgrade():
    # Remove files column from job table
    op.alter_column('job', 'description',
        existing_type=sa.String(length=1000),
        type_=sa.String(length=255),
        existing_nullable=True
    )
    op.drop_column('job', 'files')
