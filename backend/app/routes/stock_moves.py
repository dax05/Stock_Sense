from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.operation import StockMove, Operation, OperationStatus
from app.models.product import Product
from app.models.warehouse import Location
from app.services.auth import get_current_user

router = APIRouter(prefix="/stock-moves", tags=["stock-moves"])


class StockMoveRow(BaseModel):
    id: int
    reference: str
    type: str
    product: str
    sku: str
    qty: float
    source: str
    dest: str
    partner: str | None
    date: datetime | None

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[StockMoveRow])
def list_moves(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    moves = (
        db.query(StockMove)
        .join(Operation, StockMove.operation_id == Operation.id)
        .filter(Operation.status == OperationStatus.done)
        .options(
            joinedload(StockMove.operation),
            joinedload(StockMove.product),
            joinedload(StockMove.source_location),
            joinedload(StockMove.dest_location),
        )
        .order_by(Operation.id.desc(), StockMove.id)
        .all()
    )

    return [
        StockMoveRow(
            id=m.id,
            reference=m.operation.reference,
            type=m.operation.type.value,
            product=m.product.name,
            sku=m.product.sku,
            qty=m.qty,
            source=m.source_location.short_code,
            dest=m.dest_location.short_code,
            partner=m.operation.partner_name,
            date=m.operation.created_at,
        )
        for m in moves
    ]


class LocationStock(BaseModel):
    location_id: int
    location_name: str
    short_code: str
    qty_in: float
    qty_out: float
    net: float


@router.get("/by-product/{product_id}", response_model=list[LocationStock])
def stock_by_location(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Returns net stock per location for a product based on completed moves."""
    moves = (
        db.query(StockMove)
        .join(Operation)
        .filter(
            StockMove.product_id == product_id,
            Operation.status == OperationStatus.done,
        )
        .options(joinedload(StockMove.source_location), joinedload(StockMove.dest_location))
        .all()
    )

    ledger: dict[int, dict] = {}

    def ensure(loc: Location):
        if loc.id not in ledger:
            ledger[loc.id] = {"location_id": loc.id, "location_name": loc.name,
                               "short_code": loc.short_code, "qty_in": 0.0, "qty_out": 0.0}

    for m in moves:
        ensure(m.source_location)
        ensure(m.dest_location)
        ledger[m.source_location_id]["qty_out"] += m.qty
        ledger[m.dest_location_id]["qty_in"] += m.qty

    result = []
    for row in ledger.values():
        row["net"] = row["qty_in"] - row["qty_out"]
        result.append(LocationStock(**row))

    return sorted(result, key=lambda r: r.net, reverse=True)
