"""Addon boundaries are enforced, not just documented.

Walks each addon's imports and fails when an addon imports from an addon it did
not declare in its manifest's "depends" list.

This is what keeps the AI isolation rule in CLAUDE.md true. Because app/addons/ai
declares only "base", any import reaching a core ORM model or DB session fails
here rather than in review. Non-functional: NF8.
"""

import ast

import pytest

from app.core.modules.loading import ADDONS_DIR, addon_names


def imported_modules(source: str, package: list[str]) -> set[str]:
    """Absolute names of every module a file imports, with relative imports resolved."""
    found = set()
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Import):
            found.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            base = package[: len(package) - node.level + 1] if node.level else []
            module = ".".join(base + (node.module.split(".") if node.module else []))
            found.add(module)
            # "from app.addons import sales" names the addon in the imported names.
            found.update(f"{module}.{alias.name}" for alias in node.names)
    return found


def addons_in(modules: set[str]) -> set[str]:
    return {name.split(".")[2] for name in modules if name.startswith("app.addons.")}


def imports_of(addon: str):
    """Yield (path, imported module names) for every Python file in an addon."""
    for path in (ADDONS_DIR / addon).rglob("*.py"):
        package = ["app", "addons", *path.parent.relative_to(ADDONS_DIR).parts]
        yield path, imported_modules(path.read_text(encoding="utf-8"), package)


@pytest.mark.parametrize("addon", addon_names())
def test_addon_imports_only_what_it_declares(addon):
    manifest = ast.literal_eval((ADDONS_DIR / addon / "__manifest__.py").read_text())
    allowed = {addon, *manifest["depends"]}
    for path, modules in imports_of(addon):
        undeclared = addons_in(modules) - allowed
        assert not undeclared, (
            f"{path.relative_to(ADDONS_DIR)} imports {sorted(undeclared)}, "
            f"which {addon} does not declare in its manifest's depends"
        )


def test_ai_never_imports_the_db_session():
    for path, modules in imports_of("ai"):
        db = {name for name in modules if name == "app.core.db" or name.startswith("app.core.db.")}
        assert not db, f"{path.relative_to(ADDONS_DIR)} imports {sorted(db)}"


def test_scanner_catches_every_import_form():
    source = (
        "import app.addons.sales.service\n"
        "from app.addons import inventory\n"
        "from ...accounting.models import JournalEntry\n"
        "from ..service import helper\n"
    )
    modules = imported_modules(source, ["app", "addons", "home", "tests"])
    assert addons_in(modules) == {"sales", "inventory", "accounting", "home"}
