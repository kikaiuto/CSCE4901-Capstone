"""Application settings loaded from environment variables via Pydantic settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://sector7:sector7@localhost:5432/sector7"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me"
    jwt_expiry_minutes: int = 60
    llm_provider: str = "gemini"
    llm_model: str = ""
    environment: str = "local"


@lru_cache
def get_settings() -> Settings:
    return Settings()
