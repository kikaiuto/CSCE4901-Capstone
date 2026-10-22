# Base endpoint access

The six application roles live in `core/roles.py`. Policies are declared in
`base/permissions.py` and enforced by `RBACGuard` on the server.

| Action | Owner | Admin | Sales | Inventory | Purchasing | Accounting |
| --- | --- | --- | --- | --- | --- | --- |
| Read current identity | Yes | Yes | Yes | Yes | Yes | Yes |
| List organization users | Yes | Yes | No | No | No | No |

Login is public and checks credentials for the supplied organization. User
creation, invitations, and role updates have no endpoints yet.
