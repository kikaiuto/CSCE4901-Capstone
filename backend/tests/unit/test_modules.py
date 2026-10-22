"""Manifest parsing and the dependency graph."""

import pytest

from app.core.modules.graph import load_order
from app.core.modules.manifest import Manifest, ManifestError


def manifest(name: str, *depends: str) -> Manifest:
    return Manifest(
        name=name,
        label=name,
        summary="",
        track="PLT",
        depends=depends,
        screens=(),
        requirements=(),
        features=(),
        router="router",
        models=(),
        seeds=(),
    )


def test_dependencies_load_first_and_ties_break_alphabetically():
    order = load_order([manifest("c", "a"), manifest("b", "a"), manifest("a")])
    assert [m.name for m in order] == ["a", "b", "c"]


def test_cycle_is_rejected():
    with pytest.raises(ManifestError, match="cycle"):
        load_order([manifest("a", "b"), manifest("b", "a")])


def test_unknown_dependency_is_rejected():
    with pytest.raises(ManifestError, match="unknown"):
        load_order([manifest("a", "ghost")])


def test_self_dependency_is_rejected():
    with pytest.raises(ManifestError):
        load_order([manifest("a", "a")])
