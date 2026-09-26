import os
from pydantic_settings import BaseSettings

# Always resolve .env relative to this file's directory (backend/)
_ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Email configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str
    SMTP_FROM_NAME: str = "Stock Sense"
    
    # OTP configuration
    OTP_EXPIRE_MINUTES: int = 10

    model_config = {
        "env_file": _ENV_PATH,
        "extra": "ignore",
    }


settings = Settings()
