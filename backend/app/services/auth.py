import hashlib
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import settings
from app.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    """
    Double-hash strategy: SHA-256 pre-hash + Bcrypt
    This ensures any length password is converted to a fixed 64-char hex string
    that Bcrypt can handle without the 72-byte limitation error.
    """
    try:
        # Step 1: Pre-hash with SHA-256 to get fixed-length string (always 64 chars)
        utf8_password = password.encode('utf-8')
        sha256_password = hashlib.sha256(utf8_password).hexdigest().encode('utf-8')
        
        # Step 2: Hash the SHA-256 result with Bcrypt (64 chars is well under 72-byte limit)
        bcrypt_hash = bcrypt.hashpw(sha256_password, bcrypt.gensalt(rounds=12))
        
        return bcrypt_hash.decode('utf-8')
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password hashing failed: {str(e)}")


def verify_password(plain: str, hashed: str) -> bool:
    """
    Verify password using the same double-hash strategy
    """
    try:
        # Step 1: Pre-hash the plain password with SHA-256
        utf8_password = plain.encode('utf-8')
        sha256_password = hashlib.sha256(utf8_password).hexdigest().encode('utf-8')
        
        # Step 2: Verify against the Bcrypt hash
        return bcrypt.checkpw(sha256_password, hashed.encode('utf-8'))
        
    except Exception as e:
        return False


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


DEMO_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.ZmFrZQ"


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Allow demo token — find or create a demo admin user
    if token == DEMO_TOKEN:
        user = db.query(User).filter(User.login_id == "admin1").first()
        if not user:
            user = User(
                login_id="admin1",
                email="admin1@demo.com",
                password_hash=hash_password("password123"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user
