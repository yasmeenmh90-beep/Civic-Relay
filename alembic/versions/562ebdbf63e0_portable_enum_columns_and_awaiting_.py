"""portable enum columns and awaiting_approval status

Revision ID: 562ebdbf63e0
Revises: 002fcef849d0
Create Date: 2026-08-24 16:40:49.877695

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '562ebdbf63e0'
down_revision: Union[str, None] = '002fcef849d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # batch_alter_table: required for SQLite (no ALTER COLUMN TYPE support),
    # works transparently on Postgres/MySQL too.
    with op.batch_alter_table('issues') as batch_op:
        batch_op.alter_column('severity',
                   existing_type=sa.VARCHAR(length=9),
                   type_=sa.Enum('LOW', 'NORMAL', 'HIGH', 'EMERGENCY', name='severity', native_enum=False, length=20),
                   existing_nullable=True)
    with op.batch_alter_table('tickets') as batch_op:
        batch_op.alter_column('status',
                   existing_type=sa.VARCHAR(length=21),
                   type_=sa.Enum('SUBMITTED', 'WAITING_FOR_AUTHORITY', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'ESCALATED', 'RESOLVED', name='ticketstatus', native_enum=False, length=30),
                   existing_nullable=True)


def downgrade() -> None:
    with op.batch_alter_table('tickets') as batch_op:
        batch_op.alter_column('status',
                   existing_type=sa.Enum('SUBMITTED', 'WAITING_FOR_AUTHORITY', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'ESCALATED', 'RESOLVED', name='ticketstatus', native_enum=False, length=30),
                   type_=sa.VARCHAR(length=21),
                   existing_nullable=True)
    with op.batch_alter_table('issues') as batch_op:
        batch_op.alter_column('severity',
                   existing_type=sa.Enum('LOW', 'NORMAL', 'HIGH', 'EMERGENCY', name='severity', native_enum=False, length=20),
                   type_=sa.VARCHAR(length=9),
                   existing_nullable=True)
