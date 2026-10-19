"""Every manifest parses and the traceability matrix stays honest.

Asserts that each manifest has the required keys, that "depends" names only real
addons, and that the graph is acyclic.

Requirement coverage: every requirement R1 through R32 is claimed by at least one
addon, with two recorded exceptions that the test encodes rather than tolerates.
R31 (audit trail review) is owned jointly by inventory and accounting, because
the trail spans the stock ledger and the journal. R32 (backup and restore
assurance) is platform work and is claimed by no addon.

Any other requirement claimed twice, or by nobody, is a drift between the
manifests and docs/requirements/traceability.md and fails here.

The coverage check is not written yet; the key, depends and cycle checks are.
"""

from app.core.modules.loading import ADDONS_DIR, addon_names, manifests_in_load_order
from app.core.modules.manifest import read_manifest

ADDONS = {"base", "sales", "inventory", "procurement", "accounting", "ai", "forecasting", "home"}


def test_the_eight_addons_exist():
    assert set(addon_names()) == ADDONS


def test_every_manifest_parses():
    for name in addon_names():
        read_manifest(ADDONS_DIR / name)


def test_load_order_matches_docs_architecture():
    # docs/architecture.md, "Load order". Update both together.
    assert [m.name for m in manifests_in_load_order()] == [
        "base", "accounting", "ai", "home", "inventory", "procurement", "sales", "forecasting",
    ]


def test_ai_and_home_depend_on_base_alone():
    by_name = {m.name: m for m in manifests_in_load_order()}
    assert by_name["ai"].depends == ("base",)
    assert by_name["home"].depends == ("base",)
