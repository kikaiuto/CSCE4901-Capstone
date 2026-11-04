"""Demo rows for the accounting addon, loaded into the seed tenants.

Features: F10, F11, F12, F13, F19. Requirements: R18, R19, R20, R21, R22, R23, R31.
Registered as the "seeds" entry of this addon's manifest (FND-06).

The chart of accounts, including every account the automatic postings find by
code in service.py.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.accounting.models import ChartOfAccounts
from app.core.contracts.accounting import AccountType
from app.core.seeding import DemoTenant, add_missing

ACCOUNTS = (
    ("1000", "Cash", AccountType.ASSET),
    ("1100", "Accounts Receivable", AccountType.ASSET),
    ("1200", "Inventory Asset", AccountType.ASSET),
    ("2000", "Accounts Payable", AccountType.LIABILITY),
    ("2100", "Sales Tax Payable", AccountType.LIABILITY),
    ("3000", "Owner Equity", AccountType.EQUITY),
    ("4000", "Sales Revenue", AccountType.REVENUE),
    ("5000", "Cost of Goods Sold", AccountType.EXPENSE),
    ("5100", "Inventory Adjustment", AccountType.EXPENSE),
    ("6000", "Operating Expenses", AccountType.EXPENSE),
)


async def seed(session: AsyncSession, tenant: DemoTenant) -> int:
    return await add_missing(
        session,
        ChartOfAccounts,
        [
            {
                "account_id": tenant.id_for("account", code),
                "organization_id": tenant.organization_id,
                "account_code": code,
                "account_name": name,
                "account_type": account_type.value,
            }
            for code, name, account_type in ACCOUNTS
        ],
    )
