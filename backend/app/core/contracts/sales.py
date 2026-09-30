"""Sales contract.

The sales order state machine: Draft, Confirmed, Fulfilled, Cancelled.
transition_order_status is the only way an order changes state, and it runs
one order at a time on the server even when the UI offers a bulk action.

Features: F6, F7. Requirements: R13, R14, R15.
"""
