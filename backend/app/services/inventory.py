from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.operation import Operation, OperationStatus, StockMove
from app.models.product import Product
from app.models.warehouse import LocationType


def validate_operation(operation_id: int, db: Session) -> Operation:
    """
    Executes the stock movement transaction for an operation.

    Rules:
    - Operation must be in 'Ready' status to validate.
    - For each StockMove:
        - If source is Internal  → decrease product.on_hand
        - If dest   is Internal  → increase product.on_hand
    - Negative on_hand is not allowed (prevents ghost stock on OUT moves).
    - On success: Operation + all StockMoves → 'Done'.
    - On any failure: full rollback, 400 raised.
    """
    operation = (
        db.query(Operation)
        .filter(Operation.id == operation_id)
        .with_for_update()
        .first()
    )
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")

    if operation.status != OperationStatus.ready:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Operation must be in 'Ready' status to validate. Current: {operation.status.value}",
        )

    moves = (
        db.query(StockMove)
        .filter(StockMove.operation_id == operation_id)
        .all()
    )
    if not moves:
        raise HTTPException(status_code=400, detail="Operation has no stock moves to validate")

    try:
        for move in moves:
            product = (
                db.query(Product)
                .filter(Product.id == move.product_id)
                .with_for_update()
                .first()
            )
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {move.product_id} not found")

            src_type = move.source_location.location_type
            dst_type = move.dest_location.location_type

            # Deduct from source if it's a physical internal location
            if src_type == LocationType.internal:
                if product.on_hand < move.qty:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                            f"On hand: {product.on_hand}, requested: {move.qty}"
                        ),
                    )
                product.on_hand -= move.qty

            # Add to destination if it's a physical internal location
            if dst_type == LocationType.internal:
                product.on_hand += move.qty

            move.status = OperationStatus.done

        operation.status = OperationStatus.done

        # Recalculate free_to_use for all affected products after commit
        _refresh_free_to_use(db, [m.product_id for m in moves])

        db.commit()
        db.refresh(operation)
        return operation

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(exc)}") from exc


def calculate_free_to_use(product_id: int, db: Session) -> dict:
    """
    free_to_use = on_hand - SUM(qty of StockMoves in 'Ready' OUT operations for this product)

    'Ready' OUT moves represent committed/reserved stock that hasn't shipped yet.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    from app.models.operation import OperationType

    reserved_qty = (
        db.query(func.coalesce(func.sum(StockMove.qty), 0))
        .join(Operation, StockMove.operation_id == Operation.id)
        .filter(
            StockMove.product_id == product_id,
            Operation.type == OperationType.OUT,
            Operation.status == OperationStatus.ready,
        )
        .scalar()
    ) or 0.0

    free_to_use = max(product.on_hand - reserved_qty, 0.0)

    return {
        "product_id": product.id,
        "sku": product.sku,
        "name": product.name,
        "on_hand": product.on_hand,
        "reserved": reserved_qty,
        "free_to_use": free_to_use,
    }


def _refresh_free_to_use(db: Session, product_ids: list[int]) -> None:
    """
    Recalculates and persists free_to_use on the Product row
    for all affected products after a transaction.
    """
    from app.models.operation import OperationType

    for pid in set(product_ids):
        product = db.query(Product).filter(Product.id == pid).first()
        if not product:
            continue
        reserved_qty = (
            db.query(func.coalesce(func.sum(StockMove.qty), 0))
            .join(Operation, StockMove.operation_id == Operation.id)
            .filter(
                StockMove.product_id == pid,
                Operation.type == OperationType.OUT,
                Operation.status == OperationStatus.ready,
            )
            .scalar()
        ) or 0.0
        product.free_to_use = max(product.on_hand - reserved_qty, 0.0)
