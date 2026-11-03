"""No tenant endpoint exists outside TenantMiddleware and RBACGuard (FND-03).

Two checks. Every route on an addon's `router` declares an RBACGuard. And every
/api path the app actually serves answers 401 to a request with no token, except
the paths on an addon's `public_router`.
"""

import importlib
import uuid

from fastapi import APIRouter
from fastapi.dependencies.models import Dependant
from fastapi.routing import APIRoute

from app.core.modules.loading import manifests_in_load_order
from app.core.rbac import RBACGuard
from app.main import app


def dependency_calls(dependant: Dependant) -> list[object]:
    calls = []
    for dep in dependant.dependencies:
        calls.append(dep.call)
        calls += dependency_calls(dep)
    return calls


def addon_routers(attr: str) -> list[tuple[str, APIRouter]]:
    found = []
    for manifest in manifests_in_load_order():
        module = importlib.import_module(f"app.addons.{manifest.name}.{manifest.router}")
        router = getattr(module, attr, None)
        if isinstance(router, APIRouter):
            found.append((manifest.name, router))
    return found


def public_paths() -> set[str]:
    return {
        f"/api/{name}{route.path}"
        for name, router in addon_routers("public_router")
        for route in router.routes
        if isinstance(route, APIRoute)
    }


def test_every_tenant_route_declares_an_rbac_guard():
    missing = [
        f"{name}: {sorted(route.methods)} {route.path}"
        for name, router in addon_routers("router")
        for route in router.routes
        if isinstance(route, APIRoute)
        and not any(isinstance(c, RBACGuard) for c in dependency_calls(route.dependant))
    ]
    assert not missing, "Routes without an RBACGuard:\n" + "\n".join(missing)


async def test_every_api_path_refuses_a_request_without_a_token(client):
    paths = app.openapi()["paths"]
    checked = []
    for path, operations in paths.items():
        if not path.startswith("/api/") or path in public_paths():
            continue
        url = path
        for segment in [s for s in path.split("/") if s.startswith("{")]:
            url = url.replace(segment, str(uuid.uuid4()))
        for method in operations:
            resp = await client.request(method.upper(), url)
            assert resp.status_code == 401, f"{method.upper()} {path} -> {resp.status_code}"
            checked.append(path)
    assert "/api/base/users" in checked
