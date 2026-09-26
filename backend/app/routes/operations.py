from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.operation import Operation, OperationStatus, OperationType, StockMove
from app.models.warehouse import Location, Warehouse, LocationType
from app.schemas.operation import OperationCreate, OperationOut
from app.services.auth import get_current_user
from app.services.reference import generate_reference
from app.services.inventory import validate_operation

router = APIRouter(prefix="/operations", tags=["operations"])


@router.get("/", response_model=list[OperationOut])
def list_operations(
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Operation)
    if type:
        try:
            q = q.filter(Operation.type == OperationType(type))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid type: {type}")
    return q.order_by(Operation.id.desc()).all()


@router.post("/", response_model=OperationOut, status_code=status.HTTP_201_CREATED)
def create_operation(
    payload: OperationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate warehouse exists
    warehouse = db.query(Warehouse).filter(Warehouse.id == payload.warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=400,
            detail=f"Warehouse with ID {payload.warehouse_id} not found",
        )

    # Validate all locations exist before touching the DB
    location_ids = set()
    for move in payload.moves:
        location_ids.add(move.source_location_id)
        location_ids.add(move.dest_location_id)

    locations_map: dict[int, Location] = {
        loc.id: loc
        for loc in db.query(Location).filter(Location.id.in_(location_ids)).all()
    }
    missing = location_ids - set(locations_map.keys())
    if missing:
        raise HTTPException(status_code=400, detail=f"Location IDs not found: {missing}")

    # Per-move validations
    for i, move_data in enumerate(payload.moves):
        src_loc = locations_map[move_data.source_location_id]
        dst_loc = locations_map[move_data.dest_location_id]

        # Same-location check (critical for internal transfers)
        if move_data.source_location_id == move_data.dest_location_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Move {i + 1}: Source and destination location cannot be the same "
                    f"(location ID {move_data.source_location_id})."
                ),
            )

        # For Receipts (IN): source must be a virtual/vendor location
        if payload.type == OperationType.IN:
            if src_loc.location_type == LocationType.internal:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Move {i + 1}: Receipt source must be a Vendor/Virtual location, "
                        f"not an Internal one ('{src_loc.name}')."
                    ),
                )
            if dst_loc.location_type != LocationType.internal:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Move {i + 1}: Receipt destination must be an Internal warehouse location, "
                        f"got '{dst_loc.location_type.value}' ('{dst_loc.name}')."
                    ),
                )

        # For Deliveries (OUT): source must be internal, destination must be non-internal
        if payload.type == OperationType.OUT:
            if src_loc.location_type != LocationType.internal:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Move {i + 1}: Delivery source must be an Internal warehouse location, "
                        f"got '{src_loc.location_type.value}' ('{src_loc.name}')."
                    ),
                )
            if dst_loc.location_type == LocationType.internal:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Move {i + 1}: Delivery destination must be a Customer/Virtual location, "
                        f"not an Internal one ('{dst_loc.name}')."
                    ),
                )

        # For Internal Transfers (INT): both locations must be internal
        if payload.type == OperationType.INT:
            if src_loc.location_type != LocationType.internal:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Move {i + 1}: Internal transfer source must be an Internal location, "
                        f"got '{src_loc.location_type.value}' ('{src_loc.name}')."
                    ),
                )
            if dst_loc.location_type != LocationType.internal:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Move {i + 1}: Internal transfer destination must be an Internal location, "
                        f"got '{dst_loc.location_type.value}' ('{dst_loc.name}')."
                    ),
                )

        # For Adjustments (ADJ): source must be internal, dest must be Adjustment type
        if payload.type == OperationType.ADJ:
            if src_loc.location_type != LocationType.internal:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Move {i + 1}: Adjustment source must be an Internal warehouse location, "
                        f"got '{src_loc.location_type.value}' ('{src_loc.name}')."
                    ),
                )

    reference = generate_reference(db, payload.warehouse_id, payload.type)

    operation = Operation(
        reference=reference,
        type=payload.type,
        status=OperationStatus.draft,
        partner_name=payload.partner_name,
        scheduled_date=payload.scheduled_date,
        responsible_id=current_user.id,
    )
    db.add(operation)
    db.flush()  # get operation.id before adding moves

    for move_data in payload.moves:
        move = StockMove(
            operation_id=operation.id,
            product_id=move_data.product_id,
            qty=move_data.qty,
            source_location_id=move_data.source_location_id,
            dest_location_id=move_data.dest_location_id,
            status=OperationStatus.draft,
        )
        db.add(move)

    db.commit()
    db.refresh(operation)
    return operation


@router.patch("/{operation_id}/status", response_model=OperationOut)
def advance_status(
    operation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Advances an operation through the state machine:
    Draft → Waiting → Ready
    (Done is only reachable via /validate)
    """
    TRANSITIONS = {
        OperationStatus.draft: OperationStatus.waiting,
        OperationStatus.waiting: OperationStatus.ready,
    }

    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")

    next_status = TRANSITIONS.get(operation.status)
    if not next_status:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot advance from '{operation.status.value}' status",
        )

    operation.status = next_status
    for move in operation.stock_moves:
        move.status = next_status

    db.commit()
    db.refresh(operation)
    return operation


@router.patch("/{operation_id}/cancel", response_model=OperationOut)
def cancel_operation(
    operation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")

    if operation.status == OperationStatus.done:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed operation")

    operation.status = OperationStatus.canceled
    for move in operation.stock_moves:
        move.status = OperationStatus.canceled

    db.commit()
    db.refresh(operation)
    return operation


@router.post("/{operation_id}/validate", response_model=OperationOut)
def validate(
    operation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Executes the stock movement transaction.
    Operation must be in 'Ready' status.
    """
    return validate_operation(operation_id, db)


@router.get("/{operation_id}", response_model=OperationOut)
def get_operation(
    operation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    return operation
