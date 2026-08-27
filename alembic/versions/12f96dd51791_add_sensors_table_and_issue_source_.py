"""add sensors table and issue source/sensor_id for IoT monitoring

Revision ID: 12f96dd51791
Revises: 813d75cd0cfe
Create Date: 2026-08-25 10:54:40.209542

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12f96dd51791'
down_revision: Union[str, None] = '813d75cd0cfe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('sensors',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('sensor_id', sa.String(), nullable=False),
    sa.Column('sensor_type', sa.String(), nullable=False),
    sa.Column('latitude', sa.Float(), nullable=True),
    sa.Column('longitude', sa.Float(), nullable=True),
    sa.Column('registered_at', sa.DateTime(), nullable=True),
    sa.Column('last_seen_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('sensor_id')
    )
    # batch_alter_table: required for SQLite (no direct ALTER TABLE ADD
    # FOREIGN KEY support), works transparently on Postgres/MySQL too.
    with op.batch_alter_table('issues') as batch_op:
        batch_op.add_column(sa.Column('source', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('sensor_id', sa.String(), nullable=True))
        batch_op.create_foreign_key('fk_issues_sensor_id', 'sensors', ['sensor_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('issues') as batch_op:
        batch_op.drop_constraint('fk_issues_sensor_id', type_='foreignkey')
        batch_op.drop_column('sensor_id')
        batch_op.drop_column('source')
    op.drop_table('sensors')
