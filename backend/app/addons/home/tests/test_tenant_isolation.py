"""Cross-tenant isolation tests for the home addon.

Features: F14. Requirements: R24.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""
