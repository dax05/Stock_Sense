from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, Token, LoginRequest
from app.services.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if login_id already exists
        if db.query(User).filter(User.login_id == payload.login_id).first():
            raise HTTPException(status_code=400, detail="Login ID already taken")
        
        # Check if email already exists
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create new user
        user = User(
            login_id=payload.login_id,
            email=payload.email,
            password_hash=hash_password(payload.password),
        )
        
        # Add, commit, refresh in exact sequence
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
        
    except HTTPException:
        # Re-raise HTTP exceptions (validation errors)
        raise
    except Exception as e:
        # Rollback on any other error
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create user: {str(e)}"
        )


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.login_id == payload.login_id).first()
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        token = create_access_token({"sub": str(user.id)})
        return {"access_token": token}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )
