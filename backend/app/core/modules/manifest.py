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
