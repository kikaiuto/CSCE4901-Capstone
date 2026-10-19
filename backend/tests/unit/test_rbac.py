"""RBACGuard admits listed roles only. Requirements: R3."""

import uuid

import pytest

from app.core.errors import Forbidden
from app.core.rbac import ALL_ROLES, RBACGuard, Role
from app.core.tenancy import TenantContext


def ctx(role: Role) -> TenantContext:
    return TenantContext(organization_id=uuid.uuid4(), user_id=uuid.uuid4(), role=role)


def test_listed_role_passes_and_gets_its_context():
    c = ctx(Role.ACCOUNTING)
    assert RBACGuard(Role.ACCOUNTING)(c) is c


@pytest.mark.parametrize("role", sorted(ALL_ROLES - {Role.OWNER, Role.ADMIN}))
def test_unlisted_role_is_forbidden(role):
    with pytest.raises(Forbidden):
        RBACGuard(Role.OWNER, Role.ADMIN)(ctx(role))


@pytest.mark.parametrize("role", sorted(ALL_ROLES))
def test_any_role_admits_every_role(role):
    RBACGuard.any_role()(ctx(role))


def test_empty_guard_is_a_programming_error():
    with pytest.raises(ValueError):
        RBACGuard()
