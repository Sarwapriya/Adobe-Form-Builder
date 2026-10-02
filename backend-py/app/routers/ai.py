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
from app.services import ai_proposal_service, aiAssistantService, campaign_retrieval

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


class ReviseAnswerPatch(BaseModel):
    keep: bool = True
    text: Optional[str] = None


class ReviseQuestionPatch(BaseModel):
    keep: bool = True
    heading: Optional[str] = None
    answers: Optional[list[ReviseAnswerPatch]] = None


class ReviseProposalBody(BaseModel):
    questions: list[ReviseQuestionPatch]


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


@router.post("/proposals/{proposal_id}/revise")
async def revise_proposal(
    proposal_id: str,
    body: ReviseProposalBody,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> dict:
    """The user's own inline edit (ProposalCard checkboxes/text fields) —
    applies directly to the proposal's own stored data and re-validates, no
    LLM call. Returns `{"valid": false, "errors": [...]}` for a validation
    failure (still HTTP 200 — same shape the LLM's validate_form tool uses)."""
    try:
        return await ai_proposal_service.revise_proposal(
            db, auth, proposal_id, [q.model_dump() for q in body.questions]
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message)
    except (ConflictError, AppError) as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.message)


class WizardDraftQuestionRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=500)
    locale: str = Field(min_length=1, max_length=20)
    defaultLocale: str = Field(min_length=1, max_length=20)


@router.post("/wizard/proposals")
async def create_wizard_proposal(
    body: dict,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> dict:
    """The guided campaign wizard's non-chat equivalent of the validate_form
    tool — `body` is the same FormProposal-shaped payload validate_form takes
    (see ai_proposal_service.FORM_PROPOSAL_JSON_SCHEMA). Never raises on an
    invalid proposal (returns `{"valid": false, "errors": [...]}`, HTTP 200),
    matching validate_form's own contract."""
    return await ai_proposal_service.create_proposal_from_wizard(db, auth, body)


@router.get("/questions/search")
async def search_questions(
    text: str = Query(..., min_length=1),
    control_type: Optional[str] = Query(None, alias="controlType"),
    subsidiary: Optional[str] = Query(None),
    limit: Optional[int] = Query(None, ge=1, le=20),
    auth: dict = Depends(require_auth),
    db: Session = Depends(get_db),
) -> dict:
    """Non-chat convenience endpoint over the search_question_library
    retrieval tool — the guided wizard's Questions step (no LLM call, same as
    search_campaigns below)."""
    args = {k: v for k, v in {"text": text, "controlType": control_type, "subsidiary": subsidiary, "limit": limit}.items() if v}
    return await campaign_retrieval.call_campaign_tool(db, "search_question_library", args, auth)


@router.post("/questions/draft")
async def draft_question(
    body: WizardDraftQuestionRequest,
    auth: dict = Depends(require_auth),
    db: Session = Depends(get_db),
) -> dict:
    """Drafts exactly one new question via a single tool-less LLM call — the
    guided wizard's "nothing in the library fits" escape hatch. Bypasses the
    full chat/tool loop entirely; _generate_suggested_questions is the same
    helper the in-chat suggest_questions tool already uses."""
    questions = await aiAssistantService._generate_suggested_questions(
        db, auth["role"], {"topic": body.topic, "count": 1, "locale": body.locale}, body.defaultLocale
    )
    if not questions:
        raise HTTPException(status_code=502, detail="Could not draft a question right now")
    q = questions[0]
    return {
        "heading": q.headingByLocale.get(body.locale) or q.headingByLocale.get(body.defaultLocale, ""),
        "subheading": None,
        "controlType": q.controlType,
        "required": q.required,
        "answers": [a.textByLocale.get(body.locale) or a.textByLocale.get(body.defaultLocale, "") for a in q.answers],
        "reused": False,
        "sourceFormId": None,
        "sourceQuestionId": None,
    }


@router.get("/campaigns/search")
async def search_campaigns(
    search_text: Optional[str] = Query(None, alias="searchText"),
    project_code: Optional[str] = Query(None, alias="projectCode"),
    status_filter: Optional[str] = Query(None, alias="status"),
    auth: dict = Depends(require_auth),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Non-chat convenience endpoint over the search_previous_campaigns retrieval tool."""
    args = {k: v for k, v in {"query": search_text, "projectCode": project_code, "status": status_filter}.items() if v}
    result = await campaign_retrieval.call_campaign_tool(db, "search_previous_campaigns", args, auth)
    return aiAssistantService._references_from_search(result)


@router.get("/campaigns/{form_id}")
async def get_campaign(form_id: str, auth: dict = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    """Non-chat convenience endpoint over the get_campaign_details retrieval tool."""
    campaign = await campaign_retrieval.call_campaign_tool(db, "get_campaign_details", {"formId": form_id}, auth)
    if "error" in campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="campaign not found")
    return campaign
