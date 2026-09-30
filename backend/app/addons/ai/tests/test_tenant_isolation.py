"""Cross-tenant isolation tests for the ai addon.

Features: F15, F16, F18. Requirements: R25, R26, R27, R30.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""
