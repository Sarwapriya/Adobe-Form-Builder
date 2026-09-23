"""The FormIQ AI chatbot orchestrator. Every route in routers/ai.py is a thin
wrapper over these functions.

Flow for one user message (`send_chat_message`):
  user prompt → the LLM (llmChatService — OpenAI, else Groq; native *local*
  tool calling) → the backend executes each tool call itself → results go back
  to the LLM → … until it answers in text (at most AI_MAX_TOOL_ROUNDS round trips).

Tools (CHAT_TOOLS):
  * Retrieval (RAG): search_previous_campaigns / get_campaign_details /
    search_question_library run on the MCP server (mcp_sql_client.
    call_formiq_tool), which reads only AX-Innovation (crm-ax) and scopes every
    query to the authenticated user from a signed header. The chatbot itself
    has no database access for retrieval, and nothing from DWF is reachable.
  * validate_form: checks a proposed new draft (ai_proposal_service); only a
    valid one is stored and shown to the user, with an "Approve & Save" action.
    Saving happens only through that click (routers/ai.py), never from here.
  * Editor tools (only offered while a campaign is open): add/update/delete/
    reorder/suggest/translate questions — staged as AIAction cards that the
    user confirms and then saves in the editor, exactly as before.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field
from sqlalchemy import select, text, update
from sqlalchemy.orm import Session

from app.config import settings
from app.form_pipeline import AnswerDefinition, QuestionDefinition
from app.models.ai_action import AIAction
from app.models.ai_conversation import AIConversation
from app.models.ai_conversation_message import AIConversationMessage
from app.models.user import is_admin_role
from app.services import ai_proposal_service, llmChatService, mcp_sql_client
from app.services.aiCampaignTools import AiToolCallerContext, get_caller_form_detail
from app.services.aiProviderService import send_message as send_ai_message
from app.services.aiSystemPrompt import HELPER_SYSTEM_PROMPT, build_system_prompt
from app.services.ai_providers_service import get_chat_provider_config

HISTORY_LIMIT = 20
MAX_TOOL_RESULT_CHARS = 8000
# Keep enough of the provider's token budget for the answer itself; history
# is the one part of the prompt that is safe to trim (oldest first).
_MIN_SAFE_COMPLETION_TOKENS = 2048

# Shown whenever the LLM call fails — never the raw provider/exception text.
GENERIC_AI_FAILURE_MESSAGE = "Sorry, I'm having trouble reaching the AI service right now. Please try again in a moment."
RATE_LIMITED_MESSAGE = "The AI service is busy right now (usage limit reached). Please try again in a minute."
UNFINISHED_MESSAGE = "I looked this up but couldn't finish putting an answer together — could you rephrase or narrow the question?"

MUTATING_AI_TOOLS = [
    "CREATE_CAMPAIGN", "CLONE_CAMPAIGN", "ADD_QUESTION", "UPDATE_QUESTION",
    "DELETE_QUESTION", "REORDER_QUESTIONS", "SUGGEST_QUESTIONS",
    "TRANSLATE_QUESTIONS",
]
# Still honoured by confirm_action for pending actions created before this
# version; the model is no longer offered these (new drafts go through
# validate_form → Approve & Save instead).
SERVER_EXECUTED_AI_TOOLS = ["CREATE_CAMPAIGN", "CLONE_CAMPAIGN"]

CONTROL_TYPES = ["radio", "checkbox", "dropdown", "text", "shortText"]


# --- tool definitions sent to the LLM (local function tools only) ----------------

def _fn(name: str, description: str, parameters: dict[str, Any]) -> dict[str, Any]:
    return {"type": "function", "function": {"name": name, "description": description, "parameters": parameters}}


RETRIEVAL_TOOLS = [
    _fn(
        "search_previous_campaigns",
        "Search previous campaigns the user may see, by keywords (campaign type, product/model, purpose — matched "
        "against names, project codes, questions and answer options) and/or similar question structure.",
        {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Keywords, e.g. 'hand raiser TV'"},
                "projectCode": {"type": "string"},
                "subsidiary": {"type": "string", "description": "Optional filter; cannot widen what the user may see"},
                "status": {"type": "string", "enum": ["draft", "published", "unpublished"]},
                "similarToFormId": {"type": "string", "description": "formId whose question structure to match"},
                "limit": {"type": "integer", "minimum": 1, "maximum": 10},
            },
        },
    ),
    _fn(
        "get_campaign_details",
        "Full configuration of one campaign from a previous search: questions (ids, types, required, answer "
        "options with ids), profile fields, consents and validation messages.",
        {"type": "object", "required": ["formId"], "properties": {"formId": {"type": "string"}}},
    ),
    _fn(
        "search_question_library",
        "Search existing questions and answer options across the campaigns the user may see, to reuse them. "
        "Results carry sourceFormId/sourceQuestionId and answer ids.",
        {
            "type": "object",
            "required": ["text"],
            "properties": {
                "text": {"type": "string"},
                "controlType": {"type": "string", "enum": CONTROL_TYPES},
                "formId": {"type": "string"},
                "subsidiary": {"type": "string"},
                "limit": {"type": "integer", "minimum": 1, "maximum": 20},
            },
        },
    ),
]

VALIDATE_FORM_TOOL = _fn(
    "validate_form",
    "Validate a complete proposed NEW campaign form. Required before presenting any proposal. If valid, the user "
    "sees a preview with an Approve & Save button; if not, fix the returned errors and call again.",
    ai_proposal_service.FORM_PROPOSAL_JSON_SCHEMA,
)

_SIMPLE_QUESTION = {
    "type": "object",
    "required": ["heading", "controlType", "required"],
    "properties": {
        "heading": {"type": "string"},
        "controlType": {"type": "string", "enum": CONTROL_TYPES},
        "required": {"type": "boolean"},
        "answers": {"type": "array", "items": {"type": "string"}},
    },
}

EDITOR_TOOLS = [
    _fn("add_question", "Stage adding one question to the open campaign.",
        {"type": "object", "required": ["question"], "properties": {"question": _SIMPLE_QUESTION}}),
    _fn("update_question", "Stage changing one existing question of the open campaign (ids from CAMPAIGN DATA).",
        {"type": "object", "required": ["questionId"], "properties": {
            "questionId": {"type": "string"}, "heading": {"type": "string"}, "required": {"type": "boolean"},
            "answers": {"type": "array", "items": {"type": "string"}}}}),
    _fn("delete_question", "Stage removing one question of the open campaign.",
        {"type": "object", "required": ["questionId"], "properties": {"questionId": {"type": "string"}}}),
    _fn("reorder_questions", "Stage a new question order for the open campaign.",
        {"type": "object", "required": ["orderedQuestionIds"], "properties": {
            "orderedQuestionIds": {"type": "array", "items": {"type": "string"}}}}),
    _fn("suggest_questions", "Generate up to 10 new candidate questions on a topic for the open campaign.",
        {"type": "object", "required": ["topic"], "properties": {
            "topic": {"type": "string"}, "count": {"type": "integer", "minimum": 1, "maximum": 10}}}),
    _fn("translate_questions", "Translate existing questions of the open campaign into another locale.",
        {"type": "object", "required": ["questionIds", "targetLocale"], "properties": {
            "questionIds": {"type": "array", "items": {"type": "string"}}, "targetLocale": {"type": "string"}}}),
]

EDITOR_TOOL_NAMES = {t["function"]["name"] for t in EDITOR_TOOLS}


def chat_tools(campaign_open: bool) -> list[dict[str, Any]]:
    return [*RETRIEVAL_TOOLS, VALIDATE_FORM_TOOL, *(EDITOR_TOOLS if campaign_open else [])]


# --- small helpers -------------------------------------------------------------

def _section(label: str, content: str) -> str:
    return f"[{label}]\n{content}"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_caller_context(auth: dict) -> AiToolCallerContext:
    return {
        "userId": auth["sub"],
        "role": auth["role"],
        "subsidiaryId": auth.get("subsidiaryId"),
    }


def _build_user_context(auth: dict) -> str:
    parts = [f"role: {auth['role']}"]
    if auth.get("subsidiaryId"):
        parts.append(f"subsidiary: {auth['subsidiaryId']}")
    return ", ".join(parts)


def _extract_fenced_json(text: str) -> tuple[Optional[Any], str]:
    """Extracts a single fenced ```json ...``` block (or bare JSON) and parses
    it. Returns (parsed_value, remainder_text). Used for the helper
    generators' fenced-JSON output contract."""
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    if not match:
        stripped = text.strip()
        if stripped.startswith("{") and stripped.endswith("}"):
            try:
                return json.loads(stripped), ""
            except (json.JSONDecodeError, ValueError):
                return None, text
        return None, text
    try:
        parsed = json.loads(match.group(1).strip())
    except (json.JSONDecodeError, ValueError):
        return None, text
    remainder = (text[: match.start()] + text[match.end():]).strip()
    return parsed, remainder


