import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.schemas.product import LowStockAlert
from app.services.auth import get_current_user
from app.services.reports import get_low_stock_items, get_valuation

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/low-stock", response_model=list[LowStockAlert])
def low_stock(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_low_stock_items(db)


@router.get("/low-stock/count")
def low_stock_count(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return {"count": len(get_low_stock_items(db))}


@router.get("/valuation")
def valuation(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_valuation(db)


@router.get("/products/export")
def export_products(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Streams a CSV of the full product catalog."""
    products = (
        db.query(Product)
        .options(joinedload(Product.category_rel))
        .order_by(Product.name)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "SKU", "Category", "UoM", "Cost", "On Hand", "Free to Use", "Min Stock", "Reorder Qty"])

    for p in products:
        writer.writerow([
            p.id, p.name, p.sku,
            p.category_rel.name if p.category_rel else "",
            p.uom, float(p.cost), p.on_hand, p.free_to_use,
            p.min_stock_level, p.reorder_qty,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=coreinventory_products.csv"},
    )
