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