def _extract_tool_call(reply_text: str) -> Optional[dict[str, Any]]:
    """Legacy fenced-JSON tool call parser (kept for stored history/tests)."""
    extracted, remainder = _extract_fenced_json(reply_text)
    if not extracted or not isinstance(extracted, dict):
        return None
    tool = extracted.get("tool")
    args = extracted.get("args")
    if not tool or not isinstance(args, dict):
        return None
    return {"call": {"tool": tool, "args": args}, "remainderText": remainder}


def _is_mutating_tool(tool: str) -> bool:
    return tool in MUTATING_AI_TOOLS


def _is_server_executed_tool(tool: str) -> bool:
    return tool in SERVER_EXECUTED_AI_TOOLS


def _default_proposal_message(tool: str) -> str:
    messages = {
        "ADD_QUESTION": "I've drafted a new question for you to review and add.",
        "UPDATE_QUESTION": "I've drafted a change to this question for you to review and apply.",
        "DELETE_QUESTION": "I've proposed removing this question — please confirm.",
        "REORDER_QUESTIONS": "I've proposed a new question order for you to review and apply.",
    }
    return messages.get(tool, "I've drafted a change for you to review.")


def _compact_json(value: Any) -> str:
    dumped = json.dumps(value, default=str, separators=(",", ":"), ensure_ascii=False)
    if len(dumped) > MAX_TOOL_RESULT_CHARS:
        return dumped[:MAX_TOOL_RESULT_CHARS] + '..."(truncated — narrow the search)"'
    return dumped


