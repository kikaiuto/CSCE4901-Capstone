"""The seven service contracts, frozen as typed stubs.

Addons talk to each other only through these Protocols, never by importing one
another's service modules. Freezing them is FND-04 on the sprint board: it is
what unblocks the other four tracks, because a contract written by one person
alone is a contract the other four will argue with in November.
"""
