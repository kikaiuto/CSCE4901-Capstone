"""Service-layer tests for the accounting addon.

Features: F10, F11, F12, F13, F19. Requirements: R18, R19, R20, R21, R22, R23, R31."""

import uuid
from decimal import Decimal as D

import pytest

from app.addons.accounting.service import validate_double_entry
from app.core.contracts.accounting import JournalLineDraft, LineProblem

ACCOUNT = uuid.uuid4()


def line(debit="0", credit="0"):
    return JournalLineDraft(ACCOUNT, D(debit), D(credit))


def test_balanced_entry():
    check = validate_double_entry([line(debit="100.50"), line(credit="100.50")])
    assert check.is_balanced
    assert (check.total_debits, check.total_credits, check.difference) == (
        D("100.50"),
        D("100.50"),
        D("0"),
    )


def test_unequal_sides_report_the_difference():
    check = validate_double_entry([line(debit="100"), line(credit="90")])
    assert not check.is_balanced
    assert check.difference == D("10")
    assert not check.line_errors


@pytest.mark.parametrize(
    ("bad", "problem"),
    [
        (line(debit="5", credit="5"), LineProblem.BOTH_SIDES),
        (line(), LineProblem.NEITHER_SIDE),
        (line(debit="-5"), LineProblem.NEGATIVE),
        (line(debit="1.005"), LineProblem.TOO_PRECISE),
    ],
)
def test_malformed_line_is_reported(bad, problem):
    check = validate_double_entry([line(debit="10"), bad, line(credit="10")])
    assert [(e.index, e.problem) for e in check.line_errors] == [(1, problem)]
    assert not check.is_balanced


def test_every_malformed_line_is_reported():
    check = validate_double_entry([line(), line(debit="-1"), line(debit="1", credit="1")])
    assert [e.index for e in check.line_errors] == [0, 1, 2]


def test_empty_or_zero_entry_does_not_balance():
    assert not validate_double_entry([]).is_balanced
