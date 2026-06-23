import json
import os
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.models import House, Room, Bed, Contract, Assignment, DashboardStats

# Data directory
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# File paths
FILES = {
    "houses": DATA_DIR / "houses.json",
    "rooms": DATA_DIR / "rooms.json",
    "beds": DATA_DIR / "beds.json",
    "contracts": DATA_DIR / "contracts.json",
    "assignments": DATA_DIR / "assignments.json"
}

def initialize_data_files():
    """Initialize empty JSON files if they don't exist"""
    for file_path in FILES.values():
        if not file_path.exists():
            file_path.write_text("[]")

def read_data(file_key: str) -> List[dict]:
    """Read data from JSON file"""
    try:
        with open(FILES[file_key], 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {file_key}: {e}")
        return []

def write_data(file_key: str, data: List[dict]) -> bool:
    """Write data to JSON file"""
    try:
        with open(FILES[file_key], 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error writing {file_key}: {e}")
        return False

# Houses
def get_houses() -> List[dict]:
    return read_data("houses")

def get_house_by_id(house_id: str) -> Optional[dict]:
    houses = get_houses()
    return next((h for h in houses if h["id"] == house_id), None)

def create_house(house: House) -> dict:
    houses = get_houses()
    new_house = house.dict()
    new_house["id"] = str(uuid.uuid4())
    new_house["createdAt"] = datetime.now().isoformat()
    houses.append(new_house)
    write_data("houses", houses)
    return new_house

def update_house(house_id: str, house: House) -> Optional[dict]:
    houses = get_houses()
    for i, h in enumerate(houses):
        if h["id"] == house_id:
            updated = house.dict(exclude_unset=True)
            updated["id"] = house_id
            updated["updatedAt"] = datetime.now().isoformat()
            houses[i] = {**h, **updated}
            write_data("houses", houses)
            return houses[i]
    return None

def delete_house(house_id: str) -> bool:
    houses = get_houses()
    filtered = [h for h in houses if h["id"] != house_id]
    if len(filtered) == len(houses):
        return False
    
    # Delete related rooms and beds
    rooms = get_rooms()
    house_rooms = [r for r in rooms if r["houseId"] == house_id]
    for room in house_rooms:
        delete_room(room["id"])
    
    write_data("houses", filtered)
    return True

# Rooms
def get_rooms(house_id: Optional[str] = None) -> List[dict]:
    rooms = read_data("rooms")
    if house_id:
        return [r for r in rooms if r["houseId"] == house_id]
    return rooms

def get_room_by_id(room_id: str) -> Optional[dict]:
    rooms = get_rooms()
    return next((r for r in rooms if r["id"] == room_id), None)

def create_room(room: Room) -> dict:
    rooms = get_rooms()
    new_room = room.dict()
    new_room["id"] = str(uuid.uuid4())
    new_room["createdAt"] = datetime.now().isoformat()
    rooms.append(new_room)
    write_data("rooms", rooms)
    return new_room

def update_room(room_id: str, room: Room) -> Optional[dict]:
    rooms = get_rooms()
    for i, r in enumerate(rooms):
        if r["id"] == room_id:
            updated = room.dict(exclude_unset=True)
            updated["id"] = room_id
            updated["updatedAt"] = datetime.now().isoformat()
            rooms[i] = {**r, **updated}
            write_data("rooms", rooms)
            return rooms[i]
    return None

def delete_room(room_id: str) -> bool:
    rooms = get_rooms()
    filtered = [r for r in rooms if r["id"] != room_id]
    if len(filtered) == len(rooms):
        return False
    
    # Delete related beds
    beds = get_beds()
    room_beds = [b for b in beds if b["roomId"] == room_id]
    for bed in room_beds:
        delete_bed(bed["id"])
    
    write_data("rooms", filtered)
    return True

# Beds
def get_beds(room_id: Optional[str] = None) -> List[dict]:
    beds = read_data("beds")
    if room_id:
        return [b for b in beds if b["roomId"] == room_id]
    return beds

def get_bed_by_id(bed_id: str) -> Optional[dict]:
    beds = get_beds()
    return next((b for b in beds if b["id"] == bed_id), None)

def create_bed(bed: Bed) -> dict:
    beds = get_beds()
    new_bed = bed.dict()
    new_bed["id"] = str(uuid.uuid4())
    new_bed["createdAt"] = datetime.now().isoformat()
    beds.append(new_bed)
    write_data("beds", beds)
    return new_bed

def update_bed(bed_id: str, bed: Bed) -> Optional[dict]:
    beds = get_beds()
    for i, b in enumerate(beds):
        if b["id"] == bed_id:
            updated = bed.dict(exclude_unset=True)
            updated["id"] = bed_id
            updated["updatedAt"] = datetime.now().isoformat()
            beds[i] = {**b, **updated}
            write_data("beds", beds)
            return beds[i]
    return None

def delete_bed(bed_id: str) -> bool:
    beds = get_beds()
    filtered = [b for b in beds if b["id"] != bed_id]
    if len(filtered) == len(beds):
        return False
    
    # Delete related assignments
    assignments = get_assignments()
    filtered_assignments = [a for a in assignments if a["bedId"] != bed_id]
    write_data("assignments", filtered_assignments)
    
    write_data("beds", filtered)
    return True

# Contracts
def get_contracts() -> List[dict]:
    return read_data("contracts")

def get_contract_by_id(contract_id: str) -> Optional[dict]:
    contracts = get_contracts()
    return next((c for c in contracts if c["id"] == contract_id), None)

def create_contract(contract: Contract) -> dict:
    contracts = get_contracts()
    new_contract = contract.dict()
    new_contract["id"] = str(uuid.uuid4())
    new_contract["createdAt"] = datetime.now().isoformat()
    contracts.append(new_contract)
    write_data("contracts", contracts)
    return new_contract

def update_contract(contract_id: str, contract: Contract) -> Optional[dict]:
    contracts = get_contracts()
    for i, c in enumerate(contracts):
        if c["id"] == contract_id:
            updated = contract.dict(exclude_unset=True)
            updated["id"] = contract_id
            updated["updatedAt"] = datetime.now().isoformat()
            contracts[i] = {**c, **updated}
            write_data("contracts", contracts)
            return contracts[i]
    return None

def delete_contract(contract_id: str) -> bool:
    contracts = get_contracts()
    filtered = [c for c in contracts if c["id"] != contract_id]
    if len(filtered) == len(contracts):
        return False
    
    # Delete related assignments
    assignments = get_assignments()
    filtered_assignments = [a for a in assignments if a["contractId"] != contract_id]
    write_data("assignments", filtered_assignments)
    
    write_data("contracts", filtered)
    return True

# Assignments
def get_assignments() -> List[dict]:
    return read_data("assignments")

def get_assignment_by_bed_and_level(bed_id: str, level: str) -> Optional[dict]:
    assignments = get_assignments()
    return next((a for a in assignments if a["bedId"] == bed_id and a["level"] == level), None)

def get_assignments_by_bed_id(bed_id: str) -> List[dict]:
    assignments = get_assignments()
    return [a for a in assignments if a["bedId"] == bed_id]

def create_assignment(assignment: Assignment) -> dict:
    assignments = get_assignments()
    
    # Check if bed level is already assigned
    existing = next((a for a in assignments 
                    if a["bedId"] == assignment.bedId and a["level"] == assignment.level), None)
    if existing:
        raise ValueError(f"Bed level {assignment.level} is already assigned to a contract")
    
    new_assignment = assignment.dict()
    new_assignment["id"] = str(uuid.uuid4())
    new_assignment["createdAt"] = datetime.now().isoformat()
    assignments.append(new_assignment)
    write_data("assignments", assignments)
    return new_assignment

def delete_assignment(assignment_id: str) -> bool:
    assignments = get_assignments()
    filtered = [a for a in assignments if a["id"] != assignment_id]
    if len(filtered) == len(assignments):
        return False
    write_data("assignments", filtered)
    return True

def delete_assignment_by_bed_and_level(bed_id: str, level: str) -> bool:
    assignments = get_assignments()
    filtered = [a for a in assignments if not (a["bedId"] == bed_id and a["level"] == level)]
    write_data("assignments", filtered)
    return True

# Dashboard Stats
def get_dashboard_stats() -> dict:
    beds = get_beds()
    assignments = get_assignments()
    contracts = get_contracts()
    
    total_beds = len(beds)
    total_positions = total_beds * 2  # Each bed has 2 levels
    occupied_positions = len(assignments)
    available_positions = total_positions - occupied_positions
    
    today = datetime.now()
    in_7_days = today + timedelta(days=7)
    in_30_days = today + timedelta(days=30)
    
    payment_due_soon = 0
    contract_expiring_soon = 0
    
    for assignment in assignments:
        contract = next((c for c in contracts if c["id"] == assignment["contractId"]), None)
        if contract:
            start_date = datetime.fromisoformat(contract["startDate"].replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(contract["endDate"].replace('Z', '+00:00'))
            
            # Check payment due (monthly from start date)
            next_payment = start_date
            while next_payment < today:
                next_payment = datetime(
                    next_payment.year + (next_payment.month // 12),
                    (next_payment.month % 12) + 1,
                    next_payment.day
                )
            
            if next_payment <= in_7_days:
                payment_due_soon += 1
            
            # Check contract expiring
            if today < end_date <= in_30_days:
                contract_expiring_soon += 1
    
    return {
        "totalBeds": total_beds,
        "availablePositions": available_positions,
        "occupiedPositions": occupied_positions,
        "paymentDueSoon": payment_due_soon,
        "contractExpiringSoon": contract_expiring_soon
    }

# Initialize on module load
initialize_data_files()
