# Sector 7 AI ERP — Inventory Health Monitoring

## 1. Overview

The Inventory Health Monitor is a backend component of the Sector 7 AI ERP system that evaluates inventory availability and identifies products requiring replenishment.

The feature started as an independent calculation engine and has now been integrated with the existing Inventory module through a protected FastAPI endpoint.

The implementation retrieves stock balances from the inventory service, accounts for reserved inventory, compares available stock against each product's safety-stock threshold, and returns the resulting inventory health status.

The primary objectives are to:

- Identify healthy, low-stock, and out-of-stock products.
- Calculate minimum suggested replenishment quantities.
- Use actual inventory ledger and reservation data.
- Protect inventory information through authentication and role-based access control.
- Maintain organization-based tenant isolation.
- Provide structured data for future frontend dashboard integration.

This implementation uses deterministic business rules and does not require an AI model.

## 2. Implemented Features

The Inventory Health Monitoring feature currently supports:

- Healthy stock classification.
- Low-stock detection.
- Out-of-stock detection.
- Safety-stock threshold comparison.
- Suggested restock quantity calculation.
- Validation against negative inventory values.
- Integration with the existing inventory service.
- Stock balance retrieval using inventory ledger records.
- Consideration of committed inventory reservations.
- A protected inventory health API endpoint.
- Organization-based tenant isolation.
- Role-based authorization using existing permissions.
- Structured API responses using Pydantic.
- Eight calculation unit tests.
- Seven API integration tests.
- Technical documentation of the implementation and business rules.

The feature uses existing inventory models, database queries, and security components. No additional database migration is required.

## 3. Business Rules

Inventory health is determined by comparing the **available stock quantity** with the product's configured safety-stock threshold.

Available stock is calculated as:

**Available Stock = On-Hand Stock − Committed Stock**

On-hand stock represents the quantity recorded through inventory ledger transactions.

Committed stock represents inventory reserved for outstanding operations, including sales order reservations.

Available stock represents the quantity not already committed to other operations.

### 3.1 Inventory Health Classification

| Condition | Inventory Status |
|---|---|
| Quantity = 0 | OUT_OF_STOCK |
| 0 < Quantity < Threshold | LOW_STOCK |
| Quantity >= Threshold and Quantity > 0 | HEALTHY |

The classification follows these rules:

1. When available stock is zero, the product is classified as `OUT_OF_STOCK`.
2. When available stock is positive but below the safety-stock threshold, the product is classified as `LOW_STOCK`.
3. When available stock is positive and meets or exceeds the safety-stock threshold, the product is classified as `HEALTHY`.

A product exactly at its safety-stock threshold is considered healthy.

### 3.2 Threshold Boundary Behavior

The following examples demonstrate the calculation rules.

| Available Quantity | Safety Threshold | Status | Suggested Restock |
|---|---|---|---|
| 50 | 10 | HEALTHY | 0 |
| 10 | 10 | HEALTHY | 0 |
| 5 | 10 | LOW_STOCK | 5 |
| 0 | 10 | OUT_OF_STOCK | 10 |
| 1 | 0 | HEALTHY | 0 |
| 0 | 0 | OUT_OF_STOCK | 0 |

Zero available stock is always classified as out of stock, including when the safety-stock threshold is zero.

This rule avoids the inconsistent behavior where an item at its threshold could be marked low stock while requiring no replenishment.

### 3.3 Suggested Restock Quantity

Suggested replenishment is calculated using:

`max(safety_stock_threshold - quantity, 0)`

Where:

- `safety_stock_threshold` is the configured minimum stock level.
- `quantity` is the current available stock quantity.

For example:

If a product has an available quantity of 3 and a safety-stock threshold of 5:

**Suggested Restock = max(5 − 3, 0) = 2 units**

The calculation never returns a negative quantity.

The suggested restock quantity represents the minimum amount needed to reach the configured safety-stock threshold. It is not a complete purchasing recommendation or sales-demand forecast.

### 3.4 Inventory Reservation Behavior

The inventory health calculation considers committed stock reservations through the existing inventory service.

Example:

| Inventory Measurement | Quantity |
|---|---|
| On-hand stock | 10 |
| Committed stock | 7 |
| Available stock | 3 |
| Safety-stock threshold | 5 |

Although the warehouse physically contains 10 units, seven units are already committed.

The inventory health endpoint therefore evaluates the remaining three available units.

**Result:**

- Status: `LOW_STOCK`
- Suggested restock quantity: `2`

