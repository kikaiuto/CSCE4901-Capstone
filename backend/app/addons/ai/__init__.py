"""AI assistance addon package. Isolated, read-only layer.

Features: F15, F16, F18. Requirements: R25, R26, R27, R30.

Isolation rule: nothing in this package may import core ORM models or DB
sessions, and no core addon may import from here. All data reaches this
layer through the read-only contracts in app/core/contracts/.
"""
