"""
Seed database with initial data
"""
import sys
import os
from datetime import datetime, date, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import *
from app.core.security import get_password_hash
from decimal import Decimal


def seed_users(db: Session):
    """Create initial users"""
    print("Creating users...")
    
    # Admin user
    admin = User(
        email=os.getenv("ADMIN_EMAIL", "admin@homestay.com"),
        full_name=os.getenv("ADMIN_FULL_NAME", "System Administrator"),
        hashed_password=get_password_hash(os.getenv("ADMIN_PASSWORD", "Admin@123456")),
        role="ADMIN",
        is_active=True,
        phone="0901234567"
    )
    db.add(admin)
    
    # Manager user
    manager = User(
        email="manager@homestay.com",
        full_name="Property Manager",
        hashed_password=get_password_hash("Manager@123"),
        role="MANAGER",
        is_active=True,
        phone="0901234568"
    )
    db.add(manager)
    
    # Staff user
    staff = User(
        email="staff@homestay.com",
        full_name="Staff Member",
        hashed_password=get_password_hash("Staff@123"),
        role="STAFF",
        is_active=True,
        phone="0901234569"
    )
    db.add(staff)
    
    db.commit()
    print("✓ Users created")


def seed_properties(db: Session):
    """Create sample properties"""
    print("Creating properties...")
    
    # Mini Apartment
    property1 = Property(
        name="Chung cư mini Hoàng Mai",
        type=PropertyType.MINI_APARTMENT,
        address="123 Đường Hoàng Mai, Quận Hoàng Mai, Hà Nội",
        description="Chung cư mini hiện đại, đầy đủ tiện nghi",
        total_floors=3,
        total_rooms=9,
        contact_name="Nguyễn Văn A",
        contact_phone="0912345678",
        contact_email="property1@example.com",
        default_electricity_price=Decimal("3500"),
        default_water_price=Decimal("25000"),
        default_internet_fee=Decimal("100000"),
        default_cleaning_fee=Decimal("50000"),
        default_parking_fee=Decimal("150000")
    )
    db.add(property1)
    db.flush()
    
    # Create floors and rooms for Mini Apartment
    for floor_num in range(1, 4):  # 3 floors
        floor = Floor(
            property_id=property1.id,
            floor_number=floor_num,
            floor_name=f"Tầng {floor_num}",
            description=f"Tầng {floor_num} - 3 phòng"
        )
        db.add(floor)
        db.flush()
        
        # Create 3 rooms per floor
        for room_num in range(1, 4):
            room_code = f"P{floor_num}0{room_num}"
            room = Room(
                property_id=property1.id,
                floor_id=floor.id,
                room_code=room_code,
                room_name=f"Phòng {room_code}",
                area=Decimal("25"),
                capacity=2,
                rent_price=Decimal("3500000"),
                electricity_price=Decimal("3500"),
                water_price=Decimal("25000"),
                internet_fee=Decimal("100000"),
                cleaning_fee=Decimal("50000"),
                parking_fee=Decimal("150000"),
                status=RoomStatus.AVAILABLE,
                description="Phòng trọ đầy đủ tiện nghi, có ban công",
                amenities='{"wifi": true, "ac": true, "wh": true, "kitchen": false}'
            )
            db.add(room)
    
    # Room Rental Property
    property2 = Property(
        name="Nhà trọ Nguyễn Trãi",
        type=PropertyType.ROOM_RENTAL,
        address="456 Đường Nguyễn Trãi, Quận Thanh Xuân, Hà Nội",
        description="Nhà trọ giá rẻ, gần trường đại học",
        total_floors=0,
        total_rooms=5,
        contact_name="Trần Thị B",
        contact_phone="0987654321",
        default_electricity_price=Decimal("3000"),
        default_water_price=Decimal("20000"),
        default_internet_fee=Decimal("80000"),
        default_cleaning_fee=Decimal("30000"),
        default_parking_fee=Decimal("100000")
    )
    db.add(property2)
    db.flush()
    
    # Create rooms for Room Rental
    room_names = ["Phòng A", "Phòng B", "Phòng C", "Phòng D", "Phòng E"]
    for idx, name in enumerate(room_names, 1):
        room = Room(
            property_id=property2.id,
            room_code=f"R{idx}",
            room_name=name,
            area=Decimal("20"),
            capacity=2,
            rent_price=Decimal("2500000"),
            electricity_price=Decimal("3000"),
            water_price=Decimal("20000"),
            internet_fee=Decimal("80000"),
            cleaning_fee=Decimal("30000"),
            parking_fee=Decimal("100000"),
            status=RoomStatus.AVAILABLE,
            description=f"{name} - Phòng trọ sinh viên",
            amenities='{"wifi": true, "ac": false, "wh": true, "kitchen": true}'
        )
        db.add(room)
    
    # Dormitory
    property3 = Property(
        name="Ký túc xá Sinh viên",
        type=PropertyType.DORMITORY,
        address="789 Đường Giải Phóng, Quận Hai Bà Trưng, Hà Nội",
        description="Ký túc xá cho sinh viên, giá rẻ",
        total_floors=0,
        total_rooms=3,
        contact_name="Lê Văn C",
        contact_phone="0965432187",
        default_electricity_price=Decimal("2500"),
        default_water_price=Decimal("15000"),
        default_internet_fee=Decimal("50000"),
        default_cleaning_fee=Decimal("20000"),
        default_parking_fee=Decimal("50000")
    )
    db.add(property3)
    db.flush()
    
    # Create dormitory rooms with beds
    dorm_configs = [
        ("D01", "Phòng D01", 8),
        ("D02", "Phòng D02", 10),
        ("D03", "Phòng D03", 6)
    ]
    
    for code, name, num_beds in dorm_configs:
        room = Room(
            property_id=property3.id,
            room_code=code,
            room_name=name,
            area=Decimal("40"),
            capacity=num_beds,
            rent_price=Decimal("800000"),
            electricity_price=Decimal("2500"),
            water_price=Decimal("15000"),
            internet_fee=Decimal("50000"),
            status=RoomStatus.AVAILABLE,
            is_dormitory=True,
            description=f"Phòng ký túc xá {num_beds} giường",
            amenities='{"wifi": true, "ac": true, "wh": true, "locker": true}'
        )
        db.add(room)
        db.flush()
        
        # Create beds for dormitory
        for bed_num in range(1, num_beds + 1):
            bed = Bed(
                room_id=room.id,
                bed_code=f"{code}-B{bed_num:02d}",
                bed_name=f"Giường {bed_num}",
                is_occupied=False
            )
            db.add(bed)
    
    db.commit()
    print("✓ Properties, floors, rooms, and beds created")


