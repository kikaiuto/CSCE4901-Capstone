"""Pydantic V2 API schemas for the base addon."""

from uuid import UUID

from pydantic import BaseModel, Field, SecretStr, field_validator

from app.core.roles import Role


class LoginRequest(BaseModel):
    organization_id: UUID
    email: str = Field(min_length=3, max_length=255)
    password: SecretStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or not value.split("@", 1)[1]:
            raise ValueError("Invalid email address")
        return value


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class CurrentUserResponse(BaseModel):
    user_id: UUID
    organization_id: UUID
    role: Role
    email: str
