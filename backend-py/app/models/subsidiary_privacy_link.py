"""Admin-managed reference table of each subsidiary+locale's real Privacy
Policy URL (e.g. https://www.samsung.com/ae/info/privacy/) — lets the form
builder auto-fill the Privacy Policy consent's Link URL instead of a user
having to know/type the right regional URL by hand. Row presence is the
whole record; there is nothing else to soft-delete here."""

from __future__ import annotations

from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk


class SubsidiaryPrivacyLink(Base):
    __tablename__ = "SubsidiaryPrivacyLinks"
    __table_args__ = (
        UniqueConstraint("subsidiaryName", "localeCode", name="UQ_SubsidiaryPrivacyLinks_pair"),
    )

    id: Mapped[str] = uuid_pk()
    subsidiaryName: Mapped[str] = nvarchar(100)
    localeCode: Mapped[str] = nvarchar(20)
    url: Mapped[str] = nvarchar(500)
    createdAt = datetimeoffset_now()
