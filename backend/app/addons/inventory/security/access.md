
# Inventory Endpoint Access

## Overview

The Inventory addon uses role-based access control (RBAC) to
restrict access to product operations.

Permissions are defined in:

`backend/app/addons/inventory/permissions.py`

All inventory endpoints must enforce organization-level tenant
isolation and the permissions assigned to the authenticated user.

## Product Permissions

`READ_PRODUCTS` controls access to product-list and
product-detail endpoints.

`CREATE_PRODUCTS` controls access to the product-creation endpoint.

| Action | Owner | Admin | Sales | Inventory | Purchasing | Accounting |
| --- | --- | --- | --- | --- | --- | --- |
| Read organization products | Yes | Yes | Yes | Yes | Yes | No |
| Create product | Yes | Yes | No | Yes | No | No |

## Read Product Access

Users with the following roles can view products:

- Owner
- Admin
- Sales
- Inventory
- Purchasing

Users with the Accounting role cannot access the product-read
endpoints under the current permission policy.

## Create Product Access

Only users with these roles can create products:

- Owner
- Admin
- Inventory

Users with Sales, Purchasing, or Accounting roles cannot
create products.

The Create Product endpoint must validate the authenticated
user's permissions before creating a product.

## Tenant Isolation

All product operations must be scoped to the authenticated
user's organization.

A user must not be able to:

- Create products in another organization.
- Retrieve products belonging to another organization.
- Reference another organization's product category.
- Reference another organization's inventory asset account.
- Reference another organization's sales revenue account.

## Product Creation Validation

The Create Product endpoint validates:

- Product name and SKU.
- Inventory category.
- Inventory asset account.
- Sales revenue account.
- Unit cost and unit price.
- Safety stock threshold.
- SKU uniqueness within the organization.

Duplicate SKUs within the same organization must return
HTTP 409 Conflict.

Invalid request fields must return HTTP 422.

Invalid category or account references are rejected.

## Future Inventory Operations

Product updates, product deletion, stock adjustments,
and other inventory write operations are not yet implemented.

These operations will require separate permission policies
and appropriate tenant-isolation checks before implementation.
