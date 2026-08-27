"""add phone field for whatsapp reporting

Revision ID: 813d75cd0cfe
Revises: 7430cc082692
Create Date: 2026-08-25 10:13:19.715062

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '813d75cd0cfe'
down_revision: Union[str, None] = '7430cc082692'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('phone', sa.String(), nullable=True))
        batch_op.create_unique_constraint('uq_users_phone', ['phone'])


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('uq_users_phone', type_='unique')
        batch_op.drop_column('phone')
