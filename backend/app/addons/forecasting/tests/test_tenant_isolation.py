"""Cross-tenant isolation tests for the forecasting addon.

Features: F17. Requirements: R28, R29.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""
