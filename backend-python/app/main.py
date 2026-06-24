from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from typing import Optional, List

from app.models import House, Room, Bed, Contract, Assignment, UtilityBill, UtilityDistribution, Expense, RentCollection, UtilityInput
from app import data_service
from app import revenue_service

app = FastAPI(title="Dome Homestay Manager API")

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "Dome Homestay Manager API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": data_service.datetime.now().isoformat()}

# Dashboard
@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    return data_service.get_dashboard_stats()

# Houses
@app.get("/api/houses")
def get_houses():
    return data_service.get_houses()

@app.get("/api/houses/{house_id}")
def get_house(house_id: str):
    house = data_service.get_house_by_id(house_id)
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    return house

@app.post("/api/houses", status_code=201)
def create_house(house: House):
    return data_service.create_house(house)

@app.put("/api/houses/{house_id}")
def update_house(house_id: str, house: House):
    updated = data_service.update_house(house_id, house)
    if not updated:
        raise HTTPException(status_code=404, detail="House not found")
    return updated

@app.delete("/api/houses/{house_id}", status_code=204)
def delete_house(house_id: str):
    if not data_service.delete_house(house_id):
        raise HTTPException(status_code=404, detail="House not found")
    return None

# Rooms
@app.get("/api/rooms")
def get_rooms(houseId: Optional[str] = Query(None)):
    return data_service.get_rooms(houseId)

