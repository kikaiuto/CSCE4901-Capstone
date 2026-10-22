"""Addon boundaries are enforced, not just documented.

Walks each addon's imports and fails when an addon imports from an addon it did
not declare in its manifest's "depends" list.

This is what keeps the AI isolation rule in CLAUDE.md true. Because app/addons/ai
declares only "base", any import reaching a core ORM model or DB session fails
here rather than in review. Non-functional: NF8.
"""

import ast
import importlib.util
from pathlib import Path

from app.core.modules.loading import ADDONS_DIR, manifests_in_load_order

CORE_DIR = ADDONS_DIR.parent / "core"

# CLAUDE.md: addons/ai never imports the DB session or ORM machinery, even from core.
AI_FORBIDDEN = ("app.core.db", "sqlalchemy")


APP_ROOT = ADDONS_DIR.parent.parent


def package_of(path: Path) -> str:
    parts = path.relative_to(APP_ROOT).with_suffix("").parts
    return ".".join(parts if path.name == "__init__.py" else parts[:-1]).removesuffix(".__init__")


def imported_modules(path: Path) -> list[tuple[int, str]]:
    """Absolute module names, with relative imports resolved against the file."""
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    found: list[tuple[int, str]] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            found += [(node.lineno, alias.name) for alias in node.names]
        elif isinstance(node, ast.ImportFrom):
            base = node.module or ""
            if node.level:
                base = importlib.util.resolve_name("." * node.level + base, package_of(path))
            found.append((node.lineno, base))
            found += [(node.lineno, f"{base}.{alias.name}") for alias in node.names]
    return found


def addon_of(module: str) -> str | None:
    parts = module.split(".")
    if len(parts) >= 3 and parts[:2] == ["app", "addons"]:
        return parts[2]
    return None


def test_addons_import_only_declared_dependencies():
    violations = []
    for manifest in manifests_in_load_order():
        allowed = {manifest.name, *manifest.depends}
        for path in sorted((ADDONS_DIR / manifest.name).rglob("*.py")):
            for line, module in imported_modules(path):
                target = addon_of(module)
                if target is not None and target not in allowed:
                    rel = path.relative_to(ADDONS_DIR.parent.parent)
                    violations.append(f"{rel}:{line} imports {module} ({target} not in depends)")
    assert not violations, "\n".join(violations)


def test_core_never_imports_an_addon():
    violations = []
    for path in sorted(CORE_DIR.rglob("*.py")):
        for line, module in imported_modules(path):
            if addon_of(module) is not None:
                violations.append(f"{path.relative_to(CORE_DIR.parent.parent)}:{line} {module}")
    assert not violations, "\n".join(violations)


def test_ai_addon_never_touches_the_database():
    violations = []
    for path in sorted((ADDONS_DIR / "ai").rglob("*.py")):
        for line, module in imported_modules(path):
            if module.startswith(AI_FORBIDDEN):
                violations.append(f"{path.relative_to(ADDONS_DIR.parent.parent)}:{line} {module}")
    assert not violations, "\n".join(violations)


def test_addons_write_sql_only_through_the_orm():
    """core.tenancy scopes ORM statements only. Raw Table objects (Model.__table__)
    and textual SQL skip the tenant filter, and CLAUDE.md bans string SQL."""
    violations = []
    for path in sorted(ADDONS_DIR.rglob("*.py")):
        rel = path.relative_to(APP_ROOT)
        for line, module in imported_modules(path):
            if module in {"sqlalchemy.text", "sqlalchemy.sql.text", "sqlalchemy.Table"}:
                violations.append(f"{rel}:{line} imports {module}")
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.Attribute) and node.attr == "__table__":
                violations.append(f"{rel}:{node.lineno} uses __table__")
    assert not violations, "\n".join(violations)


def test_relative_imports_are_resolved():
    fake = ADDONS_DIR / "ai" / "service.py"
    assert package_of(fake) == "app.addons.ai"
    assert importlib.util.resolve_name("..sales", package_of(fake)) == "app.addons.sales"
