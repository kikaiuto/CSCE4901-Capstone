{
    "name": "inventory",
    "label": "Inventory",
    "summary": "Product catalog, append-only stock ledger, and moving average cost",
    "track": "INV",
    "depends": ["base"],
    "screens": ["S-05"],
    "requirements": ["R7", "R8", "R9", "R10", "R11", "R12", "R31"],
    "features": ["F4", "F5", "F6", "F9", "F19"],
    "router": "router",
    "models": ["ProductCategory", "Product", "InventoryLedger"],
    "seeds": ["data.demo"],
}
