"""add_attachment_enhancements

Revision ID: 003
Revises: 002
Create Date: 2026-06-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new fields to attachments table
    op.add_column('attachments', sa.Column('file_hash', sa.String(length=64), nullable=True))
    op.add_column('attachments', sa.Column('description', sa.String(length=500), nullable=True))
    op.add_column('attachments', sa.Column('uploaded_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_attachments_uploaded_by', 'attachments', 'users', ['uploaded_by_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # Remove foreign key and columns
    op.drop_constraint('fk_attachments_uploaded_by', 'attachments', type_='foreignkey')
    op.drop_column('attachments', 'uploaded_by_id')
    op.drop_column('attachments', 'description')
    op.drop_column('attachments', 'file_hash')
