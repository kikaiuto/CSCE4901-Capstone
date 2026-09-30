"""Cross-tenant isolation tests for the inventory addon.

Features: F4, F5, F6, F9, F19. Requirements: R7, R8, R9, R10, R11, R12, R31.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""
