"""FastAPI application entrypoint.

Builds the addon dependency graph, then mounts each addon's router in dependency
order under the API prefix. Adding an addon means adding a manifest, not editing
this file.
"""
