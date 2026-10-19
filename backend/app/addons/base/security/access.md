# Access matrix — `base`

Roles are defined in `app/core/roles.py`. `RBACGuard` reads this matrix; the UI only
hides what a role cannot use. The guard for each row lives in `permissions.py`.

Requirements: R1, R2, R3, R4.

| Action | Owner | Admin | Sales | Inventory | Purchasing | Accounting |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /api/base/users` list people (S-09) | ● | ● |  |  |  |  |
