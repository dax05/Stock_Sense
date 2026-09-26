from sqlalchemy.orm import Session, joinedload
from app.models.product import Product
from app.models.category import Category


def get_low_stock_items(db: Session) -> list[dict]:
    """Returns products where free_to_use < min_stock_level (and min_stock_level > 0)."""
    products = (
        db.query(Product)
        .options(joinedload(Product.category_rel))
        .filter(Product.min_stock_level > 0)
        .all()
    )
    alerts = []
    for p in products:
        if p.free_to_use < p.min_stock_level:
            alerts.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "category_name": p.category_rel.name if p.category_rel else None,
                "uom": p.uom,
                "free_to_use": p.free_to_use,
                "min_stock_level": p.min_stock_level,
                "reorder_qty": p.reorder_qty,
                "shortage": round(p.min_stock_level - p.free_to_use, 4),
            })
    return sorted(alerts, key=lambda x: x["shortage"], reverse=True)


def get_valuation(db: Session) -> dict:
    """
    Returns stock valuation grouped by category.
    Total = sum(on_hand * cost) per category.
    """
    products = (
        db.query(Product)
        .options(joinedload(Product.category_rel))
        .all()
    )

    by_category: dict[str, dict] = {}
    grand_total = 0.0

    for p in products:
        cat = p.category_rel.name if p.category_rel else "Uncategorized"
        value = float(p.on_hand) * float(p.cost)
        grand_total += value

        if cat not in by_category:
            by_category[cat] = {"category": cat, "total_value": 0.0, "product_count": 0, "products": []}

        by_category[cat]["total_value"] = round(by_category[cat]["total_value"] + value, 4)
        by_category[cat]["product_count"] += 1
        by_category[cat]["products"].append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "on_hand": p.on_hand,
            "cost": float(p.cost),
            "value": round(value, 4),
        })

    return {
        "grand_total": round(grand_total, 4),
        "by_category": sorted(by_category.values(), key=lambda x: x["total_value"], reverse=True),
    }