# --- conversation persistence ---------------------------------------------------

async def _load_or_create_conversation(db: Session, auth: dict, request: dict[str, Any]) -> AIConversation:
    conv_id = request.get("conversationId")
    if conv_id:
        existing = db.get(AIConversation, conv_id)
        if not existing or existing.userId != auth["sub"]:
            raise ValueError("conversation not found")
        return existing

    conv = AIConversation(
        id=str(uuid.uuid4()),
        userId=auth["sub"],
        formId=request.get("formId"),
        title=request["message"][:80],
        status="active",
    )
    db.add(conv)
    db.commit()
    return conv


def _load_history(db: Session, conversation_id: str) -> list[AIConversationMessage]:
    rows = list(
        db.execute(
            select(AIConversationMessage)
            .where(AIConversationMessage.conversationId == conversation_id)
            .order_by(AIConversationMessage.createdAt.desc())
            .limit(HISTORY_LIMIT)
        ).scalars()
    )
    rows.reverse()
    return rows


def _trim_history_to_budget(history_turns: list[dict[str, str]], budget_chars: int) -> list[dict[str, str]]:
    """Keeps as many of the most recent history turns as fit `budget_chars`,
    dropping the oldest first — always keeps at least the most recent turn."""
    kept: list[dict[str, str]] = []
    used = 0
    for turn in reversed(history_turns):
        turn_len = len(turn["content"])
        if kept and used + turn_len > budget_chars:
            break
        used += turn_len
        kept.append(turn)
    kept.reverse()
    return kept


async def _persist_message(
    db: Session, conversation_id: str, role: str, message: str,
    token_usage: Optional[int] = None, model: Optional[str] = None,
) -> None:
    db.add(AIConversationMessage(
        id=str(uuid.uuid4()), conversationId=conversation_id, role=role,
        message=message, tokenUsage=token_usage, model=model,
    ))
    db.execute(
        text("UPDATE fq.AIConversations SET updatedAt = SYSDATETIMEOFFSET() WHERE id = :id"),
        {"id": conversation_id},
    )
    db.commit()


def _build_messages(
    auth: dict,
    campaign: Optional[dict[str, Any]],
    history_rows: list[AIConversationMessage],
    user_message: str,
    tools: list[dict[str, Any]],
    token_budget: int = llmChatService.GROQ_TOKENS_PER_MINUTE,
) -> list[dict[str, Any]]:
    system = build_system_prompt(auth["role"]) + f"\n\nSigned-in user: {_build_user_context(auth)}."
    messages: list[dict[str, Any]] = [{"role": "system", "content": system}]
    if campaign:
        messages.append({"role": "system", "content": _section("CAMPAIGN DATA (open in the editor)", _compact_json(campaign))})

    user_turn = {"role": "user", "content": user_message}
    fixed_tokens = llmChatService.estimate_tokens([*messages, user_turn], tools)
    budget_chars = max(0, (token_budget - _MIN_SAFE_COMPLETION_TOKENS - fixed_tokens) * 3)
    history = [{"role": r.role, "content": r.message} for r in history_rows if r.role in ("user", "assistant")]
    kept = _trim_history_to_budget(history, budget_chars)
    if len(kept) < len(history):
        print(f"[aiAssistantService] trimmed {len(history) - len(kept)} history turn(s) for the token budget")
    return [*messages, *kept, user_turn]


