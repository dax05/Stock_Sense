import os
from pydantic_settings import BaseSettings

# Always resolve .env relative to this file's directory (backend/)
_ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = {
        "env_file": _ENV_PATH,
        "extra": "ignore",
    }


settings = Settings()
