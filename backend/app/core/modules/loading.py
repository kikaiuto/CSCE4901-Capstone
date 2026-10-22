"""Discover addons and mount their routers in dependency order.

Tenant routers use get_tenant_session and declare endpoint role guards.
Only an explicit public_router bypasses the tenant boundary.
"""

import importlib
import importlib.util
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI

from app.core.modules.graph import load_order
from app.core.modules.manifest import Manifest, read_manifest
from app.core.tenancy import get_tenant_session

ADDONS_DIR = Path(__file__).resolve().parent.parent.parent / "addons"
API_PREFIX = "/api"


def addon_names() -> list[str]:
    return sorted(
        path.name
        for path in ADDONS_DIR.iterdir()
        if path.is_dir() and (path / "__manifest__.py").is_file()
    )


def manifests_in_load_order() -> list[Manifest]:
    return load_order(read_manifest(ADDONS_DIR / name) for name in addon_names())


def import_models() -> list[str]:
    imported: list[str] = []
    for manifest in manifests_in_load_order():
        module_name = f"app.addons.{manifest.name}.models"
        if importlib.util.find_spec(module_name) is None:
            continue
        importlib.import_module(module_name)
        imported.append(module_name)
    return imported


def mount_routers(app: FastAPI) -> list[str]:
    import_models()
    mounted: list[str] = []
    for manifest in manifests_in_load_order():
        module = importlib.import_module(f"app.addons.{manifest.name}.{manifest.router}")
        prefix = f"{API_PREFIX}/{manifest.name}"
        public = getattr(module, "public_router", None)
        if isinstance(public, APIRouter):
            app.include_router(public, prefix=prefix, tags=[manifest.name])
        tenant = getattr(module, "router", None)
        if isinstance(tenant, APIRouter):
            app.include_router(
                tenant,
                prefix=prefix,
                tags=[manifest.name],
                dependencies=[Depends(get_tenant_session)],
            )
        mounted.append(manifest.name)
    return mounted