def _response(conversation_id: str, message: str, *, actions=None, references=None, proposal=None) -> dict[str, Any]:
    result: dict[str, Any] = {
        "conversationId": conversation_id,
        "message": message,
        "actions": actions or [],
        "references": references or [],
    }
    if proposal is not None:
        result["proposal"] = proposal
    return result


def _references_from_search(result: Any) -> list[dict[str, Any]]:
    campaigns = result.get("campaigns") if isinstance(result, dict) else None
    return [
        {
            "formId": c["formId"],
            "name": c.get("name", ""),
            "status": c.get("status"),
            "origin": c.get("origin") or "admin",
            "questionCount": c.get("questionCount", 0),
            "locales": c.get("locales", []),
            "updatedAt": c.get("updatedAt"),
        }
        for c in campaigns or [] if isinstance(c, dict) and c.get("formId")
    ]


# --- main chat turn -------------------------------------------------------------

async def send_chat_message(db: Session, auth: dict, request: dict[str, Any]) -> dict[str, Any]:
    conversation = await _load_or_create_conversation(db, auth, request)
    await _persist_message(db, conversation.id, "user", request["message"])

    try:
        provider = get_chat_provider_config(db)
        if provider is None:
            print("[aiAssistantService] no chat LLM provider (OpenAI/Groq) configured")
            await _persist_message(db, conversation.id, "assistant", GENERIC_AI_FAILURE_MESSAGE)
            return _response(conversation.id, GENERIC_AI_FAILURE_MESSAGE)

        prior_history = _load_history(db, conversation.id)[:-1]  # drop the message just saved
        form_id = conversation.formId or request.get("formId")
        campaign = None
        if form_id:
            details = await mcp_sql_client.call_formiq_tool("get_campaign_details", {"formId": form_id}, auth)
            campaign = None if "error" in details else details

        tools = chat_tools(campaign is not None)
        messages = _build_messages(auth, campaign, prior_history, request["message"], tools,
                                   token_budget=llmChatService.token_budget(provider))
        return await _run_tool_loop(db, conversation, auth, provider, messages, tools, form_id, campaign)
    except Exception as err:  # noqa: BLE001 - the user always gets a clean reply
        print(f"[aiAssistantService] sendChatMessage failed: {type(err).__name__}: {err}")
        db.rollback()
        await _persist_message(db, conversation.id, "assistant", GENERIC_AI_FAILURE_MESSAGE)
        return _response(conversation.id, GENERIC_AI_FAILURE_MESSAGE)


async def _run_tool_loop(
    db: Session,
    conversation: AIConversation,
    auth: dict,
    provider: Any,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]],
    form_id: Optional[str],
    campaign: Optional[dict[str, Any]],
) -> dict[str, Any]:
    references: list[dict[str, Any]] = []
    latest_proposal: Optional[dict[str, Any]] = None
    allowed_names = {t["function"]["name"] for t in tools}

    for round_number in range(1, settings.AI_MAX_TOOL_ROUNDS + 1):
        reply = await llmChatService.chat(provider, messages, tools)
        if not reply["ok"]:
            print(f"[aiAssistantService] LLM call failed (round {round_number}): {reply['error']}")
            message = RATE_LIMITED_MESSAGE if reply.get("kind") == "rate_limit" else GENERIC_AI_FAILURE_MESSAGE
            await _persist_message(db, conversation.id, "assistant", message)
            return _response(conversation.id, message, references=references, proposal=latest_proposal)

        if not reply["toolCalls"]:
            content = reply["content"].strip()
            await _persist_message(db, conversation.id, "assistant", content,
                                   token_usage=reply.get("tokenUsage"), model=reply.get("model"))
            return _response(conversation.id, content, references=references, proposal=latest_proposal)

        messages.append({
            "role": "assistant",
            "content": reply["content"] or None,
            "tool_calls": [
                {"id": c["id"], "type": "function", "function": {"name": c["name"], "arguments": c["arguments"]}}
                for c in reply["toolCalls"]
            ],
        })

        for call in reply["toolCalls"]:
            name = call["name"]
            print(f"[aiAssistantService] round={round_number} tool={name}")
            try:
                args = json.loads(call["arguments"] or "{}")
                if not isinstance(args, dict):
                    raise ValueError
            except ValueError:
                args = None

            if name not in allowed_names:
                result: Any = {"error": {"code": "UNKNOWN_TOOL", "message": f"{name} is not available"}}
            elif args is None:
                result = {"error": {"code": "BAD_ARGUMENTS", "message": "arguments must be a JSON object"}}
            elif name in mcp_sql_client.FORMIQ_MCP_TOOLS:
                result = await mcp_sql_client.call_formiq_tool(name, args, auth)
                if name == "search_previous_campaigns":
                    references = _references_from_search(result) or references
            elif name == "validate_form":
                result, row = await ai_proposal_service.validate_form(db, auth, conversation.id, args)
                if row is not None:
                    latest_proposal = ai_proposal_service.proposal_view(row, result.get("warnings"))
            else:
                staged = await _stage_editor_action(db, conversation, auth, form_id, campaign, name, args)
                if "actions" in staged:
                    message = (reply["content"] or "").strip() or staged["message"]
                    await _persist_message(db, conversation.id, "assistant", message)
                    return _response(conversation.id, message, actions=staged["actions"], references=references)
                result = staged

            await _persist_message(db, conversation.id, "tool", _compact_json({"tool": name, "args": args, "result": result}))
            messages.append({"role": "tool", "tool_call_id": call["id"], "content": _compact_json(result)})

    print(f"[aiAssistantService] stopped after {settings.AI_MAX_TOOL_ROUNDS} tool rounds")
    await _persist_message(db, conversation.id, "assistant", UNFINISHED_MESSAGE)
    return _response(conversation.id, UNFINISHED_MESSAGE, references=references, proposal=latest_proposal)


