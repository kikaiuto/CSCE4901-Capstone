"""Application settings loaded from environment variables via Pydantic settings."""

from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# RFC 7518 asks for an HS256 key at least as long as the hash.
MIN_JWT_SECRET_BYTES = 32


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
    def _refuse_weak_secret_outside_local(self) -> "Settings":
        """Anyone who knows the secret can sign a token for any organization and
        role, so a deployment must never run on the public default."""
        too_short = len(self.jwt_secret.encode()) < MIN_JWT_SECRET_BYTES
        if (too_short or self.jwt_secret == "change-me") and self.environment != "local":
            raise ValueError(
                f"JWT_SECRET must be set to {MIN_JWT_SECRET_BYTES}+ random bytes "
                f"when ENVIRONMENT={self.environment}"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
