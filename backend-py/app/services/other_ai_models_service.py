"""Port of `backend/src/services/otherAiModelsService.ts`."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.other_ai_model import OtherAiModel


def list_other_ai_models(db: Session) -> list[OtherAiModel]:
    """The known-models picklist for Other AI Providers, sortOrder
    ascending — read-only reference data, not something the admin curates
    the way FabrixModel is."""
    return list(db.execute(select(OtherAiModel).order_by(OtherAiModel.sortOrder.asc())).scalars().all())
