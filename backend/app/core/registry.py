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
    nav_items            Sidebar entries, so the nav is generated rather than
                         hand-listed in four places.
"""
