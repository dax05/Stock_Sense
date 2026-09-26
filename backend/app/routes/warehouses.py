from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.warehouse import Warehouse, Location
from app.schemas.warehouse import WarehouseCreate, WarehouseOut, LocationCreate, LocationOut
from app.services.auth import get_current_user

router = APIRouter(tags=["warehouses"])


# ── Warehouses ────────────────────────────────────────────────────────────

@router.get("/warehouses/", response_model=list[WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Warehouse).all()


@router.post("/warehouses/", response_model=WarehouseOut, status_code=status.HTTP_201_CREATED)
def create_warehouse(payload: WarehouseCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if db.query(Warehouse).filter(Warehouse.short_code == payload.short_code).first():
        raise HTTPException(status_code=400, detail=f"Short code '{payload.short_code}' already exists")
    wh = Warehouse(**payload.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.put("/warehouses/{wh_id}", response_model=WarehouseOut)
def update_warehouse(wh_id: int, payload: WarehouseCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    wh = db.query(Warehouse).filter(Warehouse.id == wh_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    conflict = db.query(Warehouse).filter(Warehouse.short_code == payload.short_code, Warehouse.id != wh_id).first()
    if conflict:
        raise HTTPException(status_code=400, detail=f"Short code '{payload.short_code}' already in use")
    for k, v in payload.model_dump().items():
        setattr(wh, k, v)
    db.commit()
    db.refresh(wh)
    return wh


@router.delete("/warehouses/{wh_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse(wh_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    wh = db.query(Warehouse).filter(Warehouse.id == wh_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    db.delete(wh)
    db.commit()


# ── Locations ─────────────────────────────────────────────────────────────

@router.get("/locations/", response_model=list[LocationOut])
def list_locations(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Location).all()


@router.post("/locations/", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
def create_location(payload: LocationCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if db.query(Location).filter(Location.short_code == payload.short_code).first():
        raise HTTPException(status_code=400, detail=f"Short code '{payload.short_code}' already exists")
    loc = Location(**payload.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.put("/locations/{loc_id}", response_model=LocationOut)
def update_location(loc_id: int, payload: LocationCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    loc = db.query(Location).filter(Location.id == loc_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    conflict = db.query(Location).filter(Location.short_code == payload.short_code, Location.id != loc_id).first()
    if conflict:
        raise HTTPException(status_code=400, detail=f"Short code '{payload.short_code}' already in use")
    for k, v in payload.model_dump().items():
        setattr(loc, k, v)
    db.commit()
    db.refresh(loc)
    return loc


@router.delete("/locations/{loc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(loc_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    loc = db.query(Location).filter(Location.id == loc_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()
