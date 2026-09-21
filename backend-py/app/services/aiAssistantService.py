"""Port of `backend/src/services/aiAssistantService.ts`.

The orchestrator: talks to the AI provider (via aiProviderService) and decides
what to do with its reply. Every route in ai.py is a thin wrapper over these
functions.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select, text, update
from sqlalchemy.orm import Session

from app.models.ai_action import AIAction
from app.models.ai_conversation import AIConversation
from app.models.ai_conversation_message import AIConversationMessage
from app.models.user import is_admin_role
from app.services.aiCampaignTools import (
    AiToolCallerContext,
    build_campaign_references,
    find_similar_campaigns,
    find_similar_questions,
    get_campaign,
    get_campaign_questions,
    get_caller_form_detail,
    search_campaigns,
    search_questions,
    validate_form,
)
from app.services import mcp_sql_client
from app.services.aiProviderService import send_message as send_ai_message
from app.services.aiSystemPrompt import build_system_prompt

HISTORY_LIMIT = 20

# Shown to the customer whenever every AI provider tier (FabriX, then each other provider)
# failed, or an unexpected exception was raised — never the raw
# provider/exception text (e.g. "FabriXAI request timed out after 5s"),
# which would leak internal infrastructure detail into the chat transcript.
# The real error is still logged server-side for debugging.
GENERIC_AI_FAILURE_MESSAGE = "Sorry, I'm having trouble reaching the AI service right now. Please try again in a moment."

MUTATING_AI_TOOLS = [
    "CREATE_CAMPAIGN", "CLONE_CAMPAIGN", "ADD_QUESTION", "UPDATE_QUESTION",
    "DELETE_QUESTION", "REORDER_QUESTIONS", "SUGGEST_QUESTIONS",
    "TRANSLATE_QUESTIONS",
]

SERVER_EXECUTED_AI_TOOLS = ["CREATE_CAMPAIGN", "CLONE_CAMPAIGN"]


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
        parts.append(f"subsidiaryId: {auth['subsidiaryId']}")
    return ", ".join(parts)


def _extract_fenced_json(text: str) -> Optional[Any]:
    """Extracts a single fenced ```json ...``` block and parses it."""
    import re
    # Try standard fenced block first, then bare JSON as fallback
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    if not match:
        # Fallback: try to parse the whole string as bare JSON
        stripped = text.strip()
        if stripped.startswith("{") and stripped.endswith("}"):
            try:
                return json.loads(stripped)
            except (json.JSONDecodeError, ValueError):
                return None
        return None
    try:
        return json.loads(match.group(1).strip())
    except (json.JSONDecodeError, ValueError):
        return None


def _extract_tool_call(reply_text: str) -> Optional[dict[str, Any]]:
    """Extracts a tool call from the model reply."""
    extracted = _extract_fenced_json(reply_text)
    if not extracted or not isinstance(extracted, dict):
        return None
    tool = extracted.get("tool")
    args = extracted.get("args")
    if not tool or not isinstance(args, dict):
        return None
    return {"call": {"tool": tool, "args": args}, "remainderText": reply_text}


def _is_mutating_tool(tool: str) -> bool:
    return tool in MUTATING_AI_TOOLS


def _is_server_executed_tool(tool: str) -> bool:
    return tool in SERVER_EXECUTED_AI_TOOLS


def _default_proposal_message(tool: str) -> str:
    messages = {
        "CREATE_CAMPAIGN": "I've drafted a new campaign for you to confirm.",
        "CLONE_CAMPAIGN": "I've drafted a cloned campaign for you to confirm.",
        "ADD_QUESTION": "I've drafted a new question for you to review and add.",
        "UPDATE_QUESTION": "I've drafted a change to this question for you to review and apply.",
        "DELETE_QUESTION": "I've proposed removing this question — please confirm.",
        "REORDER_QUESTIONS": "I've proposed a new question order for you to review and apply.",
        "SUGGEST_QUESTIONS": "I've drafted question suggestions for you to review.",
        "TRANSLATE_QUESTIONS": "I've drafted translations for you to review.",
    }
    return messages.get(tool, "I've drafted a proposed change for you to review.")


# --- Public API -------------------------------------------------------------

async def send_chat_message(
    db: Session, auth: dict, request: dict[str, Any]
) -> dict[str, Any]:
    """Main chat endpoint — persists messages, calls AI, handles tool calls."""
    ctx = _to_caller_context(auth)
    conversation = await _load_or_create_conversation(db, auth, request)
    await _persist_message(db, conversation.id, "user", request["message"])

    try:
        history_rows = _load_history(db, conversation.id)
        prior_history = history_rows[:-1]  # drop the user message we just saved

        form_id = conversation.formId or request.get("formId")
        campaign_context_json = None
        if form_id:
            campaign = get_campaign(db, ctx, {"formId": form_id})
            if campaign:
                campaign_context_json = json.dumps(campaign)

        mcp_tools_section = await _build_mcp_tools_section(auth["role"])
        base_turns = _build_base_turns(campaign_context_json, prior_history, auth, mcp_tools_section)
        user_turn = {"role": "user", "content": _section("USER MESSAGE", request["message"])}

        initial = await send_ai_message({"messages": [*base_turns, user_turn]}, db)

        if not initial["ok"]:
            print(f"[aiAssistantService] AI provider call failed: {initial['error']}")
            await _persist_message(db, conversation.id, "assistant", GENERIC_AI_FAILURE_MESSAGE)
            return {
                "conversationId": conversation.id,
                "message": GENERIC_AI_FAILURE_MESSAGE,
                "actions": [],
                "references": [],
            }

        tool_call = _extract_tool_call(initial["replyText"])
        print(f"[aiAssistantService] replyText={initial['replyText']!r}")
        print(f"[aiAssistantService] tool_call={tool_call}")

        if not tool_call:
            # Plain text reply
            await _persist_message(
                db, conversation.id, "assistant", initial["replyText"],
                token_usage=initial.get("tokenUsage"),
                model=initial.get("model"),
            )
            return {
                "conversationId": conversation.id,
                "message": initial["replyText"],
                "actions": [],
                "references": [],
            }

        call = tool_call["call"]
        remainder_text = tool_call.get("remainderText", "")

        if not _is_mutating_tool(call["tool"]):
            return await _handle_readonly_tool(
                db, conversation, ctx, base_turns, user_turn,
                initial["replyText"], call
            )

        return await _handle_mutating_tool(
            db, conversation, ctx, auth, form_id, call, remainder_text
        )
    except Exception as err:
        print(f"[aiAssistantService] sendChatMessage failed: {err}")
        await _persist_message(db, conversation.id, "assistant", GENERIC_AI_FAILURE_MESSAGE)
        return {
            "conversationId": conversation.id,
            "message": GENERIC_AI_FAILURE_MESSAGE,
            "actions": [],
            "references": [],
        }


async def _load_or_create_conversation(
    db: Session, auth: dict, request: dict[str, Any]
) -> AIConversation:
    conv_id = request.get("conversationId")
    if conv_id:
        existing = db.get(AIConversation, conv_id)
        if not existing or existing.userId != auth["sub"]:
            raise ValueError("conversation not found")
        return existing

    title = request["message"][:80]
    conv = AIConversation(
        id=str(uuid.uuid4()),
        userId=auth["sub"],
        formId=request.get("formId"),
        title=title,
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


# MCP-SQL tools that return real row data (arbitrary or semi-arbitrary query
# results) rather than just schema/structure metadata. There's no reliable
# way to constrain arbitrary LLM-generated SQL text to one subsidiary after
# the fact (no real SQL parser here, and a slightly different query shape —
# or a prompt-injection attempt — would bypass a naive string check), so
# these stay admin-only. The remaining tools (list_connections,
# get_database_schema, find_related_tables, get_query_execution_plan,
# refresh_schema_cache) only ever reveal table/column structure, never row
# data, so they're safe to open to every authenticated user.
_MCP_DATA_TOOLS = {"execute_sql_query", "execute_parameterized_query", "get_table_sample"}


async def _build_mcp_tools_section(role: str) -> Optional[str]:
    """Describes the MCP-SQL server's live tool set to the LLM, so it can
    issue a generic `MCP_TOOL` call naming one of them — see the module
    docstring on mcp_sql_client.py for why this is a real MCP client rather
    than another entry in this app's own fenced-JSON tool convention. Returns
    None (section omitted entirely) when MCP-SQL isn't configured/reachable,
    rather than describing a capability that doesn't actually work.

    Admins get the full tool set (including the raw-data tools in
    _MCP_DATA_TOOLS) and use it as their primary lookup mechanism, replacing
    the fixed FormIQ tools (aiSystemPrompt.py's ADMIN_LOOKUP_REPLACEMENT_NOTE
    branch). Standard (subsidiary-scoped) users only see the schema-only
    subset — see _MCP_DATA_TOOLS's comment for why the raw-data tools can't
    be safely scoped to one subsidiary — and keep using the fixed
    SEARCH_CAMPAIGNS/GET_CAMPAIGN/etc. tools for actual data lookups instead.
    Enforced again in _execute_mcp_tool as a defense-in-depth backstop."""
    if not mcp_sql_client.is_enabled():
        return None
    listed = await mcp_sql_client.list_tools()
    if not listed["ok"] or not listed["tools"]:
        return None

    is_admin = is_admin_role(role)
    tools = listed["tools"] if is_admin else [t for t in listed["tools"] if t["name"] not in _MCP_DATA_TOOLS]
    if not tools:
        return None

    if is_admin:
        intro = (
            "The following tools are available via a connected database-query service (MCP), giving you "
            "broader, more flexible access to the live database than the fixed SEARCH_CAMPAIGNS/GET_CAMPAIGN/"
            "etc. tools above. Prefer those fixed tools for ordinary campaign/question lookups — they're "
            "faster and more reliable — and reach for these when they return no match, the question spans "
            "data those tools don't cover, or the user asks about something that isn't a FormIQ campaign/"
            "question at all (see the notes above for what's in each connected database). Call "
            "get_database_schema first if you don't already know the relevant table/column names, then use "
            "execute_sql_query/execute_parameterized_query (SELECT only — this assistant is read-only) to "
            "fetch what you need. Call one with:"
        )
    else:
        intro = (
            "The following schema/structure tools are available via a connected database-query service "
            "(MCP) — they describe table/column structure only, not row data. Use them ALONGSIDE "
            "SEARCH_CAMPAIGNS/GET_CAMPAIGN/SEARCH_QUESTIONS/FIND_SIMILAR_CAMPAIGNS/FIND_SIMILAR_QUESTIONS, "
            "not instead of them, when understanding the data model helps you use those tools better. "
            "Call one with:"
        )

    lines = [
        intro,
        '```json',
        '{"tool": "MCP_TOOL", "args": {"name": "<tool name below>", "arguments": { ... per that tool\'s input schema ... }}}',
        '```',
        "",
    ]
    for t in tools:
        lines.append(f"- {t['name']}: {t['description']}")
        lines.append(f"  input schema: {json.dumps(t['inputSchema'])}")
    return "\n".join(lines)


def _build_base_turns(
    campaign_context_json: Optional[str],
    history_rows: list[AIConversationMessage],
    auth: dict,
    mcp_tools_section: Optional[str] = None,
) -> list[dict[str, str]]:
    user_ctx = _build_user_context(auth)
    system_content = (
        build_system_prompt(auth["role"])
        + f"\n\nThe currently logged-in user context: {user_ctx}. "
        + "When the user asks you to create a campaign and no subsidiary is mentioned, "
        + "use their own subsidiaryId from the context above."
    )
    turns: list[dict[str, str]] = [{"role": "system", "content": system_content}]
    if mcp_tools_section:
        turns.append({"role": "system", "content": _section("DATABASE QUERY TOOLS", mcp_tools_section)})
    if campaign_context_json:
        turns.append({"role": "system", "content": _section("CAMPAIGN DATA", campaign_context_json)})
    for row in history_rows:
        if row.role in ("user", "assistant"):
            turns.append({"role": row.role, "content": row.message})
    return turns


async def _persist_message(
    db: Session, conversation_id: str, role: str, message: str,
    token_usage: Optional[int] = None, model: Optional[str] = None,
) -> None:
    msg = AIConversationMessage(
        id=str(uuid.uuid4()),
        conversationId=conversation_id,
        role=role,
        message=message,
        tokenUsage=token_usage,
        model=model,
    )
    db.add(msg)
    # Use raw SQL for the datetimeoffset column — SQLAlchemy's Python
    # datetime -> datetimeoffset binding can silently round-trip wrong
    # on pyodbc, and the server-side SYSDATETIMEOFFSET() is authoritative.
    db.execute(
        text("UPDATE fq.AIConversations SET updatedAt = SYSDATETIMEOFFSET() WHERE id = :id"),
        {"id": conversation_id},
    )
    db.commit()


async def _handle_readonly_tool(
    db: Session, conversation: AIConversation, ctx: AiToolCallerContext,
    base_turns: list[dict], user_turn: dict, tool_call_reply: str,
    call: dict[str, Any],
) -> dict[str, Any]:
    tool_result = await _execute_readonly_tool(db, ctx, call)
    await _persist_message(
        db, conversation.id, "tool",
        json.dumps({"tool": call["tool"], "args": call["args"], "result": tool_result}),
    )

    follow_up = [
        *base_turns,
        user_turn,
        {"role": "assistant", "content": tool_call_reply},
        {"role": "tool", "content": _section("TOOL RESULTS", json.dumps(tool_result, default=str))},
    ]
    final = await send_ai_message({"messages": follow_up}, db)
    if not final["ok"]:
        print(f"[aiAssistantService] AI provider follow-up call failed: {final['error']}")

    message = final["replyText"] if final["ok"] else GENERIC_AI_FAILURE_MESSAGE
    await _persist_message(
        db, conversation.id, "assistant", message,
        token_usage=final.get("tokenUsage") if final["ok"] else None,
        model=final.get("model") if final["ok"] else None,
    )

    references = []
    if call["tool"] in ("SEARCH_CAMPAIGNS", "FIND_SIMILAR_CAMPAIGNS") and isinstance(tool_result, list):
        references = await build_campaign_references(db, ctx, tool_result)

    return {"conversationId": conversation.id, "message": message, "actions": [], "references": references}


async def _execute_readonly_tool(
    db: Session, ctx: AiToolCallerContext, call: dict[str, Any]
) -> Any:
    tool = call["tool"]
    args = call["args"]
    if tool == "SEARCH_CAMPAIGNS":
        return search_campaigns(db, ctx, args)
    if tool == "GET_CAMPAIGN":
        return get_campaign(db, ctx, args)
    if tool == "GET_CAMPAIGN_QUESTIONS":
        return get_campaign_questions(db, ctx, args)
    if tool == "SEARCH_QUESTIONS":
        return search_questions(db, ctx, args)
    if tool == "FIND_SIMILAR_CAMPAIGNS":
        return find_similar_campaigns(db, ctx, args)
    if tool == "FIND_SIMILAR_QUESTIONS":
        return find_similar_questions(db, ctx, args)
    if tool == "VALIDATE_FORM":
        return validate_form(db, ctx, args)
    if tool == "MCP_TOOL":
        return await _execute_mcp_tool(ctx, args)
    raise ValueError(f"not a read-only tool: {tool}")


# MCP-SQL tools that execute arbitrary/parameterized T-SQL with no built-in
# restriction to SELECT — the only two _MUTATING_SQL_KEYWORDS below actually
# needs to guard, since every other MCP-SQL tool (list_connections,
# get_database_schema, get_table_sample, find_related_tables,
# get_query_execution_plan, refresh_schema_cache) is inherently read-only by
# what it does, not by what text it's handed.
_MCP_SQL_EXECUTION_TOOLS = {"execute_sql_query", "execute_parameterized_query"}

# Best-effort, not a real SQL parser — a cheap FormIQ-side backstop in case
# the MCP server's own DB credentials aren't strictly read-only (the spec
# frames the MCP server itself as the DB-access authority, so this is
# defense-in-depth, not the primary control).
_MUTATING_SQL_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|MERGE|EXEC|EXECUTE|GRANT|REVOKE|CREATE)\b",
    re.IGNORECASE,
)


async def _execute_mcp_tool(ctx: AiToolCallerContext, args: dict[str, Any]) -> Any:
    """Re-checks the tiered access _build_mcp_tools_section's prompt already
    encodes, as a defense-in-depth backstop in case a conversation somehow
    contains a fenced MCP_TOOL call naming a raw-data tool the caller
    shouldn't have (stale history, prompt injection) — this function is the
    one place every such call actually reaches the network."""
    name = args.get("name", "")
    arguments = args.get("arguments") or {}

    if name in _MCP_DATA_TOOLS and not is_admin_role(ctx["role"]):
        return {"error": "This tool is only available to admin accounts."}

    if name in _MCP_SQL_EXECUTION_TOOLS:
        query_text = arguments.get("query") or arguments.get("query_template") or ""
        if _MUTATING_SQL_KEYWORDS.search(query_text):
            return {"error": "This assistant is read-only; mutating SQL statements are not permitted."}

    mcp_result = await mcp_sql_client.call_tool(name, arguments)
    if not mcp_result["ok"]:
        return {"error": mcp_result["error"]}
    return mcp_result["result"]


async def _handle_mutating_tool(
    db: Session, conversation: AIConversation, ctx: AiToolCallerContext,
    auth: dict, form_id: Optional[str], call: dict[str, Any],
    remainder_text: str,
) -> dict[str, Any]:
    action = AIAction(
        id=str(uuid.uuid4()),
        conversationId=conversation.id,
        formId=form_id if not _is_server_executed_tool(call["tool"]) else None,
        userId=auth["sub"],
        actionType=call["tool"],
        requestJson=json.dumps(call["args"]),
        responseJson=None,
        confirmed=False,
        executed=False,
        executionResult=None,
    )
    db.add(action)
    db.commit()

    action_summary = {
        "id": action.id,
        "actionType": action.actionType,
        "requiresConfirmation": action.actionType == "DELETE_QUESTION",
        "data": call["args"],
    }

    message = remainder_text or _default_proposal_message(call["tool"])
    await _persist_message(db, conversation.id, "assistant", message)

    return {
        "conversationId": conversation.id,
        "message": message,
        "actions": [action_summary],
        "references": [],
    }


# --- Conversation listing/detail --------------------------------------------

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


def _find_owned_conversation(
    db: Session, conversation_id: str, auth: dict
) -> Optional[AIConversation]:
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


# --- Confirm / reject -------------------------------------------------------

async def confirm_action(
    db: Session, auth: dict, action_id: str
) -> dict[str, Any]:
    """Confirm a pending AI action."""
    action = _find_owned_action(db, action_id, auth)
    if not action:
        raise ValueError("action not found")
    if action.confirmed:
        raise ValueError("This action has already been confirmed")

    args = json.loads(action.requestJson)
    ctx = _to_caller_context(auth)

    # Re-validate form access
    if action.formId:
        detail = get_caller_form_detail(db, ctx, action.formId)
        if not detail:
            raise ValueError("form not found")

    if _is_server_executed_tool(action.actionType):
        from app.services import form_builder_service
        if action.actionType == "CREATE_CAMPAIGN":
            subsidiary_id = args["subsidiaryId"] if is_admin_role(auth["role"]) else auth.get("subsidiaryId")
            if not subsidiary_id:
                raise ValueError("This account has no subsidiary assigned")
            form = form_builder_service.create_form(
                db, name=args["name"], subsidiary_id=subsidiary_id,
                user_id=auth["sub"], project_code=args.get("projectCode"),
                origin="admin" if is_admin_role(auth["role"]) else "adhoc",
            )
            result = {"formId": form["id"]}
        elif action.actionType == "CLONE_CAMPAIGN":
            subsidiary_id = args["subsidiaryId"] if is_admin_role(auth["role"]) else auth.get("subsidiaryId")
            if not subsidiary_id:
                raise ValueError("This account has no subsidiary assigned")
            form = form_builder_service.create_form(
                db, name=args["name"], subsidiary_id=subsidiary_id,
                user_id=auth["sub"], project_code=args.get("projectCode"),
                origin="admin" if is_admin_role(auth["role"]) else "adhoc",
                copy_from_form_id=args["sourceFormId"],
            )
            result = {"formId": form["id"]}
        else:
            raise ValueError(f"not a server-executed tool: {action.actionType}")

        db.execute(
            update(AIAction).where(AIAction.id == action.id).values(
                confirmed=True, executed=True,
                responseJson=json.dumps(result),
                executionResult=json.dumps(result),
            )
        )
        db.commit()
        return {
            "actionId": action.id,
            "actionType": action.actionType,
            "executed": True,
            "formId": result["formId"],
        }

    # Client-applied
    db.execute(
        update(AIAction).where(AIAction.id == action.id).values(
            confirmed=True, executed=True,
            executionResult=json.dumps({"applied": "client"}),
        )
    )
    db.commit()
    return {
        "actionId": action.id,
        "actionType": action.actionType,
        "executed": True,
        "data": args,
    }


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


def _find_owned_action(
    db: Session, action_id: str, auth: dict
) -> Optional[AIAction]:
    action = db.get(AIAction, action_id)
    if not action:
        return None
    conv = db.get(AIConversation, action.conversationId)
    if not conv:
        return None
    if conv.userId != auth["sub"] and not is_admin_role(auth["role"]):
        return None
    return action
