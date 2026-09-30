"""Cross-tenant isolation tests for the accounting addon.

Features: F10, F11, F12, F13, F19. Requirements: R18, R19, R20, R21, R22, R23, R31.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""
