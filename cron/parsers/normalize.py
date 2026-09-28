"""Shared row shape for the Drizzle ``sale`` table's scraped columns."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class NormalizedProduct:
    """Fields scraped for one sale row, excluding DB-generated/defaulted fields."""

    source: str
    name: str
    url: str
    scraped_at: datetime
    image_url: str | None
    current_price: float
    original_price: float | None
    colors: list[str] = field(default_factory=list)


def utc_now() -> datetime:
    """Return UTC without tzinfo for PostgreSQL's timestamp-without-time-zone column."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class IncompleteProductError(ValueError):
    """Raised when a listing is missing a required sale-table value."""


def require_field(value, field_name: str, source: str, name: str):
    if value is None:
        raise IncompleteProductError(
            f"{source} product {name!r} is missing required field {field_name!r}"
        )
    return value