Using available inventory prevents reserved stock from being incorrectly counted as freely available.

### 3.5 Input Validation

The calculation engine rejects negative values for:

- Inventory quantity.
- Safety-stock threshold.

Invalid negative inputs raise a `ValueError`.

The current product creation schema also prevents negative safety-stock thresholds.

These business rules remain subject to confirmation by the project team and sponsor.

## 4. Current System Architecture

The feature follows the existing modular architecture of the Sector 7 AI ERP backend.

### 4.1 Main Components

| Component | File | Responsibility |
|---|---|---|
| Health Calculator | `health.py` | Determines stock status and restock quantity |
| Inventory Service | `service.py` | Retrieves product information and stock balances |
| Inventory Repository | `repository.py` | Performs tenant-scoped database queries |
| Inventory API Router | `router.py` | Defines protected HTTP endpoints |
| API Schemas | `schemas.py` | Validates and structures API responses |
| Permissions | `permissions.py` | Defines inventory access permissions |
| Inventory Models | `models.py` | Defines products, ledger entries, and reservations |

These components are located under:

`backend/app/addons/inventory/`

### 4.2 System Architecture Flow

The Inventory Health API follows this request flow:

**Frontend / API Client**

↓

**FastAPI Inventory Router**

↓

**Authentication and Role-Based Access Control**

↓

**Inventory Health Service Function**

↓

**Existing Inventory Service**

↓

**Inventory Repository**

↓

**PostgreSQL Inventory Ledger and Stock Reservations**

↓

**Inventory Health Calculator**

↓

**Validated Inventory Health API Response**

The calculator remains independent of database access and HTTP request handling.

This separation supports maintainability, independent testing, and reuse across future inventory features.

### 4.3 Inventory Health Calculation Engine

File:

`backend/app/addons/inventory/health.py`

The calculation engine contains:

**StockStatus**

An enumeration of supported health classifications:

- `HEALTHY`
- `LOW_STOCK`
- `OUT_OF_STOCK`

**InventoryHealth**

An immutable data structure containing:

- Current quantity.
- Safety-stock threshold.
- Stock status.
- Suggested restock quantity.

**calculate_inventory_health()**

A reusable function that validates inventory values and calculates the stock health result.

### 4.4 Integration with the Existing Inventory Service

File:

`backend/app/addons/inventory/service.py`

The new `get_product_health()` function connects the existing stock calculation engine to the inventory service.

Its responsibilities are to:

1. Retrieve the requested product using the authenticated organization's identifier.
2. Confirm that the product belongs to the organization.
3. Instantiate the existing `InventoryService`.
4. Retrieve stock levels through `InventoryService.get_stock()`.
5. Obtain the product's available stock quantity.
6. Read the configured safety-stock threshold.
7. Pass both values to `calculate_inventory_health()`.
8. Return the calculated `InventoryHealth` result.

The implementation reuses existing stock calculations rather than duplicating inventory ledger queries.

## 5. Inventory Health API Integration

### 5.1 Implemented Endpoint

**Method:** `GET`

**Endpoint:**

`/api/inventory/products/{product_id}/health`

This endpoint returns inventory health information for an existing product belonging to the authenticated organization.

### 5.2 Request Processing

When the endpoint receives a request:

1. FastAPI resolves the authenticated user.
2. The existing `READ_PRODUCTS` guard checks authorization.
3. The request obtains a tenant-scoped database session.
4. The service retrieves the product within the authenticated organization.
5. The inventory service calculates stock levels using the ledger and reservation records.
6. Available stock is compared against the product's safety-stock threshold.
7. The health calculator determines the inventory status and suggested restock quantity.
8. The API returns a validated `InventoryHealthResponse`.

### 5.3 Response Schema

The API returns the following fields:

| Field | Type | Description |
|---|---|---|
| `product_id` | UUID | Identifier of the requested product |
| `quantity` | Integer | Available stock quantity |
| `safety_stock_threshold` | Integer | Configured minimum stock level |
| `status` | String enum | HEALTHY, LOW_STOCK, or OUT_OF_STOCK |
| `suggested_restock_quantity` | Integer | Minimum quantity required to reach the threshold |

### 5.4 Example API Response

Illustrative response for a product with three available units and a safety-stock threshold of five:

```json
{
  "product_id": "11111111-1111-4111-8111-111111111111",
  "quantity": 3,
  "safety_stock_threshold": 5,
  "status": "LOW_STOCK",
  "suggested_restock_quantity": 2
}
```

The example product identifier is illustrative and not a record from the actual database.

