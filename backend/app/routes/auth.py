from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserOut, Token, LoginRequest,
    ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest, MessageResponse
)
from app.services.auth import hash_password, verify_password, create_access_token
from app.services.email import generate_otp, get_otp_expiry, send_otp_email

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


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Step 1: User requests password reset by providing their email.
    System generates OTP and sends it to their email.
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == payload.email).first()
        
        if not user:
            # For security, don't reveal if email exists or not
            # Return success message regardless to prevent email enumeration
            return {"message": "If this email is registered, an OTP has been sent to your email address."}
        
        # Generate OTP
        otp_code = generate_otp()
        otp_expiry = get_otp_expiry()
        
        # Save OTP to database
        user.otp_code = otp_code
        user.otp_expires_at = otp_expiry
        db.commit()
        
        # Send OTP email
        email_sent = send_otp_email(user.email, otp_code)
        
        if not email_sent:
            # Rollback the OTP save if email fails
            user.otp_code = None
            user.otp_expires_at = None
            db.commit()
            raise HTTPException(
                status_code=500,
                detail="Failed to send OTP email. Please check your email configuration or try again later."
            )
        
        return {"message": "OTP has been sent to your email address."}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process request: {str(e)}"
        )


@router.post("/verify-otp", response_model=MessageResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Step 2: User verifies the OTP they received.
    This endpoint validates the OTP without resetting the password yet.
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == payload.email).first()
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )
        
        # Check if OTP exists
        if not user.otp_code:
            raise HTTPException(
                status_code=400,
                detail="No OTP found. Please request a new one."
            )
        
        # Check if OTP has expired
        if user.otp_expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="OTP has expired. Please request a new one."
            )
        
        # Verify OTP
        if user.otp_code != payload.otp_code:
            raise HTTPException(
                status_code=400,
                detail="Invalid OTP. Please try again."
            )
        
        return {"message": "OTP verified successfully. You can now reset your password."}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to verify OTP: {str(e)}"
        )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Step 3: User resets their password after OTP verification.
    This endpoint validates the OTP again and updates the password.
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == payload.email).first()
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )
        
        # Check if OTP exists
        if not user.otp_code:
            raise HTTPException(
                status_code=400,
                detail="No OTP found. Please request a new one."
            )
        
        # Check if OTP has expired
        if user.otp_expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="OTP has expired. Please request a new one."
            )
        
        # Verify OTP
        if user.otp_code != payload.otp_code:
            raise HTTPException(
                status_code=400,
                detail="Invalid OTP. Please try again."
            )
        
        # Update password
        user.password_hash = hash_password(payload.new_password)
        
        # Clear OTP fields after successful password reset
        user.otp_code = None
        user.otp_expires_at = None
        
        db.commit()
        
        return {"message": "Password has been reset successfully. You can now login with your new password."}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset password: {str(e)}"
        )

