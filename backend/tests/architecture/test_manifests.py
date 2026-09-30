"""Every manifest parses and the traceability matrix stays honest.

Asserts that each manifest has the required keys, that "depends" names only real
addons, that the graph is acyclic, and that every requirement R1 through R32 is
claimed by exactly one addon. R32 is platform work with no addon and is listed as
the expected exception.
"""
