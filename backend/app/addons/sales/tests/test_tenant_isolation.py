"""Cross-tenant isolation tests for the sales addon.

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""
