# Access matrix — `sales`

Roles are defined in `app/core/rbac.py`. `RBACGuard` reads this matrix; the UI only
hides what a role cannot use. Policies are declared in `sales/permissions.py`.

Requirements: R5, R6, R13, R14, R15.

| Action | Owner | Admin | Sales | Inventory | Purchasing | Accounting |
| --- | --- | --- | --- | --- | --- | --- |
| List and read customers (`GET /customers`, `GET /customers/{id}`) | Yes | Yes | Yes | No | No | Yes |
| Create a customer (`POST /customers`) | Yes | Yes | Yes | No | No | No |
| List and read orders (`GET /orders`, `GET /orders/{id}`) | Yes | Yes | Yes | No | No | Yes |
| Create a draft order (`POST /orders`) | Yes | Yes | Yes | No | No | No |
| Confirm an order (`POST /orders/{id}/confirm`) | Yes | Yes | Yes | No | No | No |
| Fulfil an order (`POST /orders/{id}/fulfil`) | Yes | Yes | Yes | No | No | No |
| Cancel an order (`POST /orders/{id}/cancel`) | Yes | Yes | Yes | No | No | No |

Confirm reserves stock, fulfil ships it and posts revenue and COGS, and cancel
from Confirmed releases the reservation, all in the request's one transaction.
The caller's role is checked once, on the sales route; the inventory and
accounting writes it causes run under the same request.
