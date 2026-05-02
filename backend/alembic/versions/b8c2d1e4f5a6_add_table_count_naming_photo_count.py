"""add table_count, table_naming, photo_count, cover_image_url

Revision ID: b8c2d1e4f5a6
Revises: 444b712e1faf
Create Date: 2026-05-02 18:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b8c2d1e4f5a6'
down_revision: Union[str, None] = '444b712e1faf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add table_count and table_naming to events
    op.add_column('events', sa.Column('table_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('events', sa.Column('table_naming', sa.String(20), nullable=False, server_default='numeric'))
    op.add_column('events', sa.Column('cover_image_url', sa.String(500), nullable=True))

    # Add photo_count to event_tables, make name nullable
    op.add_column('event_tables', sa.Column('photo_count', sa.Integer(), nullable=False, server_default='0'))
    op.alter_column('event_tables', 'name', nullable=True)


def downgrade() -> None:
    op.drop_column('events', 'table_count')
    op.drop_column('events', 'table_naming')
    op.drop_column('events', 'cover_image_url')
    op.drop_column('event_tables', 'photo_count')
    op.alter_column('event_tables', 'name', nullable=False)
