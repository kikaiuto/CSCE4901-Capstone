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
"""
