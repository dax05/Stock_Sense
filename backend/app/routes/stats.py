from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.database import get_db
from app.models.operation import Operation, OperationType, OperationStatus
from app.models.product import Product
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/operations", tags=["stats"])


def _count(db, op_type, status, warehouse_id=None, date_from=None, date_to=None):
    query = (
        db.query(func.count(Operation.id))
        .filter(Operation.type == op_type, Operation.status == status)
    )
    
    if warehouse_id:
        # Filter by warehouse through stock moves
        from app.models.operation import StockMove
        from app.models.warehouse import Location
        query = query.join(StockMove).join(Location, StockMove.source_location_id == Location.id).filter(Location.warehouse_id == warehouse_id)
    
    if date_from:
        query = query.filter(Operation.created_at >= date_from)
    if date_to:
        query = query.filter(Operation.created_at <= date_to)
    
    return query.scalar() or 0


def _count_late(db, op_type, warehouse_id=None, date_from=None, date_to=None):
    """Operations that are Waiting or Ready but past their scheduled_date."""
    now = datetime.now(timezone.utc)
    query = (
        db.query(func.count(Operation.id))
        .filter(
            Operation.type == op_type,
            Operation.status.in_([OperationStatus.waiting, OperationStatus.ready]),
            Operation.scheduled_date < now,
        )
    )
    
    if warehouse_id:
        from app.models.operation import StockMove
        from app.models.warehouse import Location
        query = query.join(StockMove).join(Location, StockMove.source_location_id == Location.id).filter(Location.warehouse_id == warehouse_id)
    
    if date_from:
        query = query.filter(Operation.created_at >= date_from)
    if date_to:
        query = query.filter(Operation.created_at <= date_to)
    
    return query.scalar() or 0


def _total(db, op_type, warehouse_id=None, date_from=None, date_to=None):
    query = (
        db.query(func.count(Operation.id))
        .filter(Operation.type == op_type)
    )
    
    if warehouse_id:
        from app.models.operation import StockMove
        from app.models.warehouse import Location
        query = query.join(StockMove).join(Location, StockMove.source_location_id == Location.id).filter(Location.warehouse_id == warehouse_id)
    
    if date_from:
        query = query.filter(Operation.created_at >= date_from)
    if date_to:
        query = query.filter(Operation.created_at <= date_to)
    
    return query.scalar() or 0


def _parse_date_range(date_range: str):
    """Parse date range parameter and return from/to dates"""
    now = datetime.now(timezone.utc)
    
    if date_range == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start_of_day, now
    elif date_range == "last_7_days":
        seven_days_ago = now - timedelta(days=7)
        return seven_days_ago, now
    elif date_range == "last_30_days":
        thirty_days_ago = now - timedelta(days=30)
        return thirty_days_ago, now
    else:
        return None, None


