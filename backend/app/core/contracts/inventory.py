"""Inventory contract.

Reserve and release under pessimistic row locks so two confirmations can never
oversell the same unit, append-only ledger writes carrying resulting_on_hand,
and moving average cost recalculated on each goods receipt.

Features: F4, F5, F6, F9. Requirements: R7, R8, R9, R10, R11, R12.
"""