@app.get("/api/rooms/{room_id}")
def get_room(room_id: str):
    room = data_service.get_room_by_id(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@app.post("/api/rooms", status_code=201)
def create_room(room: Room):
    return data_service.create_room(room)

@app.put("/api/rooms/{room_id}")
def update_room(room_id: str, room: Room):
    updated = data_service.update_room(room_id, room)
    if not updated:
        raise HTTPException(status_code=404, detail="Room not found")
    return updated

@app.delete("/api/rooms/{room_id}", status_code=204)
def delete_room(room_id: str):
    if not data_service.delete_room(room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    return None

# Beds
@app.get("/api/beds")
def get_beds(roomId: Optional[str] = Query(None)):
    return data_service.get_beds(roomId)

@app.get("/api/beds/{bed_id}")
def get_bed(bed_id: str):
    bed = data_service.get_bed_by_id(bed_id)
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    return bed

@app.post("/api/beds", status_code=201)
def create_bed(bed: Bed):
    return data_service.create_bed(bed)

@app.put("/api/beds/{bed_id}")
def update_bed(bed_id: str, bed: Bed):
    updated = data_service.update_bed(bed_id, bed)
    if not updated:
        raise HTTPException(status_code=404, detail="Bed not found")
    return updated

@app.delete("/api/beds/{bed_id}", status_code=204)
def delete_bed(bed_id: str):
    if not data_service.delete_bed(bed_id):
        raise HTTPException(status_code=404, detail="Bed not found")
    return None

# Contracts
@app.get("/api/contracts")
def get_contracts():
    return data_service.get_contracts()

@app.get("/api/contracts/with-assignments")
def get_contracts_with_assignments():
    """Get all contracts with their assignment information (Dome, Room, Bed)"""
    return data_service.get_contracts_with_assignments()

@app.get("/api/contracts/{contract_id}")
def get_contract(contract_id: str):
    contract = data_service.get_contract_by_id(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

@app.post("/api/contracts", status_code=201)
def create_contract(contract: Contract):
    return data_service.create_contract(contract)

@app.put("/api/contracts/{contract_id}")
def update_contract(contract_id: str, contract: Contract):
    # Get the raw contract dict (with password)
    contract_dict_with_password = contract.dict()
    password = contract_dict_with_password.pop("password", None)
    
    # Password is optional - only check if provided
    if password and password != "quang@2305":
        raise HTTPException(status_code=401, detail="Invalid password - cannot edit contract")
    
    # Update contract without password field
    # Use dict(exclude={"password"}) to exclude password from the Contract object
    updated = data_service.update_contract(contract_id, contract)
    if not updated:
        raise HTTPException(status_code=404, detail="Contract not found")
    return updated

@app.delete("/api/contracts/{contract_id}", status_code=204)
def delete_contract(contract_id: str):
    if not data_service.delete_contract(contract_id):
        raise HTTPException(status_code=404, detail="Contract not found")
    return None

# Assignments
@app.get("/api/assignments")
def get_assignments():
    return data_service.get_assignments()

@app.get("/api/assignments/bed/{bed_id}")
def get_assignments_by_bed(bed_id: str):
    assignments = data_service.get_assignments_by_bed_id(bed_id)
    return assignments

@app.post("/api/assignments", status_code=201)
def create_assignment(assignment: Assignment):
    try:
        return data_service.create_assignment(assignment)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/assignments/{assignment_id}", status_code=204)
def delete_assignment(assignment_id: str):
    if not data_service.delete_assignment(assignment_id):
        raise HTTPException(status_code=404, detail="Assignment not found")
    return None

@app.delete("/api/assignments/bed/{bed_id}/level/{level}", status_code=204)
def delete_assignment_by_bed_level(bed_id: str, level: str):
    data_service.delete_assignment_by_bed_and_level(bed_id, level)
    return None

# Utility Bills
@app.get("/api/utility-bills")
def get_utility_bills(contract_id: Optional[str] = Query(None), month: Optional[str] = Query(None)):
    """Get utility bills, optionally filtered by contract_id or month (YYYY-MM)"""
    return data_service.get_utility_bills(contract_id, month)

@app.get("/api/utility-bills/{bill_id}")
def get_utility_bill(bill_id: str):
    bill = data_service.get_utility_bill_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Utility bill not found")
    return bill

@app.post("/api/utility-bills", status_code=201)
def create_utility_bill(bill: UtilityBill):
    return data_service.create_utility_bill(bill)

@app.put("/api/utility-bills/{bill_id}")
def update_utility_bill(bill_id: str, bill: UtilityBill):
    updated = data_service.update_utility_bill(bill_id, bill)
    if not updated:
        raise HTTPException(status_code=404, detail="Utility bill not found")
    return updated

@app.delete("/api/utility-bills/{bill_id}", status_code=204)
def delete_utility_bill(bill_id: str):
    if not data_service.delete_utility_bill(bill_id):
        raise HTTPException(status_code=404, detail="Utility bill not found")
    return None

# Utility Distributions
@app.get("/api/utility-distributions")
def get_utility_distributions(room_id: Optional[str] = Query(None), month: Optional[str] = Query(None)):
    """Get utility distributions, optionally filtered by room_id or month (YYYY-MM)"""
    return data_service.get_utility_distributions(room_id, month)

@app.get("/api/utility-distributions/{distribution_id}")
def get_utility_distribution(distribution_id: str):
    distribution = data_service.get_utility_distribution_by_id(distribution_id)
    if not distribution:
        raise HTTPException(status_code=404, detail="Utility distribution not found")
    return distribution

@app.post("/api/utility-distributions/room/{room_id}/distribute")
def distribute_utility_by_room(room_id: str, electricity: float = Query(...), water: float = Query(...), month: str = Query(...), house_id: Optional[str] = Query(None)):
    """
    Create utility distribution for a room.
    Automatically distributes costs to all contracts in the room based on days active.
    
    Query parameters:
    - room_id: Room ID
    - electricity: Total electricity cost (VNĐ)
    - water: Total water cost (VNĐ)
    - month: Month in YYYY-MM format
    - house_id: (optional) House ID (will use room's house if not provided)
    """
    result = data_service.distribute_utility_cost_to_room(room_id, month, electricity, water, house_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/api/utility-distributions/house/{house_id}/distribute")
def distribute_utility_by_house(house_id: str, electricity: float = Query(...), water: float = Query(...), month: str = Query(...)):
    """
    Create utility distribution for an entire house.
    Automatically distributes costs to all contracts across all rooms in the house based on days active.
    
    Query parameters:
    - house_id: House ID
    - electricity: Total electricity cost (VNĐ)
    - water: Total water cost (VNĐ)
    - month: Month in YYYY-MM format
    """
    result = data_service.distribute_utility_cost_to_house(house_id, month, electricity, water)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.put("/api/utility-distributions/{distribution_id}")
def update_utility_distribution(distribution_id: str, distribution: UtilityDistribution, password: str = Query(None)):
    """Update utility distribution. Password not required for toggle payment status."""
    from app.models import UtilityDistribution
    updated = data_service.update_utility_distribution(distribution_id, distribution)
    if not updated:
        raise HTTPException(status_code=404, detail="Utility distribution not found")
    return updated

@app.delete("/api/utility-distributions/{distribution_id}", status_code=204)
def delete_utility_distribution(distribution_id: str, password: str = Query(...)):
    """Delete utility distribution. Requires password."""
    # Verify password
    if password != "quang@2305":
        raise HTTPException(status_code=403, detail="Mật khẩu không chính xác")
    
    if not data_service.delete_utility_distribution(distribution_id):
        raise HTTPException(status_code=404, detail="Utility distribution not found")
    return None

# Utility Inputs
@app.get("/api/utility-inputs")
def get_utility_inputs():
    """Get all utility input records"""
    return data_service.get_utility_inputs()

@app.get("/api/utility-inputs/{house_id}/{month}")
def get_utility_input(house_id: str, month: str):
    """Get utility input for a specific house and month"""
    result = data_service.get_utility_inputs_by_house_month(house_id, month)
    if not result:
        raise HTTPException(status_code=404, detail="Utility input not found")
    return result

@app.put("/api/utility-inputs/{input_id}")
def update_utility_input(input_id: str, data: UtilityInput, password: str = Query(...)):
    """Update utility input. Requires password."""
    # Verify password
    if password != "quang@2305":
        raise HTTPException(status_code=403, detail="Mật khẩu không chính xác")
    
    result = data_service.update_utility_input(
        input_id,
        data.houseId,
        data.month,
        data.electricity,
        data.water,
        data.notes or ""
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Utility input not found")
    return result

@app.delete("/api/utility-inputs/{input_id}")
def delete_utility_input(input_id: str, password: str = Query(...)):
    """Delete utility input and cascade delete all associated distributions. Requires password."""
    # Verify password
    if password != "quang@2305":
        raise HTTPException(status_code=403, detail="Mật khẩu không chính xác")
    
    if not data_service.delete_utility_input(input_id):
        raise HTTPException(status_code=404, detail="Utility input not found")
    return {"success": True, "message": "Đã xóa thông tin nhập tính toán và các hóa đơn liên quan"}

# Expenses
@app.get("/api/expenses")
def get_expenses(house_id: Optional[str] = Query(None), month: Optional[str] = Query(None)):
    """Get expenses, optionally filtered by house_id or month (YYYY-MM)"""
    return data_service.get_expenses(house_id, month)

@app.get("/api/expenses/{expense_id}")
def get_expense(expense_id: str):
    expense = data_service.get_expense_by_id(expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@app.post("/api/expenses", status_code=201)
def create_expense(expense: Expense):
    return data_service.create_expense(expense)

@app.put("/api/expenses/{expense_id}")
def update_expense(expense_id: str, expense: Expense):
    updated = data_service.update_expense(expense_id, expense)
    if not updated:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated

@app.delete("/api/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: str):
    if not data_service.delete_expense(expense_id):
        raise HTTPException(status_code=404, detail="Expense not found")
    return None

# Rent Collections
@app.get("/api/rent-collections")
def get_rent_collections(contract_id: Optional[str] = Query(None), month: Optional[str] = Query(None)):
    """Get rent collections, optionally filtered by contract or month"""
    return data_service.get_rent_collections(contract_id, month)

@app.get("/api/rent-collections/{collection_id}")
def get_rent_collection(collection_id: str):
    collection = data_service.get_rent_collection_by_id(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Rent collection not found")
    return collection

@app.post("/api/rent-collections", status_code=201)
def create_rent_collection(collection: RentCollection):
    return data_service.create_rent_collection(collection)

@app.put("/api/rent-collections/{collection_id}")
def update_rent_collection(collection_id: str, collection: RentCollection):
    updated = data_service.update_rent_collection(collection_id, collection)
    if not updated:
        raise HTTPException(status_code=404, detail="Rent collection not found")
    return updated

@app.delete("/api/rent-collections/{collection_id}", status_code=204)
def delete_rent_collection(collection_id: str):
    if not data_service.delete_rent_collection(collection_id):
        raise HTTPException(status_code=404, detail="Rent collection not found")
    return None

# Revenue Statistics
@app.get("/api/dashboard/revenue")
def get_revenue_stats(month: str = Query(..., description="Month in YYYY-MM format")):
    """Get revenue statistics for a specific month"""
    return data_service.get_revenue_stats(month)

@app.get("/api/dashboard/revenue-by-dome")
def get_revenue_stats_by_dome(month: str = Query(..., description="Month in YYYY-MM format")):
    """Get revenue statistics for each dome in a specific month"""
    return data_service.get_revenue_stats_by_dome(month)

@app.get("/api/dashboard/revenue-history")
def get_revenue_history(months: int = Query(12, description="Number of months to retrieve"), 
                        house_id: str = Query(None, description="Optional house ID to filter by")):
    """Get revenue statistics for the last N months, optionally filtered by house"""
    return revenue_service.get_revenue_history(months_count=months, house_id=house_id)
