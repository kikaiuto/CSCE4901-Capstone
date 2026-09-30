"""Assistant contract.

The read-only surface the AI layer is allowed to see. Every method is a
parameterized tool that takes its organization from the session, never from the
model. Nothing here writes; a write intent comes back as a draft a person
confirms in the normal screen.

Features: F15, F16, F18. Requirements: R25, R26, R27, R30.
"""
