"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2026-06-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE userrole AS ENUM ('admin', 'manager', 'staff')")
    op.execute("CREATE TYPE propertytype AS ENUM ('mini_apartment', 'room_rental', 'dormitory')")
    op.execute("CREATE TYPE roomstatus AS ENUM ('available', 'occupied', 'maintenance')")
    op.execute("CREATE TYPE contractstatus AS ENUM ('draft', 'active', 'expired', 'cancelled')")
    op.execute("CREATE TYPE paymentcycle AS ENUM ('monthly', 'quarterly', 'yearly')")
    op.execute("CREATE TYPE invoicestatus AS ENUM ('unpaid', 'paid', 'overdue', 'cancelled')")
    op.execute("CREATE TYPE maintenancestatus AS ENUM ('pending', 'in_progress', 'completed', 'cancelled')")
    op.execute("CREATE TYPE expensecategory AS ENUM ('utilities', 'maintenance', 'salary', 'insurance', 'tax', 'marketing', 'supplies', 'other')")
    op.execute("CREATE TYPE notificationtype AS ENUM ('payment_due', 'payment_overdue', 'contract_expiring', 'maintenance_request', 'room_available', 'system')")
    op.execute("CREATE TYPE attachmenttype AS ENUM ('image', 'document', 'video', 'other')")
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', postgresql.ENUM(name='userrole', create_type=False), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('avatar', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    
    # Create properties table
    op.create_table('properties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', postgresql.ENUM(name='propertytype', create_type=False), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('total_floors', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('total_rooms', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('contact_name', sa.String(length=255), nullable=True),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('default_electricity_price', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('default_water_price', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('default_internet_fee', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('default_cleaning_fee', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('default_parking_fee', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_properties_id'), 'properties', ['id'], unique=False)
    op.create_index(op.f('ix_properties_name'), 'properties', ['name'], unique=False)
    
    # Create floors table
    op.create_table('floors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('floor_number', sa.Integer(), nullable=False),
        sa.Column('floor_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_floors_id'), 'floors', ['id'], unique=False)
    
    # Create rooms table
    op.create_table('rooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('floor_id', sa.Integer(), nullable=True),
        sa.Column('room_code', sa.String(length=50), nullable=False),
        sa.Column('room_name', sa.String(length=255), nullable=False),
        sa.Column('area', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('capacity', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('rent_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('electricity_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('water_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('internet_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('cleaning_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('parking_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('other_fees', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('status', postgresql.ENUM(name='roomstatus', create_type=False), nullable=False, server_default='available'),
        sa.Column('is_dormitory', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('amenities', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['floor_id'], ['floors.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_rooms_id'), 'rooms', ['id'], unique=False)
    op.create_index(op.f('ix_rooms_room_code'), 'rooms', ['room_code'], unique=False)
    
    # Create beds table
    op.create_table('beds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('bed_code', sa.String(length=50), nullable=False),
        sa.Column('bed_name', sa.String(length=100), nullable=False),
        sa.Column('is_occupied', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_beds_bed_code'), 'beds', ['bed_code'], unique=False)
    op.create_index(op.f('ix_beds_id'), 'beds', ['id'], unique=False)
    
    # Create tenants table
    op.create_table('tenants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('id_card_number', sa.String(length=20), nullable=True),
        sa.Column('id_card_issue_date', sa.Date(), nullable=True),
        sa.Column('id_card_issue_place', sa.String(length=255), nullable=True),
        sa.Column('id_card_front_image', sa.String(length=500), nullable=True),
        sa.Column('id_card_back_image', sa.String(length=500), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('permanent_address', sa.Text(), nullable=True),
        sa.Column('vehicle_plate', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_name', sa.String(length=255), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('occupation', sa.String(length=255), nullable=True),
        sa.Column('company', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tenants_full_name'), 'tenants', ['full_name'], unique=False)
    op.create_index(op.f('ix_tenants_id'), 'tenants', ['id'], unique=False)
    op.create_index(op.f('ix_tenants_id_card_number'), 'tenants', ['id_card_number'], unique=True)
    
    # Create contracts table
    op.create_table('contracts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('contract_code', sa.String(length=50), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('bed_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('payment_day', sa.Integer(), nullable=False),
        sa.Column('payment_cycle', postgresql.ENUM(name='paymentcycle', create_type=False), nullable=False, server_default='monthly'),
        sa.Column('rent_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('deposit_amount', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('terms_and_conditions', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', postgresql.ENUM(name='contractstatus', create_type=False), nullable=False, server_default='draft'),
        sa.Column('signed_date', sa.Date(), nullable=True),
        sa.Column('landlord_signature', sa.String(length=500), nullable=True),
        sa.Column('tenant_signature', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['bed_id'], ['beds.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contracts_contract_code'), 'contracts', ['contract_code'], unique=True)
    op.create_index(op.f('ix_contracts_id'), 'contracts', ['id'], unique=False)
    
    # Create invoices table
    op.create_table('invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_code', sa.String(length=50), nullable=False),
        sa.Column('contract_id', sa.Integer(), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('status', postgresql.ENUM(name='invoicestatus', create_type=False), nullable=False, server_default='unpaid'),
        sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('tax', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('discount', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('paid_amount', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('payment_reference', sa.String(length=100), nullable=True),
        sa.Column('payment_notes', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invoices_id'), 'invoices', ['id'], unique=False)
    op.create_index(op.f('ix_invoices_invoice_code'), 'invoices', ['invoice_code'], unique=True)
    
    # Create meter_readings table
    op.create_table('meter_readings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('reading_date', sa.Date(), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('electricity_previous', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('electricity_current', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('electricity_usage', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('electricity_price', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('electricity_amount', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('electricity_image', sa.String(length=500), nullable=True),
        sa.Column('water_previous', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('water_current', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('water_usage', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('water_price', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('water_amount', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('water_image', sa.String(length=500), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_meter_readings_id'), 'meter_readings', ['id'], unique=False)
    
    # Create invoice_items table
    op.create_table('invoice_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=10, scale=2), nullable=True, server_default='1'),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('item_type', sa.String(length=50), nullable=True),
        sa.Column('meter_reading_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['meter_reading_id'], ['meter_readings.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invoice_items_id'), 'invoice_items', ['id'], unique=False)
    
    # Create maintenance_requests table
    op.create_table('maintenance_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=True, server_default='medium'),
        sa.Column('status', postgresql.ENUM(name='maintenancestatus', create_type=False), nullable=False, server_default='pending'),
        sa.Column('estimated_cost', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('actual_cost', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('reported_date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('started_date', sa.DateTime(), nullable=True),
        sa.Column('completed_date', sa.DateTime(), nullable=True),
        sa.Column('assigned_to', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_requests_id'), 'maintenance_requests', ['id'], unique=False)
    
    # Create expenses table
    op.create_table('expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', postgresql.ENUM(name='expensecategory', create_type=False), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('expense_date', sa.Date(), nullable=False),
        sa.Column('vendor', sa.String(length=255), nullable=True),
        sa.Column('receipt_number', sa.String(length=100), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expenses_id'), 'expenses', ['id'], unique=False)
    
    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('type', postgresql.ENUM(name='notificationtype', create_type=False), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('reference_id', sa.Integer(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    
    # Create attachments table
    op.create_table('attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('type', postgresql.ENUM(name='attachmenttype', create_type=False), nullable=True, server_default='document'),
        sa.Column('property_id', sa.Integer(), nullable=True),
        sa.Column('room_id', sa.Integer(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('contract_id', sa.Integer(), nullable=True),
        sa.Column('maintenance_request_id', sa.Integer(), nullable=True),
        sa.Column('expense_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['maintenance_request_id'], ['maintenance_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attachments_id'), 'attachments', ['id'], unique=False)
    
    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('changes', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)


def downgrade() -> None:
    # Drop all tables
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')
    
    op.drop_index(op.f('ix_attachments_id'), table_name='attachments')
    op.drop_table('attachments')
    
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
    
    op.drop_index(op.f('ix_expenses_id'), table_name='expenses')
    op.drop_table('expenses')
    
    op.drop_index(op.f('ix_maintenance_requests_id'), table_name='maintenance_requests')
    op.drop_table('maintenance_requests')
    
    op.drop_index(op.f('ix_invoice_items_id'), table_name='invoice_items')
    op.drop_table('invoice_items')
    
    op.drop_index(op.f('ix_meter_readings_id'), table_name='meter_readings')
    op.drop_table('meter_readings')
    
    op.drop_index(op.f('ix_invoices_invoice_code'), table_name='invoices')
    op.drop_index(op.f('ix_invoices_id'), table_name='invoices')
    op.drop_table('invoices')
    
    op.drop_index(op.f('ix_contracts_contract_code'), table_name='contracts')
    op.drop_index(op.f('ix_contracts_id'), table_name='contracts')
    op.drop_table('contracts')
    
    op.drop_index(op.f('ix_tenants_id_card_number'), table_name='tenants')
    op.drop_index(op.f('ix_tenants_id'), table_name='tenants')
    op.drop_index(op.f('ix_tenants_full_name'), table_name='tenants')
    op.drop_table('tenants')
    
    op.drop_index(op.f('ix_beds_id'), table_name='beds')
    op.drop_index(op.f('ix_beds_bed_code'), table_name='beds')
    op.drop_table('beds')
    
    op.drop_index(op.f('ix_rooms_room_code'), table_name='rooms')
    op.drop_index(op.f('ix_rooms_id'), table_name='rooms')
    op.drop_table('rooms')
    
    op.drop_index(op.f('ix_floors_id'), table_name='floors')
    op.drop_table('floors')
    
    op.drop_index(op.f('ix_properties_name'), table_name='properties')
    op.drop_index(op.f('ix_properties_id'), table_name='properties')
    op.drop_table('properties')
    
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # Drop enum types
    op.execute('DROP TYPE attachmenttype')
    op.execute('DROP TYPE notificationtype')
    op.execute('DROP TYPE expensecategory')
    op.execute('DROP TYPE maintenancestatus')
    op.execute('DROP TYPE invoicestatus')
    op.execute('DROP TYPE paymentcycle')
    op.execute('DROP TYPE contractstatus')
    op.execute('DROP TYPE roomstatus')
    op.execute('DROP TYPE propertytype')
    op.execute('DROP TYPE userrole')
