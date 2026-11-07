# Access matrix — `accounting`

Roles are defined in `app/core/roles.py`. `RBACGuard` reads this matrix; the UI only
hides what a role cannot use.

Requirements: R18, R19, R20, R21, R22, R23, R31.

Inventory can read the chart of accounts because creating a product (R7) means
choosing its inventory asset and sales revenue accounts. It cannot read or post
journal entries.

| Action | Owner | Admin | Sales | Inventory | Purchasing | Accounting |
| --- | --- | --- | --- | --- | --- | --- |
| List chart of accounts (`READ_CHART_OF_ACCOUNTS`) | Yes | Yes | No | Yes | No | Yes |
| List recent journal entries (`READ_ACCOUNTING`) | Yes | Yes | No | No | No | Yes |
| Post a manual journal entry (`POST_JOURNAL_ENTRY`) | Yes | Yes | No | No | No | Yes |
