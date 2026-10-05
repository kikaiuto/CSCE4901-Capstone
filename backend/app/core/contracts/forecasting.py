"""Forecasting contract.

Batch Holt-Winters demand forecasts read by the S-05 overlay. Returns
INSUFFICIENT_DATA rather than a number for a product without enough history.

Features: F17. Requirements: R28, R29.
"""