# --- editor (open campaign) actions ----------------------------------------------

def _create_pending_action(
    db: Session, conversation_id: str, form_id: Optional[str], user_id: str,
    action_type: str, args: dict[str, Any],
) -> dict[str, Any]:
    action = AIAction(
        id=str(uuid.uuid4()),
        conversationId=conversation_id,
        formId=form_id if not _is_server_executed_tool(action_type) else None,
        userId=user_id,
        actionType=action_type,
        requestJson=json.dumps(args),
        responseJson=None,
        confirmed=False,
        executed=False,
        executionResult=None,
    )
    db.add(action)
    db.commit()
    return {
        "id": action.id,
        "actionType": action.actionType,
        "requiresConfirmation": action.actionType == "DELETE_QUESTION",
        "data": args,
    }


def _tool_error(code: str, message: str) -> dict[str, Any]:
    return {"error": {"code": code, "message": message}}


async def _stage_editor_action(
    db: Session, conversation: AIConversation, auth: dict, form_id: Optional[str],
    campaign: Optional[dict[str, Any]], name: str, args: dict[str, Any],
) -> dict[str, Any]:
    """Stages an editor tool call as pending AIAction card(s). Returns
    `{"actions": [...], "message": str}` on success, or a tool error dict that
    goes back to the model (e.g. an unknown question id)."""
    if not form_id or campaign is None:
        return _tool_error("NO_OPEN_CAMPAIGN", "Open a campaign in the editor first")
    default_locale = campaign.get("defaultLocale") or "en_GB"
    known_ids = [q["id"] for q in campaign.get("questions", [])]

    def stage(action_type: str, data: dict[str, Any]) -> dict[str, Any]:
        return _create_pending_action(db, conversation.id, form_id, auth["sub"], action_type, data)

    if name == "add_question":
        raw = args.get("question") or {}
        try:
            parsed = _RawSuggestedQuestion.model_validate(raw)
        except Exception:
            return _tool_error("BAD_ARGUMENTS", "question needs heading, controlType and required")
        question = _build_suggested_question(parsed, len(known_ids) + 1, default_locale, default_locale)
        return {"actions": [stage("ADD_QUESTION", {"question": question.model_dump()})],
                "message": _default_proposal_message("ADD_QUESTION")}

    if name == "update_question":
        question_id = args.get("questionId")
        if question_id not in known_ids:
            return _tool_error("UNKNOWN_ID", "questionId is not a question of the open campaign")
        detail = get_caller_form_detail(db, _to_caller_context(auth), form_id)
        content = (detail or {}).get("draft") or (detail or {}).get("published")
        existing = next((q for q in content["definition"].questions if q.id == question_id), None) if content else None
        if existing is None:
            return _tool_error("UNKNOWN_ID", "questionId is not a question of the open campaign")
        patch: dict[str, Any] = {}
        if isinstance(args.get("heading"), str) and args["heading"].strip():
            patch["headingByLocale"] = {**existing.headingByLocale, default_locale: args["heading"].strip()}
        if isinstance(args.get("required"), bool):
            patch["required"] = args["required"]
        if isinstance(args.get("answers"), list):
            patch["answers"] = [
                AnswerDefinition(id=f"A{i}", order=i, textByLocale={default_locale: str(t)}).model_dump()
                for i, t in enumerate(args["answers"], start=1) if str(t).strip()
            ]
        if not patch:
            return _tool_error("BAD_ARGUMENTS", "nothing to change")
        return {"actions": [stage("UPDATE_QUESTION", {"questionId": question_id, "patch": patch})],
                "message": _default_proposal_message("UPDATE_QUESTION")}

    if name == "delete_question":
        if args.get("questionId") not in known_ids:
            return _tool_error("UNKNOWN_ID", "questionId is not a question of the open campaign")
        return {"actions": [stage("DELETE_QUESTION", {"questionId": args["questionId"]})],
                "message": _default_proposal_message("DELETE_QUESTION")}

    if name == "reorder_questions":
        ordered = args.get("orderedQuestionIds")
        if not isinstance(ordered, list) or not ordered or any(i not in known_ids for i in ordered):
            return _tool_error("UNKNOWN_ID", "orderedQuestionIds must only contain ids of the open campaign")
        return {"actions": [stage("REORDER_QUESTIONS", {"orderedQuestionIds": ordered})],
                "message": _default_proposal_message("REORDER_QUESTIONS")}

    if name == "suggest_questions":
        questions = await _generate_suggested_questions(db, auth["role"], args, default_locale)
        if not questions:
            return _tool_error("GENERATION_FAILED", "Could not generate suggestions right now")
        return {"actions": [stage("ADD_QUESTION", {"question": q.model_dump()}) for q in questions],
                "message": f"I've drafted {len(questions)} question suggestion(s) for you to review — add each one individually."}

    if name == "translate_questions":
        detail = get_caller_form_detail(db, _to_caller_context(auth), form_id)
        content = (detail or {}).get("draft") or (detail or {}).get("published")
        if not content:
            return _tool_error("NO_OPEN_CAMPAIGN", "The open campaign has no questions to translate")
        definition = content["definition"]
        updates = await _generate_translations(db, auth["role"], args, definition.questions, definition.meta.defaultLocale)
        if not updates:
            return _tool_error("GENERATION_FAILED", "Could not generate translations right now")
        target = args.get("targetLocale", "the requested locale")
        return {"actions": [stage("UPDATE_QUESTION", {"questionId": u["questionId"], "patch": u["patch"]}) for u in updates],
                "message": f"I've drafted translations for {len(updates)} question(s) into {target} — apply each one individually."}

    return _tool_error("UNKNOWN_TOOL", f"{name} is not available")


