"""The FormIQ AI chatbot API — mounted at `/api/v1/ai`.

Groq-backed assistant (see services/aiAssistantService.py). `require_auth` on
every route, no blanket admin gate: both admin and subsidiary-scoped standard
users use the chatbot; what each can see is enforced by the MCP server and
the services, not here.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.errors import AppError, ConflictError, NotFoundError
from app.middleware.rate_limit import AI_RATE_LIMIT, limiter
from app.security.deps import require_auth
from app.services import ai_proposal_service, aiAssistantService, mcp_sql_client

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
    except Exception:
        import traceback
        traceback.print_exc()
        return {
            "conversationId": None,
            "message": aiAssistantService.GENERIC_AI_FAILURE_MESSAGE,
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


class SaveProposalRequest(BaseModel):
    approvalToken: str = Field(min_length=1, max_length=200)


@router.post("/proposals/{proposal_id}/approve")
async def approve_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> dict:
    """The user's explicit "Approve & Save" click, part 1: issues a one-time
    approval token bound to exactly this proposal version. Only reachable from
    the UI with the user's own session — never an LLM tool."""
    try:
        return ai_proposal_service.approve_proposal(db, auth, proposal_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.message)


@router.post("/proposals/{proposal_id}/save")
async def save_proposal(
    proposal_id: str,
    body: SaveProposalRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> dict:
    """Part 2 (save_draft_form): creates the draft only with a valid approval
    token for this exact, unchanged, still-valid proposal version."""
    try:
        return await ai_proposal_service.save_draft_form(db, auth, proposal_id, body.approvalToken)
    except ai_proposal_service.ApprovalError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message)
    except (ConflictError, AppError) as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.message)


@router.get("/campaigns/search")
async def search_campaigns(
    search_text: Optional[str] = Query(None, alias="searchText"),
    project_code: Optional[str] = Query(None, alias="projectCode"),
    status_filter: Optional[str] = Query(None, alias="status"),
    auth: dict = Depends(require_auth),
) -> list[dict]:
    """Non-chat convenience endpoint over the MCP search_previous_campaigns tool."""
    args = {k: v for k, v in {"query": search_text, "projectCode": project_code, "status": status_filter}.items() if v}
    result = await mcp_sql_client.call_formiq_tool("search_previous_campaigns", args, auth)
    return aiAssistantService._references_from_search(result)


@router.get("/campaigns/{form_id}")
async def get_campaign(form_id: str, auth: dict = Depends(require_auth)) -> dict:
    """Non-chat convenience endpoint over the MCP get_campaign_details tool."""
    campaign = await mcp_sql_client.call_formiq_tool("get_campaign_details", {"formId": form_id}, auth)
    if "error" in campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="campaign not found")
    return campaign
