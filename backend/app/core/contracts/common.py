"""Types shared by more than one contract."""

import uuid
from dataclasses import dataclass
from enum import StrEnum


class DocumentKind(StrEnum):
    SALES_ORDER = "sales_order"
    PURCHASE_ORDER = "purchase_order"
    ADJUSTMENT = "adjustment"
    JOURNAL_ENTRY = "journal_entry"


@dataclass(frozen=True, slots=True)
class DocumentRef:
    """The source document behind a reservation, a ledger row, or a journal entry.

    Every contract names documents this way, so a ledger row and the journal
    entry it caused point at the same thing (S-05 "hovering a step shows the
    document behind it", S-07 Auto entries, known gap 2 in the design rationale).
    """

    kind: DocumentKind
    id: uuid.UUID
    number: str
    """Human number shown on screens: SO-1044, PO-0214, ADJ-0042."""