# --- helper generators (isolated, tool-less LLM calls) ----------------------------

class _RawSuggestedQuestion(BaseModel):
    heading: str = Field(min_length=1)
    controlType: Optional[str] = None
    required: Optional[bool] = None
    answers: Optional[list[str]] = None


class _RawSuggestedQuestionsResponse(BaseModel):
    questions: list[_RawSuggestedQuestion] = Field(min_length=1)


def _build_answer(text: str, order: int, locale: str, default_locale: str) -> AnswerDefinition:
    text_by_locale = {default_locale: text}
    if locale != default_locale:
        text_by_locale[locale] = text
    return AnswerDefinition(id=f"A{order}", order=order, textByLocale=text_by_locale)


def _build_suggested_question(
    raw: _RawSuggestedQuestion, order: int, locale: str, default_locale: str
) -> QuestionDefinition:
    heading_by_locale = {default_locale: raw.heading}
    if locale != default_locale:
        heading_by_locale[locale] = raw.heading
    control_type = raw.controlType if raw.controlType in CONTROL_TYPES else None
    answers = [] if control_type in ("text", "shortText") else [
        _build_answer(t, i + 1, locale, default_locale) for i, t in enumerate(raw.answers or [])
    ]
    return QuestionDefinition(
        id=f"Q_ai_{uuid.uuid4().hex[:8]}",
        order=order,
        controlType=control_type or ("radio" if answers else "text"),
        headingByLocale=heading_by_locale,
        subheadingByLocale={},
        required=raw.required if raw.required is not None else True,
        answers=answers,
    )


