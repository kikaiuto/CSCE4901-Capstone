"""Reuse the accounting addon's fixtures: the two-tenant database, the client, and
the fake InventoryContract."""

from app.addons.accounting.tests.conftest import (  # noqa: F401
    client,
    inventory,
    password_hash,
    sessions,
    tenants,
)
