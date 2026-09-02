"""Declarative base plus small column-type helpers shared by every model.

Column types are chosen to match the existing SQL Server schema exactly
(`backend/sql/init.sql` / `backend/src/entities/*.ts`) — this is a schema-
compatibility port, not a redesign:

- `uniqueidentifier`  -> `mssql.UNIQUEIDENTIFIER`, Python-side default
  `uuid.uuid4` (stringified) plus `server_default=NEWID()` so a fresh table
  created via Alembic/`create_all` still matches `init.sql`'s own
  `DEFAULT NEWID()`.
- `nvarchar(n)`        -> `mssql.NVARCHAR(n)`
- `nvarchar(MAX)`      -> `mssql.NVARCHAR(None)`
- `datetimeoffset`     -> `mssql.DATETIMEOFFSET`, default `SYSDATETIMEOFFSET()`
- `bit`                -> `Boolean`
- `date`               -> `Date`
- `int`                -> `Integer`

Every TS union type (`role`, `status`, ...) is stored as plain `nvarchar` in
the DB (TypeORM has no native enum column here) — modeled the same way,
typed with a Python `Literal` alias for editor/type-checker help only, not a
SQL-level CHECK/enum constraint.
"""

from __future__ import annotations

import uuid

from sqlalchemy import text
from sqlalchemy.dialects import mssql
from sqlalchemy.orm import DeclarativeBase, mapped_column


class Base(DeclarativeBase):
    pass


def uuid_pk(name: str = "id"):
    """A `UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID()` column, matching every
    entity's `@PrimaryGeneratedColumn("uuid")`."""
    return mapped_column(
        mssql.UNIQUEIDENTIFIER(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        server_default=text("NEWID()"),
    )


def uuid_col(*, nullable: bool = False):
    """A plain `UNIQUEIDENTIFIER` column (foreign-key-shaped, but modeled as a
    text-snapshot/loose reference the same way the TypeORM entities do —
    see e.g. `RefreshToken.userId`)."""
    return mapped_column(mssql.UNIQUEIDENTIFIER(as_uuid=False), nullable=nullable)


def nvarchar(length: int, *, nullable: bool = False, unique: bool = False, default=None):
    """`default` (e.g. `User.role`'s `"standard"`, mirroring TypeORM's
    `@Column({ default: "standard" })`) is applied as BOTH a Python-side
    default (so this ORM's own inserts populate it) and a `server_default`
    (a real DDL `DEFAULT` constraint) — matching `init.sql`'s own column
    defaults, and so a raw INSERT bypassing the ORM entirely still gets the
    same value TypeORM's generated column DDL would have given it."""
    return mapped_column(
        mssql.NVARCHAR(length),
        nullable=nullable,
        unique=unique or None,
        default=default,
        server_default=text(f"'{default}'") if default is not None else None,
    )


def nvarchar_max(*, nullable: bool = False, default=None):
    return mapped_column(mssql.NVARCHAR(None), nullable=nullable, default=default)


def datetimeoffset_now():
    """`datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET()`. `nullable=False`
    is explicit here (not inferred from a `Mapped[...]` annotation, since
    every one of these is assigned as a bare `col = datetimeoffset_now()`
    class attribute without one) — omitting it would silently default to
    NULL-able, unlike every TypeORM entity's un-annotated (therefore
    NOT NULL) `datetimeoffset` columns."""
    return mapped_column(mssql.DATETIMEOFFSET(), nullable=False, server_default=text("SYSDATETIMEOFFSET()"))


def datetimeoffset_nullable():
    return mapped_column(mssql.DATETIMEOFFSET(), nullable=True, default=None)


def datetimeoffset_required():
    return mapped_column(mssql.DATETIMEOFFSET(), nullable=False)
