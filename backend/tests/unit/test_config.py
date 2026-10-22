"""A deployment refuses to start on a weak JWT secret. Non-functional: NF7."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings


@pytest.mark.parametrize("secret", ["change-me", "short-secret"])
def test_weak_secret_is_refused_outside_local(secret):
    with pytest.raises(ValidationError):
        Settings(jwt_secret=secret, environment="staging")


def test_weak_secret_is_allowed_for_local_development():
    Settings(jwt_secret="change-me", environment="local")


def test_strong_secret_is_accepted_anywhere():
    Settings(jwt_secret="x" * 32, environment="production")