def seed_tenants(db: Session):
    """Create sample tenants"""
    print("Creating tenants...")
    
    tenants_data = [
        {
            "full_name": "Nguyễn Văn Minh",
            "date_of_birth": date(1995, 5, 15),
            "id_card_number": "001095012345",
            "phone": "0911111111",
            "email": "minhnv@email.com",
            "permanent_address": "Hà Nội",
            "occupation": "Nhân viên văn phòng"
        },
        {
            "full_name": "Trần Thị Lan",
            "date_of_birth": date(1998, 8, 20),
            "id_card_number": "001098054321",
            "phone": "0922222222",
            "email": "lantt@email.com",
            "permanent_address": "Hải Phòng",
            "occupation": "Sinh viên"
        },
        {
            "full_name": "Lê Hoàng Nam",
            "date_of_birth": date(1996, 3, 10),
            "id_card_number": "001096098765",
            "phone": "0933333333",
            "email": "namlh@email.com",
            "permanent_address": "Đà Nẵng",
            "occupation": "Kỹ sư"
        }
    ]
    
    for tenant_data in tenants_data:
        tenant = Tenant(**tenant_data)
        db.add(tenant)
    
    db.commit()
    print("✓ Tenants created")


def seed_contracts(db: Session):
    """Create sample contracts"""
    print("Creating contracts...")
    
    # Get first room and tenant
    room = db.query(Room).filter(Room.room_code == "P101").first()
    tenant = db.query(Tenant).first()
    
    if room and tenant:
        contract = Contract(
            contract_code="CT2026001",
            tenant_id=tenant.id,
            room_id=room.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            payment_day=15,
            payment_cycle=PaymentCycle.MONTHLY,
            rent_amount=room.rent_price,
            deposit_amount=room.rent_price * 2,
            status=ContractStatus.ACTIVE,
            signed_date=date.today(),
            terms_and_conditions="Các điều khoản và điều kiện tiêu chuẩn"
        )
        db.add(contract)
        
        # Update room status
        room.status = RoomStatus.OCCUPIED
        
        db.commit()
        print("✓ Contracts created")


def main():
    """Run all seed functions"""
    print("=" * 50)
    print("Starting database seeding...")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        seed_users(db)
        seed_properties(db)
        seed_tenants(db)
        seed_contracts(db)
        
        print("=" * 50)
        print("✓ Database seeding completed successfully!")
        print("=" * 50)
        print("\nDefault credentials:")
        print("Admin: admin@homestay.com / Admin@123456")
        print("Manager: manager@homestay.com / Manager@123")
        print("Staff: staff@homestay.com / Staff@123")
        print("=" * 50)
        
    except Exception as e:
        print(f"✗ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
