"""Port of `backend/src/routes/ai.router.ts` — mounted at `/api/v1/ai`.

FabriXAI-backed Form Builder assistant. `require_auth` on every route, no
blanket admin gate: both admin and subsidiary-scoped standard users use the
chatbot.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.middleware.rate_limit import AI_RATE_LIMIT, limiter
from app.security.deps import require_auth
from app.services import aiAssistantService

router = APIRouter(dependencies=[Depends(require_auth)])


class AIChatRequest(BaseModel):
    conversationId: Optional[str] = None
    formId: Optional[str] = None
    message: str = Field(min_length=1, max_length=4000)


@router.post("/chat")
@limiter.limit(AI_RATE_LIMIT)
async def chat(
    request: Request,
    body: AIChatRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> dict:
    """Main chat endpoint — sends the user's message, gets back the assistant's
    reply plus any pending actions."""
    try:
        result = await aiAssistantService.send_chat_message(
            db, auth, body.model_dump(exclude_none=True)
        )
        return result
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return {
            "conversationId": None,
            "message": f"Something went wrong while processing your request: {exc}",
            "actions": [],
            "references": [],
        }


@router.get("/conversations")
async def conversations(
    form_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> list[dict]:
    """List the caller's own conversations."""
    return aiAssistantService.list_conversations(db, auth, form_id)


@router.get("/conversations/{conversation_id}")
async def conversation_detail(
    conversation_id: str,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> dict:
    """Get full conversation detail."""
    try:
        return aiAssistantService.get_conversation(db, auth, conversation_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/actions/{action_id}/confirm")
async def confirm(
    action_id: str,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> dict:
    """Confirm a pending AI action."""
    try:
        result = await aiAssistantService.confirm_action(db, auth, action_id)
        return result
    except ValueError as exc:
        msg = str(exc)
        if "not found" in msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
        if "already" in msg.lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


@router.post("/actions/{action_id}/reject")
async def reject(
    action_id: str,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> None:
    """Reject a pending AI action."""
    try:
        aiAssistantService.reject_action(db, auth, action_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("/campaigns/search")
async def search_campaigns(
    search_text: Optional[str] = Query(None),
    project_code: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> list[dict]:
    """Direct non-chat convenience endpoint wrapping SEARCH_CAMPAIGNS."""
    ctx = aiAssistantService._to_caller_context(auth)
    from app.services.aiCampaignTools import search_campaigns as sc
    return sc(db, ctx, {
        "searchText": search_text,
        "projectCode": project_code,
        "status": status,
    })


@router.get("/campaigns/{form_id}")
async def get_campaign(
    form_id: str,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> dict:
    """Direct non-chat convenience endpoint wrapping GET_CAMPAIGN."""
    ctx = aiAssistantService._to_caller_context(auth)
    from app.services.aiCampaignTools import get_campaign as gc
    campaign = gc(db, ctx, {"formId": form_id})
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="campaign not found")
    return campaign
