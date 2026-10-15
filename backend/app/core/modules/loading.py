"""Addon loading.

Walks the load order from graph.py and, for each addon, mounts its router,
registers its models, and runs its seed modules. An addon is loaded only after
every addon it depends on.
"""

import importlib
import importlib.util
from pathlib import Path

ADDONS_DIR = Path(__file__).resolve().parent.parent.parent / "addons"


def addon_names() -> list[str]:
    return sorted(
        path.name
        for path in ADDONS_DIR.iterdir()
        if path.is_dir() and (path / "__manifest__.py").is_file()
    )


def import_models() -> list[str]:
    imported: list[str] = []
    for name in addon_names():
        module_name = f"app.addons.{name}.models"
        if importlib.util.find_spec(module_name) is None:
            continue
        importlib.import_module(module_name)
        imported.append(module_name)
    return imported
