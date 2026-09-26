from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductOut
from app.schemas.operation import StockLevelOut
from app.services.auth import get_current_user
from app.services.inventory import calculate_free_to_use

router = APIRouter(prefix="/products", tags=["products"])


def _to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        name=p.name,
        sku=p.sku,
        category_id=p.category_id,
        category_name=p.category_rel.name if p.category_rel else None,
        uom=p.uom,
        cost=float(p.cost),
        on_hand=p.on_hand,
        free_to_use=p.free_to_use,
        min_stock_level=p.min_stock_level,
        reorder_qty=p.reorder_qty,
    )


def _get_or_404(db, product_id):
    p = db.query(Product).options(joinedload(Product.category_rel)).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # Check if SKU already exists
        if db.query(Product).filter(Product.sku == payload.sku).first():
            raise HTTPException(status_code=400, detail=f"SKU '{payload.sku}' already exists")
        
        # Validate category if provided
        if payload.category_id and not db.query(Category).filter(Category.id == payload.category_id).first():
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Create product
        product = Product(**payload.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        
        return _to_out(product)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create product: {str(e)}"
        )


@router.get("/", response_model=list[ProductOut])
def list_products(
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Product).options(joinedload(Product.category_rel))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    return [_to_out(p) for p in q.all()]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _to_out(_get_or_404(db, product_id))


@router.get("/{product_id}/stock", response_model=StockLevelOut)
def get_stock_level(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return calculate_free_to_use(product_id, db)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        product = _get_or_404(db, product_id)
        
        # Check for SKU conflicts (excluding current product)
        conflict = db.query(Product).filter(Product.sku == payload.sku, Product.id != product_id).first()
        if conflict:
            raise HTTPException(status_code=400, detail=f"SKU '{payload.sku}' already in use")
        
        # Validate category if provided
        if payload.category_id and not db.query(Category).filter(Category.id == payload.category_id).first():
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Update all fields
        for k, v in payload.model_dump().items():
            setattr(product, k, v)
        
        db.commit()
        db.refresh(product)
        
        return _to_out(product)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update product: {str(e)}"
        )


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = _get_or_404(db, product_id)
    db.delete(product)
    db.commit()
