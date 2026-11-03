"""The ORM hooks in core.tenancy, exercised without any addon route.

Route-level isolation tests live with the addon that owns the route.
"""

import pytest
from sqlalchemy import delete, func, insert, select, update
from sqlalchemy.orm import aliased, make_transient_to_detached

from app.addons.base.models import Organization, User
from app.addons.inventory.models import Product, ProductCategory
from app.core.errors import CrossTenantWrite
from app.core.roles import Role
from app.core.tenancy import bind_session


async def test_orm_reads_are_scoped_without_repository_filters(sessions, tenants):
    first, second = tenants
    async with sessions() as session:
        bind_session(session, first.organization_id)
        assert await session.get(Product, second.product_id) is None
        assert (await session.get(Product, first.product_id)).name == "Acme Widget"
        assert await session.scalar(select(func.count()).select_from(Product)) == 1
        product_alias = aliased(Product)
        assert list(await session.scalars(select(product_alias.product_id))) == [first.product_id]
        assert list(await session.scalars(select(Organization.organization_id))) == [
            first.organization_id
        ]
        joined = await session.execute(
            select(Product.product_id, ProductCategory.category_id).join(
                ProductCategory, Product.category_id == ProductCategory.category_id
            )
        )
        assert joined.all() == [(first.product_id, first.category_id)]


async def test_tenant_is_filled_in_for_new_rows(sessions, tenants):
    first, _ = tenants
    async with sessions() as session:
        bind_session(session, first.organization_id)
        category = ProductCategory(name="New category", hierarchy_level=0)
        session.add(category)
        await session.flush()
        assert category.organization_id == first.organization_id


async def test_cross_tenant_insert_is_rejected(sessions, tenants):
    first, second = tenants
    async with sessions() as session:
        bind_session(session, first.organization_id)
        session.add(ProductCategory(organization_id=second.organization_id, name="Forbidden"))
        with pytest.raises(CrossTenantWrite):
            await session.flush()


async def test_cross_tenant_foreign_key_is_rejected(sessions, tenants):
    first, second = tenants
    async with sessions() as session:
        bind_session(session, first.organization_id)
        product = await session.get(Product, first.product_id)
        product.category_id = second.category_id
        with pytest.raises(CrossTenantWrite):
            await session.flush()


async def test_update_and_delete_statements_only_affect_the_bound_tenant(sessions, tenants):
    first, second = tenants
    async with sessions() as session:
        bind_session(session, first.organization_id)
        await session.execute(update(Product).values(name="Changed"))
        await session.execute(delete(User))
        await session.commit()
    async with sessions() as session:
        assert (await session.get(Product, first.product_id)).name == "Changed"
        assert (await session.get(Product, second.product_id)).name == "Northstar Widget"
        assert await session.get(User, first.users[Role.OWNER]) is None
        assert await session.get(User, second.users[Role.OWNER]) is not None


async def test_organization_cannot_be_reassigned_or_created_on_a_bound_session(sessions, tenants):
    first, second = tenants
    async with sessions() as session:
        bind_session(session, first.organization_id)
        with pytest.raises(CrossTenantWrite):
            await session.execute(update(Product).values(organization_id=second.organization_id))
        session.add(Organization(name="New tenant"))
        with pytest.raises(CrossTenantWrite):
            await session.flush()


async def test_unsafe_bulk_forms_are_refused(sessions, tenants):
    first, second = tenants
    async with sessions() as session:
        bind_session(session, first.organization_id)
        with pytest.raises(CrossTenantWrite):
            await session.execute(insert(ProductCategory).values(name="Unsafe"))
        with pytest.raises(CrossTenantWrite):
            await session.execute(
                update(Product), [{"product_id": second.product_id, "name": "Bad"}]
            )
        with pytest.raises(CrossTenantWrite):
            await session.run_sync(lambda sync: sync.bulk_update_mappings(Product, []))


async def test_session_cannot_change_organizations_or_reuse_foreign_objects(sessions, tenants):
    first, second = tenants
    async with sessions() as session:
        bind_session(session, first.organization_id)
        with pytest.raises(CrossTenantWrite):
            bind_session(session, second.organization_id)
    async with sessions() as session:
        foreign = await session.get(Product, second.product_id)
        assert foreign is not None
        with pytest.raises(CrossTenantWrite):
            bind_session(session, first.organization_id)


async def test_a_forged_detached_object_cannot_overwrite_another_tenants_row(sessions, tenants):
    first, second = tenants
    forged = Product(product_id=second.product_id, organization_id=first.organization_id)
    make_transient_to_detached(forged)
    async with sessions() as session:
        bind_session(session, first.organization_id)
        attached = await session.merge(forged, load=False)
        attached.name = "Attempted overwrite"
        with pytest.raises(CrossTenantWrite):
            await session.flush()
    async with sessions() as session:
        assert (await session.get(Product, second.product_id)).name == "Northstar Widget"
