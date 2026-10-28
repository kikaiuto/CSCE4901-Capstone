
# Sector 7 AI ERP — Inventory Health Monitoring

## 1. Overview

The Inventory Health Monitor evaluates product stock levels
and identifies items that may require replenishment.

The initial implementation provides reusable calculation
logic and automated unit tests.

This component supports future integration with the
Sector 7 AI ERP Inventory module and dashboard.

## 2. Implemented Features

- Healthy stock classification
- Low-stock detection
- Out-of-stock detection
- Safety-stock threshold comparison
- Suggested replenishment quantity
- Negative input validation
- Automated unit tests

## 3. Business Rules

Inventory health is determined by comparing the available
quantity with the configured safety-stock threshold.

| Condition | Status |
|---|---|
| Quantity = 0 | OUT_OF_STOCK |
| 0 < Quantity < Threshold | LOW_STOCK |
| Quantity >= Threshold and Quantity > 0 | HEALTHY |

### 3.1 Threshold Boundary Behavior

A product exactly at its safety-stock threshold is
classified as HEALTHY because its available quantity
meets the configured minimum stock level.

For example:

| Quantity | Threshold | Status | Suggested Restock |
|---|---|---|---|
| 50 | 10 | HEALTHY | 0 |
| 10 | 10 | HEALTHY | 0 |
| 5 | 10 | LOW_STOCK | 5 |
| 0 | 10 | OUT_OF_STOCK | 10 |
| 1 | 0 | HEALTHY | 0 |
| 0 | 0 | OUT_OF_STOCK | 0 |

Zero inventory is always classified as OUT_OF_STOCK,
including when the safety-stock threshold is zero.

This prevents a product from being classified as
LOW_STOCK when its suggested replenishment quantity
is zero.

### 3.2 Suggested Restock Quantity

Suggested restock quantity is calculated using:

```python
max(safety_stock_threshold - quantity, 0)
```

This represents the minimum number of units needed
to restore inventory to its configured threshold.

The calculation never returns a negative quantity.

This is a threshold-based replenishment calculation,
not a complete purchasing or demand forecasting
recommendation.

### 3.3 Input Validation

The calculation engine rejects negative values for:

- Current inventory quantity
- Safety-stock threshold

Invalid inputs raise a ValueError.

These business rules remain subject to team and
sponsor approval.

## 4. Current Architecture

The inventory health calculation engine is located at:

```text
backend/app/addons/inventory/health.py
```

The implementation includes:

- StockStatus: enumeration of stock health states.
- InventoryHealth: immutable result data structure.
- calculate_inventory_health(): calculation function.

The calculation engine is independent of the database,
API endpoints, and frontend components.

This separation allows the calculation logic to be
tested independently and reused during future
inventory integration.

## 5. Proposed Future Integration

The planned integration flow is:

```text
Frontend Inventory Dashboard
            |
            v
FastAPI Inventory Endpoint
            |
            v
Inventory Service
            |
            v
Inventory Ledger / PostgreSQL
            |
            v
Inventory Health Calculator
            |
            v
Inventory Health Response
```

The Inventory Service will retrieve verified stock
balances from the inventory ledger before calculating
inventory health.

The calculated results can then be returned through
a protected API and displayed on the frontend
inventory dashboard.

This integration is planned and is not implemented
by the current calculation engine.

## 6. Security Requirements

Future API integration must:

- Require authenticated users.
- Enforce inventory-read permissions.
- Apply organization-based tenant isolation.
- Prevent access to another organization's inventory.
- Validate inventory quantities and thresholds.
- Avoid exposing cross-tenant product information.

The current standalone calculation function does
not perform authentication or database access.

Security enforcement will occur at the appropriate
API and service layers during integration.

## 7. Testing

The inventory health component has eight passing
unit tests covering:

- Healthy inventory
- Low-stock inventory
- Out-of-stock inventory
- Quantity exactly equal to the threshold
- Zero safety-stock threshold
- Zero quantity and zero threshold
- Negative inventory quantity
- Negative safety-stock threshold

The threshold boundary test confirms that a product
with quantity equal to its threshold is HEALTHY
and requires zero replenishment.

The unit tests are located at:

```text
backend/app/addons/inventory/tests/test_inventory_health.py
```

### 7.1 Verified Local Results

Inventory Health unit tests:

```text
8 passed
```

Ruff linting:

```text
All checks passed!
```

The previous full backend test suite passed with
123 tests on October 23, 2026.

A new full-suite result should be recorded after
the current changes have been tested.

## 8. Future Improvements

- Protected inventory health API
- Real-time inventory balance integration
- Low-stock dashboard
- Inventory movement history
- Configurable reorder targets
- Supplier and purchasing integration
- Sales-based demand forecasting
- Automated replenishment recommendations

## 9. Current Limitations

The calculation engine does not yet connect to
live inventory records.

Missing inventory ledger entries must not
automatically be treated as verified zero stock.

The calculation assumes that the supplied quantity
represents a verified available stock balance.

Restock quantities represent the minimum amount
required to reach the configured threshold, not
a full procurement recommendation.

The calculation does not currently consider:

- Supplier lead times
- Outstanding purchase orders
- Reserved inventory
- Forecast demand
- Supplier minimum order quantities

These capabilities may be incorporated in future
ERP development sprints.
