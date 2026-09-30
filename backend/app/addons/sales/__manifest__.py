{
    "name": "sales",
    "label": "Sales and CRM",
    "summary": "Customers, sales orders, and the order state machine",
    "track": "SLS",
    "depends": ["base", "inventory", "accounting"],
    "screens": ["S-03", "S-04"],
    "requirements": ["R5", "R6", "R13", "R14", "R15"],
    "features": ["F3", "F6", "F7"],
    "router": "router",
    "models": ["Customer", "SalesOrder", "SalesOrderLine"],
    "seeds": ["data.demo"],
}
