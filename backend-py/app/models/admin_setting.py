"""Port of `backend/src/entities/AdminSetting.ts`.

Plain key/value settings table — `value` is `NVARCHAR(MAX)` (widened by
migration `1960000000000-WidenAdminSettingValue`) since a few settings (e.g.
`FABRIX_OPENAPI_TOKEN`'s encrypted value) are large signed tokens.

TODO(phase N): a typed settings-service layer (SMTP/FabriX/Claude/SFTP) reads
and writes rows here via `app.security.secret_cipher` for anything sensitive —
not built in this phase, just the table itself.
"""

from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, nvarchar_max
from sqlalchemy.dialects import mssql


class AdminSetting(Base):
    __tablename__ = "AdminSettings"

    key: Mapped[str] = mapped_column(mssql.NVARCHAR(50), primary_key=True)
    value: Mapped[str] = nvarchar_max()
