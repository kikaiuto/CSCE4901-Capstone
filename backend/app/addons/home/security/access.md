
# Access Matrix — Home Dashboard

**Features:** F14 — Operational Dashboard
**Requirements:** R24 — Dashboard and Operational Metrics

## Overview

The Home addon provides authenticated users with read-only access
to operational dashboard metrics.

Access is enforced through `RBACGuard` in `app/core/rbac.py`,
using the permissions defined in
`app/addons/home/permissions.py`.

The frontend may hide dashboard features based on user roles,
but backend permission checks remain authoritative.

## Role-Based Access Matrix

| Action | Owner | Admin | Sales | Inventory | Purchasing | Accounting |
| --- | --- | --- | --- | --- | --- | --- |
| View inventory dashboard | Yes | Yes | Yes | Yes | Yes | No |

## Implemented API Endpoint

### GET /api/home/dashboard/inventory

**Purpose:** Retrieve inventory dashboard metrics for the
authenticated organization.

**Access:** Owner, Admin, Sales, Inventory, and Purchasing.

**Permission:** `READ_INVENTORY_DASHBOARD`

**Authentication:** Required.

### Response Metrics

The inventory dashboard returns:

1. Total number of products.
2. Total on-hand inventory units.
3. Total available inventory units.
4. Total inventory valuation.
5. Number of low-stock products.
6. Number of out-of-stock products.

All values are calculated from authoritative ERP data.

## Security Requirements

### Authentication

- A valid bearer access token is required.
- Missing or invalid credentials result in HTTP 401.
- User identity and role are validated by the backend.

### Authorization

- `RBACGuard` enforces the permitted roles.
- Unauthorized roles receive HTTP 403.
- Frontend visibility is not considered a security control.

### Tenant Isolation

- Every dashboard request uses the authenticated tenant context.
- The organization ID comes from the validated access token.
- Inventory records are filtered by organization.
- Users cannot retrieve another organization's inventory metrics.

### Read-Only Operations

- Dashboard endpoints do not create, update, or delete records.
- No stock movements or reservations are generated.
- No accounting entries are created.
- Financial calculations use Decimal precision.

## Inventory Calculation Rules

**On-hand stock:**
Sum of inventory ledger quantity changes.

**Committed stock:**
Sum of outstanding stock reservation changes.

**Available stock:**
On-hand stock minus committed stock.

**Inventory valuation:**
On-hand quantity multiplied by moving-average cost.

**Low-stock products:**
Products with available stock greater than zero and
below their safety-stock threshold.

**Out-of-stock products:**
Products with available stock less than or equal to zero.

Products without inventory ledger movements are currently
treated as having zero stock.

## Testing Requirements

The dashboard must be tested for:

- Missing authentication.
- Unauthorized role access.
- Successful authorized requests.
- Correct inventory calculations.
- Inventory valuation accuracy.
- Cross-tenant data isolation.
- Products without inventory movements.

## Future Dashboard Features

The following features are planned but are not covered by
the current access matrix:

- Sales performance metrics.
- Gross margin calculations.
- Accounts receivable and payable.
- Order processing statistics.
- Operational alerts and work queues.
- Forecasting summaries.

Separate permissions and access-matrix rows will be added
when those endpoints are implemented.

## Review Notes

The inventory dashboard currently uses the existing
Inventory product-read role policy.

The team should confirm whether Accounting users also
require inventory dashboard access before merging.

**Status:** Inventory dashboard access policy defined;
endpoint implementation and integration testing pending verification.