### 5.5 Existing Inventory APIs

The health API is integrated alongside the existing product endpoints.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/inventory/products` | List tenant-owned products |
| GET | `/api/inventory/products/{product_id}` | Retrieve an individual product |
| POST | `/api/inventory/products` | Create a new inventory product |
| GET | `/api/inventory/products/{product_id}/health` | Retrieve a product's stock health |

The new endpoint extends the existing Inventory module without replacing its previous functionality.

### 5.6 API Registration Verification

The new endpoint was verified through FastAPI's generated OpenAPI schema.

The application registered:

`/api/inventory/products/{product_id}/health`

The existing system health endpoint, `/health`, is separate from the inventory health endpoint.

The inventory health endpoint is implemented and registered locally. Integration into the frontend dashboard remains future work.

## 6. Security and Tenant Isolation

The Inventory Health API follows existing Sector 7 AI ERP security conventions.

### 6.1 Authentication

Users must provide valid authentication credentials before accessing inventory health information.

Requests without credentials receive HTTP `401 Unauthorized`.

Requests with invalid authentication tokens also receive HTTP `401 Unauthorized`.

### 6.2 Role-Based Authorization

The endpoint uses the existing `READ_PRODUCTS` permission guard.

Under the current access configuration, the following roles can read inventory information:

- Owner
- Admin
- Sales
- Inventory
- Purchasing

The Accounting role is not included in this permission guard and receives HTTP `403 Forbidden` when attempting to access the endpoint.

### 6.3 Organization-Based Tenant Isolation

Each request uses the organization identifier derived from the authenticated tenant context.

The service retrieves products through tenant-scoped database operations.

A user from one organization cannot retrieve another organization's inventory health information.

For a product outside the authenticated organization, the API returns HTTP `404 Not Found`.

This prevents disclosure of another organization's product information.

### 6.4 Security Responsibilities

Security responsibilities are divided across the backend:

- The router enforces authentication and role-based permissions.
- The tenant context identifies the authenticated organization.
- The service retrieves organization-owned records.
- The repository performs tenant-scoped data access.
- The health calculator performs deterministic calculations without direct database access.

The endpoint does not modify inventory quantities, ledger records, reservations, or accounting entries.

It is a read-only API.

## 7. Testing and Verification

The implementation includes both calculation unit tests and API integration tests.

### 7.1 Inventory Health Unit Tests

File:

`backend/app/addons/inventory/tests/test_inventory_health.py`

Eight unit-test cases cover:

1. Healthy inventory.
2. Low-stock inventory.
3. Out-of-stock inventory.
4. Quantity exactly equal to the safety-stock threshold.
5. Zero safety-stock threshold with positive quantity.
6. Zero quantity and zero safety-stock threshold.
7. Negative inventory quantity.
8. Negative safety-stock threshold.

These tests verify the calculation logic independently of the database and API layers.

### 7.2 Inventory Health API Integration Tests

File:

`backend/app/addons/inventory/tests/test_inventory_health_api.py`

Seven new tests cover:

| Test | Verified Behavior |
|---|---|
| Missing authentication | Returns HTTP 401 |
| Invalid authentication token | Returns HTTP 401 |
| Unauthorized role | Returns HTTP 403 |
| Cross-tenant product access | Returns HTTP 404 |
| Out-of-stock product | Returns correct status and restock value |
| Stock exactly at threshold | Returns HEALTHY with zero suggested restock |
| Reserved inventory | Uses available quantity after committed reservations |

The integration tests use the existing two-tenant test setup.

The stock-based tests use the inventory service to create receipt and reservation transactions, then verify the API's calculated responses.

### 7.3 Verified Local Test Results

The following results were obtained after implementing the new API.

**Ruff code-quality check:**

```text
All checks passed!
```

**New Inventory Health API tests:**

```text
7 passed in 0.64s
```

**Complete backend test suite:**

```text
261 passed, 1 skipped in 12.66s
```

The complete test suite finished without reported failures.

The skipped test remains separate from the seven newly added API tests. PostgreSQL-specific concurrency behavior should also be verified in the configured database test environment.

### 7.4 Endpoint Registration Check

FastAPI's OpenAPI schema was inspected to verify that the new endpoint was registered successfully.

The output included:

```text
/api/inventory/products/{product_id}/health
/health
```

This confirmed endpoint registration. The API integration tests separately verified the health endpoint's behavior.

### 7.5 Testing Summary

| Verification | Result |
|---|---|
| Inventory health calculation tests | 8 existing cases |
| New API integration tests | 7 passed |
| Complete local backend test suite | 261 passed |
| Skipped tests | 1 |
| Ruff linting | Passed |
| FastAPI endpoint registration | Verified |

These results confirm successful local validation of the implemented feature.

## 8. Future Improvements

Although the backend API is implemented, several enhancements remain possible.

### 8.1 Frontend Dashboard Integration

Connect the new inventory health endpoint to the Inventory Dashboard.

Potential dashboard features include:

- Color-coded inventory health indicators.
- Low-stock product lists.
- Out-of-stock alerts.
- Suggested replenishment quantities.
- Inventory availability summaries.

### 8.2 Inventory Health Overview API

Create a tenant-scoped summary endpoint that retrieves health information for multiple products efficiently.

This would reduce the need for the frontend to issue a separate request for every product.

### 8.3 Configurable Reorder Targets

Extend replenishment calculations to support:

- Minimum stock targets.
- Desired reorder levels.
- Configurable safety-stock policies.
- Product-specific replenishment settings.

### 8.4 Procurement Integration

Use purchasing information to improve replenishment planning.

Possible inputs include:

- Outstanding purchase orders.
- Expected incoming stock.
- Supplier lead times.
- Supplier minimum order quantities.

### 8.5 Forecasting and AI Integration

The existing deterministic inventory health calculator can provide verified inventory information to future forecasting and advisory components.

Potential enhancements include:

- Historical demand analysis.
- Predictive low-stock warnings.
- Sales-based demand forecasting.
- Advisory replenishment recommendations.

Any future AI output must remain advisory and must not directly modify authoritative inventory or accounting records.

### 8.6 Additional Integration Testing

Expand verification to cover:

- PostgreSQL-specific behavior.
- Concurrent inventory updates.
- Stock changes following receipt, shipment, and reservation release.
- Larger product datasets.
- Frontend-to-backend integration.

## 9. Current Limitations and Design Considerations

The current Inventory Health API provides deterministic stock monitoring, but it is not a complete replenishment or inventory forecasting system.

### 9.1 Missing Inventory Ledger History

The existing inventory service returns zero on-hand quantity when a product has no recorded stock movements.

Consequently, a newly created product with no inventory ledger entries is currently classified as `OUT_OF_STOCK`.

This represents current application behavior and does not independently verify whether a physical warehouse count has occurred.

The project team should confirm whether missing ledger history represents initialized zero stock or an unverified balance.

### 9.2 Available Stock Versus On-Hand Stock

The implemented health calculation uses available stock rather than total on-hand stock.

This means reserved inventory reduces the quantity used for health classification.

Although this approach reflects stock not committed to orders, the team and sponsor should approve it as the intended business rule.

### 9.3 Simplified Replenishment Calculations

The suggested replenishment quantity only restores available stock to the configured safety-stock threshold.

It does not calculate an economic order quantity, a purchasing target, or a forecast-based order recommendation.

The calculation does not currently incorporate:

- Supplier lead times.
- Outstanding purchase order quantities.
- Supplier minimum order quantities.
- Forecast demand.
- Seasonal demand patterns.
- Purchasing costs or order frequency.

Committed reservations are already considered when calculating available stock.

### 9.4 Incoming Inventory

The existing inventory stock reader currently reports incoming stock as zero until an approved integration with procurement incoming-quantity data is available.

Therefore, the health calculation does not reduce suggested replenishment quantities based on expected incoming purchase orders.

### 9.5 Frontend Integration

The backend API endpoint is implemented and locally tested, but this contribution does not implement frontend dashboard connectivity.

Frontend display, interactive alerts, and inventory health summaries remain separate development tasks.

### 9.6 Production Verification

The current feature passed the local backend test suite.

Production deployment, end-to-end frontend testing, and broader operational verification are outside the scope of this contribution.

The project team should review the implementation and its business-rule assumptions before merging or deploying the feature.

---

## Implementation Summary

The Smart Inventory Health Monitoring feature now connects the original standalone calculation engine to the existing Sector 7 AI ERP Inventory service and exposes the results through a protected FastAPI endpoint.

The implementation reuses existing product records, inventory ledger balances, committed stock reservations, authentication, and role-based permissions.

It introduces seven new API integration tests while preserving the existing calculation unit tests and broader backend functionality.

**Latest verified local result: 261 tests passed, 1 skipped, with Ruff checks passing.**

The next major milestone is connecting inventory health information to the frontend dashboard and obtaining team approval for the available-stock and uninitialized-inventory business rules.