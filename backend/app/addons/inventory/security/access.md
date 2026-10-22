# Inventory endpoint access

`READ_PRODUCTS` in `inventory/permissions.py` is the server policy for both
product-list and product-detail endpoints.

| Action | Owner | Admin | Sales | Inventory | Purchasing | Accounting |
| --- | --- | --- | --- | --- | --- | --- |
| Read organization products | Yes | Yes | Yes | Yes | Yes | No |

Product and stock write endpoints remain to be implemented with their own policies.
