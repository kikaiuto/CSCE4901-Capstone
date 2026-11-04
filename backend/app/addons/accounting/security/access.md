# Access matrix — `accounting`

Roles are defined in `app/core/rbac.py`. `RBACGuard` reads this matrix; the UI only
hides what a role cannot use.

Requirements: R18, R19, R20, R21, R22, R23, R31.

| Action | Owner | Admin | Sales | Inventory | Purchasing | Accounting |
| --- | --- | --- | --- | --- | --- | --- |
| List chart of accounts (`READ_ACCOUNTING`) | Yes | Yes | No | No | No | Yes |
| List recent journal entries (`READ_ACCOUNTING`) | Yes | Yes | No | No | No | Yes |
| Post a manual journal entry (`POST_JOURNAL_ENTRY`) | Yes | Yes | No | No | No | Yes |

The automatic postings (`post_sale`, `post_receipt`, `post_adjustment` and their
previews) have no route of their own. They run inside the sales, procurement, and
inventory routes that call `AccountingContract`, under those routes' guards.
