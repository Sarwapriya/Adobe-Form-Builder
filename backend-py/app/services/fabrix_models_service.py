"""Port of `backend/src/services/fabrixModelsService.ts`."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models.fabrix_model import FabrixModel


def list_fabrix_models(db: Session) -> list[FabrixModel]:
    """Every configured FabriX model, enabled and disabled alike, sortOrder
    ascending — the admin management view."""
    return list(db.execute(select(FabrixModel).order_by(FabrixModel.sortOrder.asc())).scalars().all())


def list_enabled_model_ids(db: Session) -> list[str]:
    """Just the modelId of every *enabled* model, sortOrder ascending,
    deduped — exactly what the FabriX chat request's `modelIds` array
    needs. Several catalog entries deliberately alias the same underlying
    modelId, so this collapses duplicates rather than sending the same id
    twice."""
    rows = db.execute(
        select(FabrixModel).where(FabrixModel.isEnabled == True).order_by(FabrixModel.sortOrder.asc())  # noqa: E712
    ).scalars().all()
    seen: list[str] = []
    for r in rows:
        if r.modelId not in seen:
            seen.append(r.modelId)
    return seen


@dataclass
class CreateFabrixModelInput:
    name: str
    modelId: str


def create_fabrix_model(db: Session, input: CreateFabrixModelInput) -> FabrixModel:
    """New rows sort after every existing one by default (max sortOrder + 1)."""
    max_order = db.execute(select(func.max(FabrixModel.sortOrder))).scalar_one_or_none()
    next_order = (max_order if max_order is not None else -1) + 1

    created = FabrixModel(name=input.name.strip(), modelId=input.modelId.strip(), isEnabled=True, sortOrder=next_order)
    db.add(created)
    db.commit()
    db.refresh(created)
    return created


def update_fabrix_model(db: Session, id: str, input: dict[str, Any]) -> Optional[FabrixModel]:
    """Returns `None` if the id doesn't exist — callers map that to a 404."""
    existing = db.get(FabrixModel, id)
    if existing is None:
        return None

    if input.get("name") is not None:
        existing.name = input["name"].strip()
    if input.get("modelId") is not None:
        existing.modelId = input["modelId"].strip()
    if input.get("isEnabled") is not None:
        existing.isEnabled = input["isEnabled"]
    if input.get("sortOrder") is not None:
        existing.sortOrder = input["sortOrder"]
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


def move_fabrix_model(db: Session, id: str, direction: str) -> Optional[FabrixModel]:
    """Swaps sortOrder with the model immediately before/after this one in
    the current ordering — the up/down reorder buttons in the admin UI.
    No-op (returns the row as-is) if already at that end of the list.
    Returns `None` if the id doesn't exist."""
    all_models = list(db.execute(select(FabrixModel).order_by(FabrixModel.sortOrder.asc())).scalars().all())
    index = next((i for i, m in enumerate(all_models) if m.id == id), -1)
    if index == -1:
        return None

    swap_with = index - 1 if direction == "up" else index + 1
    if swap_with < 0 or swap_with >= len(all_models):
        return all_models[index]

    a = all_models[index]
    b = all_models[swap_with]
    a.sortOrder, b.sortOrder = b.sortOrder, a.sortOrder
    db.add_all([a, b])
    db.commit()
    db.refresh(a)
    return a


def delete_fabrix_model(db: Session, id: str) -> bool:
    result = db.execute(delete(FabrixModel).where(FabrixModel.id == id))
    db.commit()
    return (result.rowcount or 0) > 0
