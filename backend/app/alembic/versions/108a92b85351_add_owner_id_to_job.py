from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '108a92b85351'
down_revision = '108a92b85350'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('job', sa.Column('owner_id', sa.UUID(), nullable=True))

def downgrade():
    op.drop_column('job', 'owner_id')