{
    "name": "accounting",
    "label": "Accounting and Reporting",
    "summary": "Chart of accounts, double-entry journals, and financial statements",
    "track": "ACC",
    "depends": ["base"],
    "screens": ["S-07", "S-10"],
    "requirements": ["R18", "R19", "R20", "R21", "R22", "R23", "R31"],
    "features": ["F10", "F11", "F12", "F13", "F19"],
    "router": "router",
    "models": ["ChartOfAccounts", "JournalEntry", "JournalEntryLine"],
    "seeds": ["data.demo"],
}
