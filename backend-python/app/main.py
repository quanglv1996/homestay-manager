from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List

from app.models import House, Room, Bed, Contract, Assignment
from app import data_service

app = FastAPI(title="Dome Homestay Manager API")

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
