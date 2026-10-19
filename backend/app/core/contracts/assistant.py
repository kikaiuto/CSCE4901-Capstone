"""Assistant contract.

The read-only surface the AI layer is allowed to see. Every method is a
parameterized tool that takes its organization from the session, never from the
model. Nothing here writes; a write intent comes back as a draft a person
confirms in the normal screen.

How that is enforced by shape rather than by convention:

- ReadOnlyTool.run receives the TenantContext separately from the model's
  arguments. The model fills `arguments` only; there is no field it could use to
  name an organization (R27).
- Tools are registered as ToolFactory callables, not instances. The dispatcher
  in core builds each tool per request around the request's tenant-bound
  session, the same way provide() builds a contract, so a tool can never open an
  unscoped session of its own. A factory receives a session and should hand it
  only to *Reader contracts.
- A tool returns plain data. There is no tool kind that writes. A request to
  create something comes back as a DraftIntent, which the frontend opens in the
  normal screen under the normal role checks (S-08 "Open as draft", R28).

Each operational addon registers its own ToolFactory in the ai_tools registry
category (core/registry.py); the ai addon never imports them.

Owned by: ai (AIX). Features: F15, F16, F18. Requirements: R25, R26, R27, R30.
"""

from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Protocol, runtime_checkable

from app.core.tenancy import TenantContext

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


@dataclass(frozen=True, slots=True)
class ToolSpec:
    name: str
    description: str
    parameters: Mapping[str, Any]
    """JSON Schema for `arguments`. Must not contain organization_id."""


@dataclass(frozen=True, slots=True)
class DraftIntent:
    """A record the assistant proposes but never saves, e.g. a purchase order."""

    kind: str
    """Which screen opens it: "purchase_order" for S-06, and so on."""
    payload: Mapping[str, Any]
    inputs_used: Mapping[str, str] = field(default_factory=dict)
    """Shown under the draft on S-08: "90-day demand", "7-day lead time"."""


@dataclass(frozen=True, slots=True)
class AssistantReply:
    text: str
    draft: DraftIntent | None
    tools_used: Sequence[str]


@runtime_checkable
class ReadOnlyTool(Protocol):
    spec: ToolSpec

    async def run(self, ctx: TenantContext, arguments: Mapping[str, Any]) -> Mapping[str, Any]:
        ...


ToolFactory = Callable[["AsyncSession"], ReadOnlyTool]
"""Builds a tool around a session already bound to the caller's organization."""


@runtime_checkable
class AssistantContract(Protocol):
    async def answer(self, ctx: TenantContext, query: str) -> AssistantReply:
        """Requirement: R26."""
        ...

    async def generate_dashboard_narrative(
        self, ctx: TenantContext, metrics: Mapping[str, Decimal]
    ) -> str:
        """Phrases figures the code already computed (S-02 note 4). The model
        never produces a number that is not in `metrics`. Requirement: R31."""
        ...
