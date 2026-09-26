from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])


def _to_out(c: Category) -> CategoryOut:
    return CategoryOut(
        id=c.id,
        name=c.name,
        parent_id=c.parent_id,
        parent_name=c.parent.name if c.parent else None,
    )


@router.get("/", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return [_to_out(c) for c in db.query(Category).order_by(Category.name).all()]


@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        # Check if category name already exists
        if db.query(Category).filter(Category.name == payload.name).first():
            raise HTTPException(status_code=400, detail=f"Category '{payload.name}' already exists")
        
        # Validate parent category if provided
        if payload.parent_id and not db.query(Category).filter(Category.id == payload.parent_id).first():
            raise HTTPException(status_code=404, detail="Parent category not found")
        
        # Create category
        c = Category(**payload.model_dump())
        db.add(c)
        db.commit()
        db.refresh(c)
        
        return _to_out(c)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create category: {str(e)}"
        )


@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(cat_id: int, payload: CategoryCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        c = db.query(Category).filter(Category.id == cat_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Check for name conflicts (excluding current category)
        conflict = db.query(Category).filter(Category.name == payload.name, Category.id != cat_id).first()
        if conflict:
            raise HTTPException(status_code=400, detail=f"Name '{payload.name}' already in use")
        
        # Prevent self-parenting
        if payload.parent_id == cat_id:
            raise HTTPException(status_code=400, detail="A category cannot be its own parent")
        
        # Update all fields
        for k, v in payload.model_dump().items():
            setattr(c, k, v)
        
        db.commit()
        db.refresh(c)
        
        return _to_out(c)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update category: {str(e)}"
        )


@router.delete("/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(cat_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.query(Category).filter(Category.id == cat_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(c)
    db.commit()