@router.get("/stats")
def get_stats(
    warehouse_id: Optional[int] = Query(None, description="Filter by warehouse ID"),
    status: Optional[str] = Query(None, description="Filter by operation status"),
    date_range: Optional[str] = Query(None, description="Date range: today, last_7_days, last_30_days"),
    date_from: Optional[datetime] = Query(None, description="Custom start date"),
    date_to: Optional[datetime] = Query(None, description="Custom end date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Parse date range if provided
    if date_range and not date_from and not date_to:
        date_from, date_to = _parse_date_range(date_range)
    
    # Get total products count
    total_products = db.query(func.count(Product.id)).scalar() or 0
    
    # Build base query for total operations
    total_query = db.query(func.count(Operation.id))
    ready_query = db.query(func.count(Operation.id)).filter(Operation.status == OperationStatus.ready)
    
    # Apply filters to base queries
    if warehouse_id:
        from app.models.operation import StockMove
        from app.models.warehouse import Location
        total_query = total_query.join(StockMove).join(Location, StockMove.source_location_id == Location.id).filter(Location.warehouse_id == warehouse_id)
        ready_query = ready_query.join(StockMove).join(Location, StockMove.source_location_id == Location.id).filter(Location.warehouse_id == warehouse_id)
    
    if status:
        try:
            status_enum = OperationStatus(status)
            total_query = total_query.filter(Operation.status == status_enum)
            ready_query = ready_query.filter(Operation.status == status_enum)
        except ValueError:
            pass  # Invalid status, ignore filter
    
    if date_from:
        total_query = total_query.filter(Operation.created_at >= date_from)
        ready_query = ready_query.filter(Operation.created_at >= date_from)
    if date_to:
        total_query = total_query.filter(Operation.created_at <= date_to)
        ready_query = ready_query.filter(Operation.created_at <= date_to)
    
    total_ready = ready_query.scalar() or 0
    total_ops = total_query.scalar() or 0

    return {
        "total_products": total_products,
        "receipts": {
            "to_receive": _count(db, OperationType.IN, OperationStatus.ready, warehouse_id, date_from, date_to),
            "late": _count_late(db, OperationType.IN, warehouse_id, date_from, date_to),
            "waiting": _count(db, OperationType.IN, OperationStatus.waiting, warehouse_id, date_from, date_to),
            "total": _total(db, OperationType.IN, warehouse_id, date_from, date_to),
        },
        "deliveries": {
            "to_deliver": _count(db, OperationType.OUT, OperationStatus.ready, warehouse_id, date_from, date_to),
            "late": _count_late(db, OperationType.OUT, warehouse_id, date_from, date_to),
            "waiting": _count(db, OperationType.OUT, OperationStatus.waiting, warehouse_id, date_from, date_to),
            "total": _total(db, OperationType.OUT, warehouse_id, date_from, date_to),
        },
        "transfers": {
            "to_transfer": _count(db, OperationType.INT, OperationStatus.ready, warehouse_id, date_from, date_to),
            "late": _count_late(db, OperationType.INT, warehouse_id, date_from, date_to),
            "ready": _count(db, OperationType.INT, OperationStatus.ready, warehouse_id, date_from, date_to),
            "total": _total(db, OperationType.INT, warehouse_id, date_from, date_to),
        },
        "adjustments": {
            "pending": _count(db, OperationType.ADJ, OperationStatus.ready, warehouse_id, date_from, date_to),
            "done": _count(db, OperationType.ADJ, OperationStatus.done, warehouse_id, date_from, date_to),
            "total": _total(db, OperationType.ADJ, warehouse_id, date_from, date_to),
        },
        "total_ready": total_ready,
        "total_operations": total_ops,
    }


@router.get("/recent")
def get_recent_operations(
    warehouse_id: Optional[int] = Query(None, description="Filter by warehouse ID"),
    status: Optional[str] = Query(None, description="Filter by operation status"),
    date_range: Optional[str] = Query(None, description="Date range: today, last_7_days, last_30_days"),
    date_from: Optional[datetime] = Query(None, description="Custom start date"),
    date_to: Optional[datetime] = Query(None, description="Custom end date"),
    limit: int = Query(10, description="Number of recent operations to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent operations with filtering support"""
    from app.models.operation import StockMove
    from app.models.warehouse import Location
    
    # Parse date range if provided
    if date_range and not date_from and not date_to:
        date_from, date_to = _parse_date_range(date_range)
    
    # Build query
    query = db.query(Operation)
    
    # Apply filters
    if warehouse_id:
        query = query.join(StockMove).join(Location, StockMove.source_location_id == Location.id).filter(Location.warehouse_id == warehouse_id)
    
    if status:
        try:
            status_enum = OperationStatus(status)
            query = query.filter(Operation.status == status_enum)
        except ValueError:
            pass  # Invalid status, ignore filter
    
    if date_from:
        query = query.filter(Operation.created_at >= date_from)
    if date_to:
        query = query.filter(Operation.created_at <= date_to)
    
    # Get recent operations
    operations = query.order_by(Operation.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": op.id,
            "reference": op.reference,
            "type": op.type.value,
            "status": op.status.value,
            "partner_name": op.partner_name,
            "scheduled_date": op.scheduled_date,
            "created_at": op.created_at,
            "responsible_id": op.responsible_id,
        }
        for op in operations
    ]