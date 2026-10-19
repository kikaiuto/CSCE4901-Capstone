"""The seven service contracts, frozen as typed stubs.

Addons talk to each other only through these Protocols, never by importing one
another's service modules. Freezing them is FND-04 on the sprint board: it is
what unblocks the other four tracks, because a contract written by one person
alone is a contract the other four will argue with in November.

Rules every contract follows:

- Methods take a TenantContext first. The organization always comes from the
  verified token, never from an argument a caller (or a model) could set.
- Arguments and results are the frozen dataclasses defined beside each
  Protocol. ORM models never cross a contract, which is what lets the ai and
  home addons use these without touching a session.
- Money is Decimal. Quantities are int.
- Failures raise the AppError subclasses from core.errors, or the contract's
  own subclasses of them. details() carries what the screen needs to show it.
- Implementations flush and never commit or roll back. get_tenant_session owns
  the request's one transaction: it commits when the route returns and rolls
  back when anything raises, so a confirmation that fails half way writes
  nothing (R12).
- Each operational contract has a read-only *Reader facet. The ai and home
  addons may use readers only, never a writer contract and never provide();
  tests/architecture/test_contracts.py enforces it.

Wiring: the owning addon binds its implementation once, at import time:

    bind(InventoryContract, lambda session: InventoryService(session))

and a route asks for it as a dependency, which builds it around the request's
tenant-bound session, so every contract called in one request shares one
transaction:

    inventory: InventoryContract = Depends(provide(InventoryContract))
"""

from collections.abc import Callable
from typing import Annotated, Any

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenancy import get_tenant_session

_factories: dict[type, Callable[[AsyncSession], Any]] = {}


def bind[T](contract: type[T], factory: Callable[[AsyncSession], T]) -> None:
    if contract in _factories:
        raise RuntimeError(f"{contract.__name__} is already bound")
    _factories[contract] = factory


def provide[T](contract: type[T]) -> Callable[..., T]:
    def dependency(session: Annotated[AsyncSession, Depends(get_tenant_session)]) -> T:
        try:
            factory = _factories[contract]
        except KeyError:
            raise RuntimeError(f"No implementation bound for {contract.__name__}") from None
        return factory(session)

    dependency.__name__ = f"provide_{contract.__name__}"
    return dependency
