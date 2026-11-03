"""Addon dependency graph.

Builds a directed acyclic graph from every manifest's "depends" list, rejects
cycles, and returns a deterministic load order.

The graph is also the sprint plan. Sprint 1 exercises no cross-addon edge, since
each addon's own data must be correct in isolation. Sprint 2 lights up the
sales -> accounting and procurement -> accounting edges. Sprint 3 assembles the
home and ai surfaces from the registry.
"""

import heapq
from collections.abc import Iterable

from app.core.modules.manifest import Manifest, ManifestError


def load_order(manifests: Iterable[Manifest]) -> list[Manifest]:
    """Topological order; ties break alphabetically so every machine agrees."""
    by_name = {m.name: m for m in manifests}
    for m in by_name.values():
        for dep in m.depends:
            if dep not in by_name:
                raise ManifestError(f"{m.name} depends on unknown addon {dep!r}")
            if dep == m.name:
                raise ManifestError(f"{m.name} depends on itself")

    waiting = {name: set(m.depends) for name, m in by_name.items()}
    ready = [name for name, deps in waiting.items() if not deps]
    heapq.heapify(ready)
    order: list[Manifest] = []
    while ready:
        name = heapq.heappop(ready)
        order.append(by_name[name])
        for other, deps in waiting.items():
            if name in deps:
                deps.discard(name)
                if not deps:
                    heapq.heappush(ready, other)

    if len(order) != len(by_name):
        stuck = sorted(set(by_name) - {m.name for m in order})
        raise ManifestError(f"Dependency cycle among: {', '.join(stuck)}")
    return order
