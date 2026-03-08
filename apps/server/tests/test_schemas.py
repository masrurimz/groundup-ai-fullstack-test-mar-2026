"""
PoC unit tests for Pydantic schema validators in app.schemas.alerts.

These have no database dependency — they run in pure Python.
"""

import pytest
from pydantic import ValidationError

from app.schemas.alerts import AlertUpdateRequest


def test_empty_patch_is_rejected() -> None:
    """A PATCH with no fields set must be rejected."""
    with pytest.raises(ValidationError, match="at least one field"):
        AlertUpdateRequest()


def test_comment_whitespace_is_stripped() -> None:
    """Leading/trailing whitespace on comment must be stripped."""
    req = AlertUpdateRequest(comment="  hello  ")
    assert req.comment == "hello"


def test_blank_comment_becomes_none() -> None:
    """A comment that is only whitespace must be normalized to None."""
    req = AlertUpdateRequest(comment="   ")
    assert req.comment is None


def test_none_comment_stays_none() -> None:
    """Explicit None comment must be preserved as-is."""
    req = AlertUpdateRequest(comment=None)
    assert req.comment is None


def test_patch_with_only_comment_is_accepted() -> None:
    """A patch supplying only a comment must pass validation."""
    req = AlertUpdateRequest(comment="looks fine")
    assert req.comment == "looks fine"
    assert req.suspected_reason_id is None
    assert req.action_id is None


def test_patch_with_only_reason_id_is_accepted() -> None:
    """A patch supplying only a reason ID must pass validation."""
    import uuid

    reason_id = uuid.uuid4()
    req = AlertUpdateRequest(suspected_reason_id=reason_id)
    assert req.suspected_reason_id == reason_id


def test_patch_with_only_action_id_is_accepted() -> None:
    """A patch supplying only an action ID must pass validation."""
    import uuid

    action_id = uuid.uuid4()
    req = AlertUpdateRequest(action_id=action_id)
    assert req.action_id == action_id


def test_patch_clearing_reason_to_null_is_accepted() -> None:
    """Explicitly setting suspected_reason_id to None must be accepted."""
    req = AlertUpdateRequest(suspected_reason_id=None)
    # model_fields_set includes the key even when value is None if explicitly supplied
    assert "suspected_reason_id" in req.model_fields_set
    assert req.suspected_reason_id is None


def test_comment_max_length_is_enforced() -> None:
    """A comment exceeding 2000 characters must be rejected."""
    long_comment = "x" * 2001
    with pytest.raises(ValidationError):
        AlertUpdateRequest(comment=long_comment)


def test_comment_at_max_length_is_accepted() -> None:
    """A comment of exactly 2000 characters must be accepted."""
    exact_comment = "x" * 2000
    req = AlertUpdateRequest(comment=exact_comment)
    assert req.comment == exact_comment
