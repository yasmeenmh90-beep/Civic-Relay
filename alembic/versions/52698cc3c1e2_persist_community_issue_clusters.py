"""persist community issue clusters

Revision ID: 52698cc3c1e2
Revises: 0db7fa0cb622
Create Date: 2026-08-24 19:17:57.841100

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52698cc3c1e2'
down_revision: Union[str, None] = '0db7fa0cb622'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('issue_clusters',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('category', sa.String(), nullable=False),
    sa.Column('center_lat', sa.Float(), nullable=False),
    sa.Column('center_lng', sa.Float(), nullable=False),
    sa.Column('report_count', sa.Integer(), nullable=True),
    sa.Column('severity', sa.String(), nullable=False),
    sa.Column('first_reported', sa.DateTime(), nullable=False),
    sa.Column('latest_reported', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    # batch_alter_table: required for SQLite (no direct ALTER TABLE ADD
    # FOREIGN KEY support), works transparently on Postgres/MySQL too.
    with op.batch_alter_table('issues') as batch_op:
        batch_op.add_column(sa.Column('cluster_id', sa.String(), nullable=True))
        batch_op.create_foreign_key('fk_issues_cluster_id', 'issue_clusters', ['cluster_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('issues') as batch_op:
        batch_op.drop_constraint('fk_issues_cluster_id', type_='foreignkey')
        batch_op.drop_column('cluster_id')
    op.drop_table('issue_clusters')
