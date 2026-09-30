"""Cross-tenant isolation tests for the procurement addon.

Features: F8, F9. Requirements: R16, R17.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""
