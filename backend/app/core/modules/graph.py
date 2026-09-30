"""Addon dependency graph.

Builds a directed acyclic graph from every manifest's "depends" list, rejects
cycles, and returns a deterministic load order.

The graph is also the sprint plan. Sprint 1 exercises no cross-addon edge, since
each addon's own data must be correct in isolation. Sprint 2 lights up the
sales -> accounting and procurement -> accounting edges. Sprint 3 assembles the
home and ai surfaces from the registry.
"""
