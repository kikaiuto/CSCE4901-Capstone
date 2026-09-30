"""Addon boundaries are enforced, not just documented.

Walks each addon's imports and fails when an addon imports from an addon it did
not declare in its manifest's "depends" list.

This is what keeps the AI isolation rule in CLAUDE.md true. Because app/addons/ai
declares only "base", any import reaching a core ORM model or DB session fails
here rather than in review. Non-functional: NF8.
"""
