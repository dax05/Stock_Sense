from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    login_id: str
    email: EmailStr
    password: str

    @field_validator("login_id")
    @classmethod
    def validate_login_id(cls, v: str) -> str:
        if not (6 <= len(v) <= 12):
            raise ValueError("login_id must be between 6 and 12 characters")
        return v


class UserOut(BaseModel):
    id: int
    login_id: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    login_id: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str
    
    @field_validator("otp_code")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be a 6-digit number")
        return v


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str
    
    @field_validator("otp_code")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be a 6-digit number")
        return v
    
    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v


class MessageResponse(BaseModel):
    message: str
