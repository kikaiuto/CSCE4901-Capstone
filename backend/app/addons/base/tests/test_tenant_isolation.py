"""Cross-tenant isolation tests for the base addon.

Features: F1, F2. Requirements: R1, R2, R3, R4.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""
