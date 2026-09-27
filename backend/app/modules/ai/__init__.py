"""AI assistance module package. Isolated, read-only layer.

Features: F12, F14. Requirements: R26, R27, R28, R31.

Isolation rule: nothing in this package may import core ORM models or DB
sessions, and no core module may import from here. All data reaches this
layer through explicit read-only interfaces.
"""
