
"""Addon loading.

Discovers addons, imports their SQLAlchemy models,
and mounts their FastAPI routers.
"""

import ast
import importlib
import importlib.util
from pathlib import Path

from fastapi import APIRouter, FastAPI

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


def mount_routers(app: FastAPI) -> None:
    for name in addon_names():
        manifest_path = ADDONS_DIR / name / "__manifest__.py"

        manifest = ast.literal_eval(
            manifest_path.read_text()
        )

        router_name = manifest.get("router")

        if not router_name:
            continue

        module = importlib.import_module(
            f"app.addons.{name}.{router_name}"
        )

        router = getattr(module, "router", None)

        if router is None:
            continue

        if not isinstance(router, APIRouter):
            raise TypeError(
                f"{name} does not define a valid APIRouter"
            )

        app.include_router(
            router,
            prefix="/api"
        )
