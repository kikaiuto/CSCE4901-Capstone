{
    "name": "procurement",
    "label": "Procurement",
    "summary": "Suppliers, purchase orders, and goods receipt",
    "track": "INV",
    "depends": ["base", "inventory", "accounting"],
    "screens": ["S-06"],
    "requirements": ["R16", "R17"],
    "features": ["F8", "F9"],
    "router": "router",
    "models": ["Supplier", "PurchaseOrder", "PurchaseOrderLine"],
    "seeds": ["data.demo"],
}
