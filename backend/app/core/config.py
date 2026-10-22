"""Application settings loaded from environment variables via Pydantic settings."""

from functools import lru_cache

from pydantic import model_validator
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

    @model_validator(mode="after")
    def validate_auth_settings(self) -> "Settings":
        if not 1 <= self.jwt_expiry_minutes <= 1440:
            raise ValueError("JWT_EXPIRY_MINUTES must be between 1 and 1440")
        if self.environment != "local" and (
            len(self.jwt_secret.encode("utf-8")) < 32
            or self.jwt_secret == "local-dev-only-secret-not-for-any-deployment"
        ):
            raise ValueError("JWT_SECRET must contain at least 32 bytes outside local development")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
