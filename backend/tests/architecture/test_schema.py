import re
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

from app.addons.accounting.models import JournalEntryLine
from app.core.db import Base
from app.core.modules.loading import import_models
from app.core.tenancy import TenantRoot, TenantScoped


def test_every_model_declares_its_tenant_boundary():
    import_models()
    for mapper in Base.registry.mappers:
        assert issubclass(mapper.class_, TenantScoped | TenantRoot), mapper.class_.__name__
        assert not mapper.columns.organization_id.nullable


def test_ledger_amounts_use_the_required_precision():
    for name in ("debit", "credit"):
        column = JournalEntryLine.__mapper__.columns[name]
        assert (column.type.precision, column.type.scale) == (15, 2)


def test_migration_history_preserves_the_database_branch_root():
    root = Path(__file__).resolve().parents[2]
    config = Config(str(root / "alembic.ini"))
    config.set_main_option("script_location", str(root / "alembic"))
    scripts = ScriptDirectory.from_config(config)
    assert scripts.get_bases() == ["eb867def2d3c"]
    assert scripts.get_heads() == ["4b1d7e9a2c30"]


def test_contract_status_enums_match_the_check_constraints():
    from app.addons.procurement.models import PurchaseOrder
    from app.addons.sales.models import SalesOrder
    from app.core.contracts.procurement import PurchaseOrderStatus
    from app.core.contracts.sales import OrderStatus

    for model, enum in ((SalesOrder, OrderStatus), (PurchaseOrder, PurchaseOrderStatus)):
        (check,) = [c for c in model.__table__.constraints if (c.name or "").endswith("_status")]
        allowed = set(re.findall(r"'([A-Z_]+)'", str(check.sqltext)))
        assert {status.value for status in enum} == allowed, model.__name__
