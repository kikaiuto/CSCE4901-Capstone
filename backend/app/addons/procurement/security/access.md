# Access matrix — `procurement`

Roles are defined in `app/core/rbac.py`. `RBACGuard` reads this matrix; the UI only
hides what a role cannot use.

Requirements: R16, R17.

| Action | Owner | Admin | Sales | Inventory | Purchasing | Accounting |
| --- | --- | --- | --- | --- | --- | --- |
| List suppliers (`READ_PROCUREMENT`) | Yes | Yes | No | Yes | Yes | Yes |
| Create a supplier (`MANAGE_PROCUREMENT`) | Yes | Yes | No | Yes | Yes | No |
| List or open purchase orders (`READ_PROCUREMENT`) | Yes | Yes | No | Yes | Yes | Yes |
| Create a purchase order (`MANAGE_PROCUREMENT`) | Yes | Yes | No | Yes | Yes | No |
| Preview a goods receipt (`READ_PROCUREMENT`) | Yes | Yes | No | Yes | Yes | Yes |
| Receive goods against a purchase order (`MANAGE_PROCUREMENT`) | Yes | Yes | No | Yes | Yes | No |