async def _generate_suggested_questions(
    db: Session, role: str, args: dict[str, Any], default_locale: str
) -> list[QuestionDefinition]:
    """A separate tool-less LLM call that turns suggest_questions' {topic,
    count} into real question drafts; retries once if the reply doesn't parse."""
    locale = args.get("locale") or default_locale
    topic = str(args.get("topic") or "this campaign").strip()
    try:
        count = max(1, min(10, int(args.get("count") or 5)))
    except (TypeError, ValueError):
        count = 5
    instruction = (
        f'Generate exactly {count} new survey question(s) about "{topic}", written in the "{locale}" locale. '
        f'"{topic}" may be an internal marketing/CRM program name rather than a literal description; if it gives '
        "no real signal of what the campaign is about, write general-purpose customer-feedback questions. "
        "Reply with ONLY a single fenced json code block, no other text, in this exact shape:\n"
        '```json\n{"questions": [{"heading": "...", "controlType": "radio", "required": true, '
        '"answers": ["...", "..."]}]}\n```\n'
        '"controlType" must be one of radio, checkbox, text, shortText, dropdown. Omit "answers" for text/shortText.'
    )
    for _attempt in range(2):
        result = await send_ai_message(
            {"messages": [{"role": "system", "content": HELPER_SYSTEM_PROMPT}, {"role": "user", "content": instruction}]},
            db,
        )
        if not result["ok"]:
            continue
        extracted, _remainder = _extract_fenced_json(result["replyText"])
        if not isinstance(extracted, dict):
            continue
        try:
            parsed = _RawSuggestedQuestionsResponse.model_validate(extracted)
        except Exception:
            continue
        questions = [_build_suggested_question(raw, i + 1, locale, default_locale) for i, raw in enumerate(parsed.questions[:count])]
        if questions:
            return questions
    return []


class _RawTranslationAnswer(BaseModel):
    answerId: str = Field(min_length=1)
    text: str = Field(min_length=1)


class _RawTranslation(BaseModel):
    questionId: str = Field(min_length=1)
    heading: str = Field(min_length=1)
    answers: Optional[list[_RawTranslationAnswer]] = None


class _RawTranslationsResponse(BaseModel):
    translations: list[_RawTranslation] = Field(min_length=1)


async def _generate_translations(
    db: Session, role: str, args: dict[str, Any], questions: list[QuestionDefinition], default_locale: str
) -> list[dict[str, Any]]:
    """Translates the open campaign's actual questions (never hallucinated ids);
    only heading/answer text is generated, merged into the existing per-locale
    maps so no other locale's text is lost. Returns [{questionId, patch}]."""
    question_ids = set(args.get("questionIds") or [])
    target_locale = args.get("targetLocale")
    targets = [q for q in questions if q.id in question_ids]
    if not targets or not target_locale:
        return []

    source_payload = [
        {
            "questionId": q.id,
            "heading": q.headingByLocale.get(default_locale, ""),
            "answers": [{"answerId": a.id, "text": a.textByLocale.get(default_locale, "")} for a in q.answers],
        }
        for q in targets
    ]
    instruction = (
        f'Translate the following question(s) into the "{target_locale}" locale:\n{json.dumps(source_payload)}\n\n'
        "Reply with ONLY a single fenced json code block, no other text, in this exact shape:\n"
        '```json\n{"translations": [{"questionId": "...", "heading": "...", '
        '"answers": [{"answerId": "...", "text": "..."}]}]}\n```'
    )
    for _attempt in range(2):
        result = await send_ai_message(
            {"messages": [{"role": "system", "content": HELPER_SYSTEM_PROMPT}, {"role": "user", "content": instruction}]},
            db,
        )
        if not result["ok"]:
            continue
        extracted, _remainder = _extract_fenced_json(result["replyText"])
        if not isinstance(extracted, dict):
            continue
        try:
            parsed = _RawTranslationsResponse.model_validate(extracted)
        except Exception:
            continue

        updates: list[dict[str, Any]] = []
        by_id = {q.id: q for q in targets}
        for translation in parsed.translations:
            question = by_id.get(translation.questionId)
            if not question:
                continue
            heading_by_locale = {**question.headingByLocale, target_locale: translation.heading}
            translated_by_answer = {a.answerId: a.text for a in (translation.answers or [])}
            answers = [
                {**a.model_dump(), "textByLocale": {**a.textByLocale, target_locale: translated_by_answer[a.id]}}
                if a.id in translated_by_answer
                else a.model_dump()
                for a in question.answers
            ]
            updates.append({"questionId": question.id, "patch": {"headingByLocale": heading_by_locale, "answers": answers}})
        if updates:
            return updates
    return []


# --- conversation listing/detail -------------------------------------------------

def list_conversations(db: Session, auth: dict, form_id: Optional[str] = None) -> list[dict[str, Any]]:
    """List the caller's own conversations."""
    stmt = select(AIConversation).where(AIConversation.userId == auth["sub"])
    if form_id:
        stmt = stmt.where(AIConversation.formId == form_id)
    rows = list(db.execute(stmt.order_by(AIConversation.updatedAt.desc())).scalars())
    return [_to_conversation_summary(c) for c in rows]


