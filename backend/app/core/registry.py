"""Cross-addon registry.

Addons contribute to named categories instead of importing one another. This is
what lets the Home and AI surfaces read from every track without a module that
imports all eight addons, and it is how the AI layer stays isolated.

    queue_providers      S-02 work queue rows, grouped Confirm, Reorder,
                         Receive, Fix. Contributed by sales, inventory,
                         procurement, and accounting.

    dashboard_metrics    S-02 headline figures. Deterministic and computed from
                         the ledger with no AI in the path. Requirements: R24.

    ai_tools             Read-only parameterized tools the assistant may call.
                         Each addon registers its own. Requirements: R25, R26.

    nav_items            Module rail entries, so the nav is generated rather than
                         hand-listed in four places.

The dashboard metric registry connects operational addons to the Home dashboard
without requiring direct imports between business addons.

Features: F14.
Requirements: R24.
"""

from collections.abc import Awaitable, Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenancy import TenantContext

# --------------------------------------------------
# DASHBOARD METRIC PROVIDER TYPE
# --------------------------------------------------

# Each dashboard provider receives:
# 1. The current tenant-bound database session.
# 2. The authenticated tenant context.
#
# Providers return calculated metrics asynchronously.

DashboardMetricProvider = Callable[
    [AsyncSession, TenantContext],
    Awaitable[object],
]


# --------------------------------------------------
# DASHBOARD METRIC PROVIDER REGISTRY
# --------------------------------------------------

# Example registrations:
#
# "inventory" -> Inventory dashboard metrics provider
# "sales"     -> Sales dashboard metrics provider
# "accounting" -> Accounting dashboard metrics provider
#
# Registration does not execute the provider.

_dashboard_metric_providers: dict[
    str,
    DashboardMetricProvider,
] = {}


# --------------------------------------------------
# REGISTER DASHBOARD METRIC PROVIDERS
# --------------------------------------------------


def register_dashboard_metric(
    name: str,
    provider: DashboardMetricProvider,
) -> None:
    """Register a dashboard metrics provider.

    Each provider is registered under a unique name.

    Re-registering the exact same provider is allowed.
    Replacing an existing provider with another callable is rejected.
    """

    if not name or not name.strip():
        raise ValueError("Dashboard metric name cannot be empty")

    if not callable(provider):
        raise TypeError("Dashboard metric provider must be callable")

    existing = _dashboard_metric_providers.get(name)

    if existing is not None:
        if existing is provider:
            return

        raise RuntimeError(f"Dashboard metric '{name}' is already registered")

    _dashboard_metric_providers[name] = provider


# --------------------------------------------------
# RETRIEVE DASHBOARD METRICS
# --------------------------------------------------


async def dashboard_metric(
    name: str,
    session: AsyncSession,
    ctx: TenantContext,
) -> object:
    """Retrieve metrics from a registered dashboard provider.

    The provider receives the current request's database session
    and authenticated tenant context.

    This preserves tenant isolation and allows multiple
    ERP addons to contribute dashboard metrics.

    Raises RuntimeError if the requested provider is not registered.
    """

    try:
        provider = _dashboard_metric_providers[name]

    except KeyError:
        raise RuntimeError(f"No dashboard metric provider registered for '{name}'") from None

    return await provider(
        session,
        ctx,
    )
