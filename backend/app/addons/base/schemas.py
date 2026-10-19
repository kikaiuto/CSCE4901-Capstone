"""Pydantic V2 request and response schemas for the base addon.

Features: F1, F2. Requirements: R1, R2, R3, R4.
"""

import uuid

from pydantic import BaseModel, ConfigDict

from app.core.roles import Role


class UserOut(BaseModel):
    """A person on S-09. Never includes the password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: Role
    is_active: bool
