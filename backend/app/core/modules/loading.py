"""Addon loading.

Walks the load order from graph.py and, for each addon, mounts its router,
registers its models, and runs its seed modules. An addon is loaded only after
every addon it depends on.
"""
