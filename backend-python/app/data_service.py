import json
import os
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.models import House, Room, Bed, Contract, Assignment, DashboardStats, UtilityBill, Expense, RevenueStats, RentExpense

# Data directory
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# File paths
FILES = {
    "houses": DATA_DIR / "houses.json",
    "rooms": DATA_DIR / "rooms.json",
    "beds": DATA_DIR / "beds.json",
    "contracts": DATA_DIR / "contracts.json",
    "assignments": DATA_DIR / "assignments.json",
    "utility_bills": DATA_DIR / "utility_bills.json",
    "expenses": DATA_DIR / "expenses.json",
    "rent_expenses": DATA_DIR / "rent_expenses.json",
    "rent_collections": DATA_DIR / "rent_collections.json"
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

def get_contracts_with_assignments() -> List[dict]:
    """Get all contracts enriched with assignment information (Dome, Room, Bed)"""
    contracts = get_contracts()
    assignments = get_assignments()
    houses = get_houses()
    rooms = get_rooms()
    beds = get_beds()
    
    enriched = []
    for contract in contracts:
        contract_copy = contract.copy()
        
        # Find assignments for this contract
        contract_assignments = [a for a in assignments if a["contractId"] == contract["id"]]
        
        # Add assignment details
        if contract_assignments:
            assignment_details = []
            for assignment in contract_assignments:
                bed = next((b for b in beds if b["id"] == assignment["bedId"]), None)
                if bed:
                    room = next((r for r in rooms if r["id"] == bed["roomId"]), None)
                    if room:
                        house = next((h for h in houses if h["id"] == room["houseId"]), None)
                        assignment_details.append({
                            "assignmentId": assignment["id"],
                            "level": assignment["level"],
                            "bedName": bed["name"],
                            "roomName": room["name"],
                            "houseName": house["name"] if house else "N/A"
                        })
            
            contract_copy["assignments"] = assignment_details
        else:
            contract_copy["assignments"] = []
        
        enriched.append(contract_copy)
    
    return enriched

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
    existing_level = next((a for a in assignments 
                    if a["bedId"] == assignment.bedId and a["level"] == assignment.level), None)
    if existing_level:
        raise ValueError(f"Vị trí {assignment.level} của giường này đã được gán hợp đồng rồi")
    
    # Check if contract is already assigned to another level in the same bed
    existing_contract_in_bed = next((a for a in assignments
                    if a["bedId"] == assignment.bedId and a["contractId"] == assignment.contractId), None)
    if existing_contract_in_bed:
        raise ValueError(f"Hợp đồng này đã được gán vào giường khác (vị trí {existing_contract_in_bed['level']})")
    
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

# Utility Bills
def get_utility_bills(contract_id: Optional[str] = None, month: Optional[str] = None) -> List[dict]:
    """Get utility bills, optionally filtered by contract or month"""
    bills = read_data("utility_bills")
    if contract_id:
        bills = [b for b in bills if b["contractId"] == contract_id]
    if month:
        bills = [b for b in bills if b["month"] == month]
    return bills

def get_utility_bill_by_id(bill_id: str) -> Optional[dict]:
    bills = get_utility_bills()
    return next((b for b in bills if b["id"] == bill_id), None)

def create_utility_bill(bill: UtilityBill) -> dict:
    bills = get_utility_bills()
    new_bill = bill.dict()
    new_bill["id"] = str(uuid.uuid4())
    new_bill["createdAt"] = datetime.now().isoformat()
    bills.append(new_bill)
    write_data("utility_bills", bills)
    return new_bill

def update_utility_bill(bill_id: str, bill: UtilityBill) -> Optional[dict]:
    bills = get_utility_bills()
    for i, b in enumerate(bills):
        if b["id"] == bill_id:
            updated = bill.dict(exclude_unset=True)
            updated["id"] = bill_id
            updated["updatedAt"] = datetime.now().isoformat()
            bills[i] = {**b, **updated}
            write_data("utility_bills", bills)
            return bills[i]
    return None

def delete_utility_bill(bill_id: str) -> bool:
    bills = get_utility_bills()
    filtered = [b for b in bills if b["id"] != bill_id]
    if len(filtered) == len(bills):
        return False
    write_data("utility_bills", filtered)
    return True

# Expenses
def get_expenses(house_id: Optional[str] = None, month: Optional[str] = None) -> List[dict]:
    """Get expenses, optionally filtered by house or month"""
    expenses = read_data("expenses")
    if house_id:
        expenses = [e for e in expenses if e.get("houseId") == house_id]
    if month:
        # Filter by month from date field (YYYY-MM format)
        expenses = [e for e in expenses if e["date"][:7] == month]
    return expenses

def get_expense_by_id(expense_id: str) -> Optional[dict]:
    expenses = get_expenses()
    return next((e for e in expenses if e["id"] == expense_id), None)

def create_expense(expense: Expense) -> dict:
    expenses = get_expenses()
    new_expense = expense.dict()
    new_expense["id"] = str(uuid.uuid4())
    new_expense["createdAt"] = datetime.now().isoformat()
    expenses.append(new_expense)
    write_data("expenses", expenses)
    return new_expense

def update_expense(expense_id: str, expense: Expense) -> Optional[dict]:
    expenses = get_expenses()
    for i, e in enumerate(expenses):
        if e["id"] == expense_id:
            updated = expense.dict(exclude_unset=True)
            updated["id"] = expense_id
            updated["updatedAt"] = datetime.now().isoformat()
            expenses[i] = {**e, **updated}
            write_data("expenses", expenses)
            return expenses[i]
    return None

def delete_expense(expense_id: str) -> bool:
    expenses = get_expenses()
    filtered = [e for e in expenses if e["id"] != expense_id]
    if len(filtered) == len(expenses):
        return False
    write_data("expenses", filtered)
    return True

def get_revenue_stats(month: str) -> dict:
    """
    Calculate revenue statistics for a specific month (YYYY-MM)
    Revenue = Actual RentCollections (tiền thu được)
    Projected Revenue = Active contract fees (tiền dự kiến)
    Expenses = Regular expenses + Rent expenses
    Net Revenue = Actual Revenue + Utility bills paid - Expenses
    """
    contracts = get_contracts()
    assignments = get_assignments()
    rent_collections = get_rent_collections(month=month)
    utility_bills = get_utility_bills(month=month)
    expenses = get_expenses(month=month)
    rent_expenses = get_rent_expenses(month=month)
    
    # Calculate actual revenue from rent collections only
    total_revenue = 0.0
    for collection in rent_collections:
        if collection.get("isCollected"):
            contract = next((c for c in contracts if c["id"] == collection["contractId"]), None)
            if contract:
                total_revenue += contract["price"]
                if contract.get("hasParking") and contract.get("parkingInfo"):
                    total_revenue += contract["parkingInfo"]["parkingFee"]
    
    # Calculate projected revenue from active contracts
    projected_revenue = 0.0
    for assignment in assignments:
        contract = next((c for c in contracts if c["id"] == assignment["contractId"]), None)
        if contract and contract.get("status") == "active":
            # Base price
            projected_revenue += contract["price"]
            # Add parking fee if applicable
            if contract.get("hasParking") and contract.get("parkingInfo"):
                projected_revenue += contract["parkingInfo"]["parkingFee"]
    
    # Calculate total utility bills collected
    total_utility_bills = sum(b["amount"] for b in utility_bills if b.get("isPaid"))
    
    # Calculate total expenses (Khoản chi + Khoản chi tiêu thuê nhà)
    total_expenses = sum(e["amount"] for e in expenses)
    total_rent_expenses = sum(r["amount"] for r in rent_expenses)
    total_expenses += total_rent_expenses
    
    # Net revenue = actual revenue + utility bills - expenses
    net_revenue = total_revenue + total_utility_bills - total_expenses
    
    return {
        "month": month,
        "totalRevenue": total_revenue,
        "projectedRevenue": projected_revenue,
        "totalExpenses": total_expenses,
        "totalUtilityBills": total_utility_bills,
        "netRevenue": net_revenue
    }

def get_revenue_stats_by_dome(month: str) -> List[dict]:
    """
    Calculate revenue statistics for each dome in a specific month
    Revenue = Actual RentCollections
    Returns list of domes with their respective revenue stats
    """
    houses = get_houses()
    rooms = get_rooms()
    beds = get_beds()
    assignments = get_assignments()
    contracts = get_contracts()
    rent_collections = get_rent_collections(month=month)
    utility_bills = get_utility_bills(month=month)
    expenses = get_expenses(month=month)
    rent_expenses = get_rent_expenses(month=month)
    
    dome_stats = []
    
    for house in houses:
        # Get rooms and beds for this house
        house_rooms = [r for r in rooms if r["houseId"] == house["id"]]
        room_ids = [r["id"] for r in house_rooms]
        house_beds = [b for b in beds if b["roomId"] in room_ids]
        
        # Get assignments for this house's beds
        house_assignments = [a for a in assignments if any(b["id"] == a["bedId"] for b in house_beds)]
        
        # Calculate actual revenue from rent collections in this house
        house_revenue = 0.0
        for collection in rent_collections:
            if collection.get("isCollected"):
                # Check if this collection belongs to this house
                contract = next((c for c in contracts if c["id"] == collection["contractId"]), None)
                if contract:
                    # Check if contract is assigned to this house
                    contract_assignments = [a for a in assignments if a["contractId"] == contract["id"]]
                    if any(any(b["id"] == a["bedId"] for b in house_beds) for a in contract_assignments):
                        house_revenue += contract["price"]
                        if contract.get("hasParking") and contract.get("parkingInfo"):
                            house_revenue += contract["parkingInfo"]["parkingFee"]
        
        # Calculate utility bills for this house
        house_utility_bills = sum(b["amount"] for b in utility_bills if b.get("houseId") == house["id"] and b.get("isPaid"))
        
        # Calculate expenses for this house
        house_expenses = sum(e["amount"] for e in expenses if e.get("houseId") == house["id"])
        
        # Calculate rent expenses for this house
        house_rent_expenses = sum(r["amount"] for r in rent_expenses if r.get("houseId") == house["id"])
        
        total_house_expenses = house_expenses + house_rent_expenses
        
        # Net revenue for this house
        house_net_revenue = house_revenue + house_utility_bills - total_house_expenses
        
        dome_stats.append({
            "houseId": house["id"],
            "houseName": house["name"],
            "totalRevenue": house_revenue,
            "totalExpenses": total_house_expenses,
            "totalUtilityBills": house_utility_bills,
            "netRevenue": house_net_revenue
        })
    
    return dome_stats

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

# Rent Expenses
def get_rent_expenses(house_id: Optional[str] = None, month: Optional[str] = None) -> List[dict]:
    """Get rent expenses, optionally filtered by house or month"""
    rents = read_data("rent_expenses")
    if house_id:
        rents = [r for r in rents if r["houseId"] == house_id]
    if month:
        rents = [r for r in rents if r["month"] == month]
    return rents

def get_rent_expense_by_id(rent_id: str) -> Optional[dict]:
    rents = get_rent_expenses()
    return next((r for r in rents if r["id"] == rent_id), None)

def create_rent_expense(rent: RentExpense) -> dict:
    rents = get_rent_expenses()
    new_rent = rent.dict()
    new_rent["id"] = str(uuid.uuid4())
    new_rent["createdAt"] = datetime.now().isoformat()
    rents.append(new_rent)
    write_data("rent_expenses", rents)
    return new_rent

def update_rent_expense(rent_id: str, rent: RentExpense) -> Optional[dict]:
    rents = get_rent_expenses()
    for i, r in enumerate(rents):
        if r["id"] == rent_id:
            updated = rent.dict(exclude_unset=True)
            updated["id"] = rent_id
            updated["updatedAt"] = datetime.now().isoformat()
            rents[i] = {**r, **updated}
            write_data("rent_expenses", rents)
            return rents[i]
    return None

def delete_rent_expense(rent_id: str) -> bool:
    rents = get_rent_expenses()
    filtered = [r for r in rents if r["id"] != rent_id]
    if len(filtered) == len(rents):
        return False
    write_data("rent_expenses", filtered)
    return True

# Rent Collections
def get_rent_collections(contract_id: Optional[str] = None, month: Optional[str] = None) -> List[dict]:
    """Get rent collections, optionally filtered by contract or month"""
    collections = read_data("rent_collections")
    if contract_id:
        collections = [c for c in collections if c["contractId"] == contract_id]
    if month:
        collections = [c for c in collections if c["month"] == month]
    return collections

def get_rent_collection_by_id(collection_id: str) -> Optional[dict]:
    collections = get_rent_collections()
    return next((c for c in collections if c["id"] == collection_id), None)

def get_or_create_rent_collection(contract_id: str, month: str) -> dict:
    """Get existing rent collection or create new one"""
    from app.models import RentCollection
    
    collections = get_rent_collections()
    existing = next((c for c in collections if c["contractId"] == contract_id and c["month"] == month), None)
    
    if existing:
        return existing
    
    # Create new
    new_collection = RentCollection(contractId=contract_id, month=month).dict()
    new_collection["id"] = str(uuid.uuid4())
    new_collection["createdAt"] = datetime.now().isoformat()
    collections.append(new_collection)
    write_data("rent_collections", collections)
    return new_collection

def create_rent_collection(collection):
    """Create new rent collection"""
    from app.models import RentCollection
    
    collections = get_rent_collections()
    new_collection = collection.dict() if hasattr(collection, 'dict') else collection
    new_collection["id"] = str(uuid.uuid4())
    new_collection["createdAt"] = datetime.now().isoformat()
    collections.append(new_collection)
    write_data("rent_collections", collections)
    return new_collection

def update_rent_collection(collection_id: str, collection) -> Optional[dict]:
    """Update rent collection"""
    collections = get_rent_collections()
    for i, c in enumerate(collections):
        if c["id"] == collection_id:
            updated = collection.dict(exclude_unset=True) if hasattr(collection, 'dict') else collection
            updated["id"] = collection_id
            updated["updatedAt"] = datetime.now().isoformat()
            collections[i] = {**c, **updated}
            write_data("rent_collections", collections)
            return collections[i]
    return None

def delete_rent_collection(collection_id: str) -> bool:
    collections = get_rent_collections()
    filtered = [c for c in collections if c["id"] != collection_id]
    if len(filtered) == len(collections):
        return False
    write_data("rent_collections", filtered)
    return True

# Initialize on module load
initialize_data_files()
