"""Read-only data access for the AI assistance addon.

Features: F15, F16, F18. Requirements: R25, R26, R27, R30.
Queries are read-only, organization_id scoped, and must not depend on core
ORM models or core DB session objects.
"""
