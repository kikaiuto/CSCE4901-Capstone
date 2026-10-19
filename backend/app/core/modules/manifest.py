"""Addon manifest parsing.

Every addon under app/addons/<name>/ declares a __manifest__.py holding a single
dict literal with these keys:

    name          package directory name, must match the folder
    label          human name used in the UI and the design docs
    summary        one line describing what the addon owns
    track          owning sprint track: PLT, SLS, INV, ACC, or AIX
    depends        addon names this addon may import from
    screens        screen IDs this addon implements, S-01 through S-10
    requirements   requirement IDs this addon satisfies, R1 through R32
    features       feature IDs, F1 through F20
    router         module name holding the addon's APIRouter
    models         ORM entity names this addon owns, from ER diagram D-02
    seeds          modules contributing rows to the seed tenants

Manifests are read as literals rather than imported, so the dependency graph can
be built without executing addon code or triggering import side effects.
"""

import ast
from dataclasses import dataclass
from pathlib import Path

TRACKS = frozenset({"PLT", "SLS", "INV", "ACC", "AIX"})
_LIST_KEYS = ("depends", "screens", "requirements", "features", "models", "seeds")
REQUIRED_KEYS = frozenset({"name", "label", "summary", "track", "router", *_LIST_KEYS})


class ManifestError(ValueError):
    pass


@dataclass(frozen=True)
class Manifest:
    name: str
    label: str
    summary: str
    track: str
    depends: tuple[str, ...]
    screens: tuple[str, ...]
    requirements: tuple[str, ...]
    features: tuple[str, ...]
    router: str
    models: tuple[str, ...]
    seeds: tuple[str, ...]


def read_manifest(addon_dir: Path) -> Manifest:
    path = addon_dir / "__manifest__.py"
    try:
        data = ast.literal_eval(path.read_text(encoding="utf-8"))
    except (SyntaxError, ValueError) as exc:
        raise ManifestError(f"{path}: not a dict literal") from exc
    if not isinstance(data, dict):
        raise ManifestError(f"{path}: not a dict literal")

    missing = REQUIRED_KEYS - data.keys()
    unknown = data.keys() - REQUIRED_KEYS
    if missing or unknown:
        raise ManifestError(f"{path}: missing {sorted(missing)}, unknown {sorted(unknown)}")
    if data["name"] != addon_dir.name:
        raise ManifestError(f"{path}: name {data['name']!r} does not match its folder")
    if data["track"] not in TRACKS:
        raise ManifestError(f"{path}: unknown track {data['track']!r}")
    for key in _LIST_KEYS:
        if not isinstance(data[key], list) or not all(isinstance(v, str) for v in data[key]):
            raise ManifestError(f"{path}: {key} must be a list of strings")

    return Manifest(**{k: tuple(v) if k in _LIST_KEYS else v for k, v in data.items()})
