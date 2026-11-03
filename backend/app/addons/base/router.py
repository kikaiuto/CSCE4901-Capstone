"""Public sign-in and tenant-protected identity routes."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base import service
from app.addons.base.permissions import VIEW_PEOPLE
from app.addons.base.schemas import CurrentUserResponse, LoginRequest, TokenResponse
from app.core.contracts import bind
from app.core.contracts.identity import IdentityContract
from app.core.db import get_session
from app.core.rbac import RBACGuard
from app.core.tenancy import TenantContext, get_tenant_session, register_identity_check

register_identity_check(service.check_identity)
bind(IdentityContract, service.IdentityService)

public_router = APIRouter()
router = APIRouter()


@public_router.post("/auth/login", response_model=TokenResponse)
async def login_route(
    payload: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TokenResponse:
    return await service.login(payload, session)


@router.get("/auth/me", response_model=CurrentUserResponse)
async def me_route(
    ctx: Annotated[TenantContext, Depends(RBACGuard.any_role())],
    session: Annotated[AsyncSession, Depends(get_tenant_session, scope="function")],
) -> CurrentUserResponse:
    return await service.current_user(session, ctx)


@router.get("/users", response_model=list[CurrentUserResponse])
async def list_users(
    ctx: Annotated[TenantContext, Depends(VIEW_PEOPLE)],
    session: Annotated[AsyncSession, Depends(get_tenant_session, scope="function")],
) -> list[CurrentUserResponse]:
    return await service.list_people(session, ctx)
