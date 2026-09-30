{
    "name": "forecasting",
    "label": "Forecasting",
    "summary": "Batch Holt-Winters demand forecasts with a cold-start guardrail",
    "track": "AIX",
    "depends": ["base", "sales", "inventory"],
    "screens": ["S-05"],
    "requirements": ["R28", "R29"],
    "features": ["F17"],
    "router": "router",
    "models": ["Forecast"],
    "seeds": ["data.demo"],
}
