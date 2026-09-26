from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.operation import Operation, OperationType
from app.models.warehouse import Warehouse


def generate_reference(db: Session, warehouse_id: int, op_type: OperationType) -> str:
    """
    Resolves warehouse short_code from warehouse_id, then generates
    a reference in the format [WH_CODE]/[TYPE]/[NNNN].
    Uses SELECT FOR UPDATE to prevent duplicate references under concurrency.
    """
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail=f"Warehouse {warehouse_id} not found")

    prefix = f"{warehouse.short_code}/{op_type.value}/"

    last = (
        db.query(Operation)
        .filter(Operation.reference.like(f"{prefix}%"))
        .with_for_update()
        .order_by(Operation.id.desc())
        .first()
    )

    if last is None:
        next_seq = 1
    else:
        try:
            next_seq = int(last.reference.split("/")[-1]) + 1
        except (ValueError, IndexError):
            next_seq = 1

    return f"{prefix}{str(next_seq).zfill(4)}"
