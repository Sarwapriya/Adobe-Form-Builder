"""Port of `backend/src/utils/queryParsing.ts`."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, Optional, TypeVar

T = TypeVar("T")

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


def parse_positive_int(value: Optional[str]) -> Optional[int]:
    """Parses a query-string value into a positive integer, or `None` if it's
    missing/not a valid positive integer."""
    if value is None:
        return None
    try:
        parsed = int(value, 10)
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


@dataclass
class ResolvedPaging:
    page: int
    pageSize: int
    skip: int


def resolve_paging(page: Optional[int] = None, page_size: Optional[int] = None) -> ResolvedPaging:
    """Normalizes optional page/pageSize input into a safe page (>=1) and
    pageSize (1..100, defaulting to 20), plus the computed `skip` offset."""
    resolved_page = max(1, page if page is not None else 1)
    resolved_page_size = min(MAX_PAGE_SIZE, max(1, page_size if page_size is not None else DEFAULT_PAGE_SIZE))
    return ResolvedPaging(page=resolved_page, pageSize=resolved_page_size, skip=(resolved_page - 1) * resolved_page_size)


@dataclass
class PagedResult(Generic[T]):
    items: list[T]
    total: int
    page: int
    pageSize: int
