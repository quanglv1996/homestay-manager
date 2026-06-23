"""add_soft_delete_and_enhanced_audit_log

Revision ID: 002
Revises: 001
Create Date: 2026-06-23

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add soft delete fields to properties table
    op.add_column('properties', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('properties', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('properties', sa.Column('deleted_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_properties_deleted_by', 'properties', 'users', ['deleted_by_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_properties_is_deleted', 'properties', ['is_deleted'])
    
    # Add soft delete fields to rooms table
    op.add_column('rooms', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('rooms', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('rooms', sa.Column('deleted_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_rooms_deleted_by', 'rooms', 'users', ['deleted_by_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_rooms_is_deleted', 'rooms', ['is_deleted'])
    
    # Add soft delete fields to tenants table
    op.add_column('tenants', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('tenants', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('tenants', sa.Column('deleted_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_tenants_deleted_by', 'tenants', 'users', ['deleted_by_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_tenants_is_deleted', 'tenants', ['is_deleted'])
    
    # Add soft delete fields to contracts table
    op.add_column('contracts', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('contracts', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('contracts', sa.Column('deleted_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_contracts_deleted_by', 'contracts', 'users', ['deleted_by_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_contracts_is_deleted', 'contracts', ['is_deleted'])
    
    # Add soft delete fields to invoices table
    op.add_column('invoices', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('invoices', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('invoices', sa.Column('deleted_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_invoices_deleted_by', 'invoices', 'users', ['deleted_by_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_invoices_is_deleted', 'invoices', ['is_deleted'])
    
    # Add soft delete fields to maintenance_requests table
    op.add_column('maintenance_requests', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('maintenance_requests', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('maintenance_requests', sa.Column('deleted_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_maintenance_requests_deleted_by', 'maintenance_requests', 'users', ['deleted_by_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_maintenance_requests_is_deleted', 'maintenance_requests', ['is_deleted'])
    
    # Add soft delete fields to expenses table
    op.add_column('expenses', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('expenses', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('expenses', sa.Column('deleted_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_expenses_deleted_by', 'expenses', 'users', ['deleted_by_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_expenses_is_deleted', 'expenses', ['is_deleted'])
    
    # Enhance audit_logs table
    op.add_column('audit_logs', sa.Column('old_value', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('audit_logs', sa.Column('new_value', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.create_index('ix_audit_logs_entity_type', 'audit_logs', ['entity_type'])
    op.create_index('ix_audit_logs_entity_id', 'audit_logs', ['entity_id'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade() -> None:
    # Remove audit_logs enhancements
    op.drop_index('ix_audit_logs_created_at', table_name='audit_logs')
    op.drop_index('ix_audit_logs_entity_id', table_name='audit_logs')
    op.drop_index('ix_audit_logs_entity_type', table_name='audit_logs')
    op.drop_column('audit_logs', 'new_value')
    op.drop_column('audit_logs', 'old_value')
    
    # Remove soft delete from expenses
    op.drop_index('ix_expenses_is_deleted', table_name='expenses')
    op.drop_constraint('fk_expenses_deleted_by', 'expenses', type_='foreignkey')
    op.drop_column('expenses', 'deleted_by_id')
    op.drop_column('expenses', 'deleted_at')
    op.drop_column('expenses', 'is_deleted')
    
    # Remove soft delete from maintenance_requests
    op.drop_index('ix_maintenance_requests_is_deleted', table_name='maintenance_requests')
    op.drop_constraint('fk_maintenance_requests_deleted_by', 'maintenance_requests', type_='foreignkey')
    op.drop_column('maintenance_requests', 'deleted_by_id')
    op.drop_column('maintenance_requests', 'deleted_at')
    op.drop_column('maintenance_requests', 'is_deleted')
    
    # Remove soft delete from invoices
    op.drop_index('ix_invoices_is_deleted', table_name='invoices')
    op.drop_constraint('fk_invoices_deleted_by', 'invoices', type_='foreignkey')
    op.drop_column('invoices', 'deleted_by_id')
    op.drop_column('invoices', 'deleted_at')
    op.drop_column('invoices', 'is_deleted')
    
    # Remove soft delete from contracts
    op.drop_index('ix_contracts_is_deleted', table_name='contracts')
    op.drop_constraint('fk_contracts_deleted_by', 'contracts', type_='foreignkey')
    op.drop_column('contracts', 'deleted_by_id')
    op.drop_column('contracts', 'deleted_at')
    op.drop_column('contracts', 'is_deleted')
    
    # Remove soft delete from tenants
    op.drop_index('ix_tenants_is_deleted', table_name='tenants')
    op.drop_constraint('fk_tenants_deleted_by', 'tenants', type_='foreignkey')
    op.drop_column('tenants', 'deleted_by_id')
    op.drop_column('tenants', 'deleted_at')
    op.drop_column('tenants', 'is_deleted')
    
    # Remove soft delete from rooms
    op.drop_index('ix_rooms_is_deleted', table_name='rooms')
    op.drop_constraint('fk_rooms_deleted_by', 'rooms', type_='foreignkey')
    op.drop_column('rooms', 'deleted_by_id')
    op.drop_column('rooms', 'deleted_at')
    op.drop_column('rooms', 'is_deleted')
    
    # Remove soft delete from properties
    op.drop_index('ix_properties_is_deleted', table_name='properties')
    op.drop_constraint('fk_properties_deleted_by', 'properties', type_='foreignkey')
    op.drop_column('properties', 'deleted_by_id')
    op.drop_column('properties', 'deleted_at')
    op.drop_column('properties', 'is_deleted')
