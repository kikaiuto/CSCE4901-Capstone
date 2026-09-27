"""Read-only data access for the AI assistance module.

Features: F12, F14. Requirements: R26, R27, R28, R31.
Queries are read-only, organization_id scoped, and must not depend on core
ORM models or core DB session objects.
"""