def get_conversation(db: Session, auth: dict, conversation_id: str) -> dict[str, Any]:
    """Get full conversation detail (ownership-checked)."""
    conv = _find_owned_conversation(db, conversation_id, auth)
    if not conv:
        raise ValueError("conversation not found")

    messages = list(
        db.execute(
            select(AIConversationMessage)
            .where(AIConversationMessage.conversationId == conversation_id)
            .order_by(AIConversationMessage.createdAt.asc())
        ).scalars()
    )
    summary = _to_conversation_summary(conv)
    summary["messages"] = [
        {
            "id": m.id,
            "role": m.role,
            "message": m.message,
            "createdAt": m.createdAt.isoformat() if hasattr(m.createdAt, "isoformat") else str(m.createdAt),
        }
        for m in messages if m.role in ("user", "assistant")
    ]
    return summary


def _find_owned_conversation(db: Session, conversation_id: str, auth: dict) -> Optional[AIConversation]:
    conv = db.get(AIConversation, conversation_id)
    if not conv:
        return None
    if is_admin_role(auth["role"]):
        return conv
    if conv.userId != auth["sub"]:
        return None
    return conv


def _to_conversation_summary(c: AIConversation) -> dict[str, Any]:
    return {
        "id": c.id,
        "formId": c.formId,
        "title": c.title,
        "status": c.status,
        "createdAt": c.createdAt.isoformat() if hasattr(c.createdAt, "isoformat") else str(c.createdAt),
        "updatedAt": c.updatedAt.isoformat() if hasattr(c.updatedAt, "isoformat") else str(c.updatedAt),
    }


# --- confirm / reject --------------------------------------------------------------

async def confirm_action(db: Session, auth: dict, action_id: str) -> dict[str, Any]:
    """Confirm a pending AI action."""
    action = _find_owned_action(db, action_id, auth)
    if not action:
        raise ValueError("action not found")
    if action.confirmed:
        raise ValueError("This action has already been confirmed")

    args = json.loads(action.requestJson)
    ctx = _to_caller_context(auth)

    if action.formId:
        detail = get_caller_form_detail(db, ctx, action.formId)
        if not detail:
            raise ValueError("form not found")

    if _is_server_executed_tool(action.actionType):
        from app.services import form_builder_service

        admin = is_admin_role(auth["role"])
        subsidiary_id = args.get("subsidiaryId") if admin else auth.get("subsidiaryId")
        if not subsidiary_id:
            raise ValueError("This account has no subsidiary assigned")
        copy_from = None
        if action.actionType == "CLONE_CAMPAIGN":
            copy_from = args.get("sourceFormId")
            # The clone source must be a campaign this user can actually see.
            if not copy_from or not get_caller_form_detail(db, ctx, copy_from):
                raise ValueError("form not found")
        elif action.actionType != "CREATE_CAMPAIGN":
            raise ValueError(f"not a server-executed tool: {action.actionType}")

        form = form_builder_service.create_form(
            db, name=args["name"], subsidiary_id=subsidiary_id,
            user_id=auth["sub"], project_code=args.get("projectCode"),
            origin="admin" if admin else "adhoc",
            copy_from_form_id=copy_from,
            exclude_locked_project_code=not admin,
        )
        result = {"formId": form["id"]}
        db.execute(
            update(AIAction).where(AIAction.id == action.id).values(
                confirmed=True, executed=True,
                responseJson=json.dumps(result),
                executionResult=json.dumps(result),
            )
        )
        db.commit()
        return {"actionId": action.id, "actionType": action.actionType, "executed": True, "formId": result["formId"]}

    # Client-applied
    db.execute(
        update(AIAction).where(AIAction.id == action.id).values(
            confirmed=True, executed=True,
            executionResult=json.dumps({"applied": "client"}),
        )
    )
    db.commit()
    return {"actionId": action.id, "actionType": action.actionType, "executed": True, "data": args}


def reject_action(db: Session, auth: dict, action_id: str) -> None:
    """Reject a pending AI action."""
    action = _find_owned_action(db, action_id, auth)
    if not action:
        raise ValueError("action not found")
    db.execute(
        update(AIAction).where(AIAction.id == action_id).values(
            confirmed=False, executed=False,
            executionResult=json.dumps({"rejected": True}),
        )
    )
    db.commit()


def _find_owned_action(db: Session, action_id: str, auth: dict) -> Optional[AIAction]:
    """Only the user the action was proposed to may confirm/reject it."""
    action = db.get(AIAction, action_id)
    if not action:
        return None
    conv = db.get(AIConversation, action.conversationId)
    if not conv or str(conv.userId).lower() != str(auth["sub"]).lower():
        return None
    return action
