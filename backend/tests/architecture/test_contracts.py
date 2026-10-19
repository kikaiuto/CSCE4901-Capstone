"""The seven service contracts exist, and none of them leaks an ORM model (FND-04)."""

import dataclasses
import importlib
import inspect
import typing

import pytest

from app.core.db import Base

CONTRACTS = {
    "identity": "IdentityContract",
    "sales": "SalesContract",
    "inventory": "InventoryContract",
    "procurement": "ProcurementContract",
    "accounting": "AccountingContract",
    "forecasting": "ForecastingContract",
    "assistant": "AssistantContract",
}


def test_there_are_exactly_seven():
    assert len(CONTRACTS) == 7


@pytest.mark.parametrize(("module", "name"), sorted(CONTRACTS.items()))
def test_contract_is_a_protocol_with_methods(module, name):
    contract = getattr(importlib.import_module(f"app.core.contracts.{module}"), name)
    assert getattr(contract, "_is_protocol", False)
    methods = [m for m, v in vars(contract).items() if callable(v) and not m.startswith("_")]
    assert methods, f"{name} declares no methods"


def _mentions_orm(annotation: object) -> bool:
    if inspect.isclass(annotation) and issubclass(annotation, Base):
        return True
    return any(_mentions_orm(arg) for arg in typing.get_args(annotation))


@pytest.mark.parametrize("module", sorted(CONTRACTS))
def test_no_orm_model_crosses_a_contract(module):
    mod = importlib.import_module(f"app.core.contracts.{module}")
    for obj in vars(mod).values():
        if not inspect.isclass(obj) or obj.__module__ != mod.__name__:
            continue
        if dataclasses.is_dataclass(obj):
            hints = typing.get_type_hints(obj)
        elif getattr(obj, "_is_protocol", False):
            hints = {}
            for attr in vars(obj).values():
                if callable(attr):
                    hints.update(typing.get_type_hints(attr))
        else:
            continue
        leaks = [k for k, v in hints.items() if _mentions_orm(v)]
        assert not leaks, f"{obj.__name__} exposes ORM types via {leaks}"


def protocols(module: str) -> list[type]:
    mod = importlib.import_module(f"app.core.contracts.{module}")
    return [
        obj for obj in vars(mod).values()
        if inspect.isclass(obj) and obj.__module__ == mod.__name__
        and getattr(obj, "_is_protocol", False)
    ]


@pytest.mark.parametrize("module", sorted(CONTRACTS))
def test_contract_methods_take_tenant_context_first(module):
    from app.core.tenancy import TenantContext

    for contract in protocols(module):
        for name, fn in vars(contract).items():
            if name.startswith("_") or not inspect.iscoroutinefunction(fn):
                continue
            params = list(inspect.signature(fn).parameters.values())
            hints = typing.get_type_hints(fn)
            assert params[1].name == "ctx" and hints["ctx"] is TenantContext, (
                f"{contract.__name__}.{name} must take ctx: TenantContext first"
            )


# Contracts with both facets. The writer extends the reader.
FACETED = {
    "sales": ("SalesReader", "SalesContract"),
    "inventory": ("InventoryReader", "InventoryContract"),
    "procurement": ("ProcurementReader", "ProcurementContract"),
    "accounting": ("AccountingReader", "AccountingContract"),
}
WRITER_NAMES = {writer for _, writer in FACETED.values()} | {"provide", "bind"}


@pytest.mark.parametrize(("module", "names"), sorted(FACETED.items()))
def test_writer_extends_its_reader(module, names):
    mod = importlib.import_module(f"app.core.contracts.{module}")
    reader, writer = (getattr(mod, n) for n in names)
    assert issubclass(writer, reader)


def test_ai_and_home_use_read_only_contracts():
    """CLAUDE.md: the AI layer never writes. ai and home may name a *Reader, the
    read-only contracts, and the data types, never a writer or provide()."""
    from tests.architecture.test_addon_deps import ADDONS_DIR, imported_modules

    violations = []
    for addon in ("ai", "home"):
        for path in sorted((ADDONS_DIR / addon).rglob("*.py")):
            for line, module in imported_modules(path):
                if module.startswith("app.core.contracts") and module.rsplit(".", 1)[-1] in (
                    WRITER_NAMES
                ):
                    violations.append(f"{addon}/{path.name}:{line} imports {module}")
    assert not violations, "\n".join(violations)
