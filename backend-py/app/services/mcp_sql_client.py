"""Client for the MCP-SQL server the AI assistant chat calls to answer
questions using live database data (see app/services/aiAssistantService.py's
"MCP_TOOL" dispatch case).

This is a real Model Context Protocol client — not the app's own homegrown
fenced-JSON tool-call convention that everything else in aiAssistantService.py
uses. The distinction matters: `list_tools`/`call_tool` here speak the actual
MCP wire protocol (JSON-RPC 2.0 over the "Streamable HTTP" transport) to a
server we don't control, via the official `mcp` SDK rather than hand-rolled
request framing — the protocol has session-header and content-negotiation
details (see the SDK's `streamablehttp_client`) that are easy to get subtly
wrong by hand.

Every function here follows the same "never raise, return {ok, ...}"
convention as fabrixAIService.py/groqAIService.py/dkms_client.py, since a
down/misbehaving MCP server should degrade the chat gracefully (the assistant
just can't answer DB questions that turn) rather than 500 the whole request.

`list_tools()`'s result is cached in-process for MCP_TOOLS_CACHE_SECONDS,
since aiAssistantService.py calls it on every single chat turn (to describe
the live tool set to the LLM) — unlike dkms_client's per-call settings
resolution (a cheap DB read), this is a real network round-trip to an
external server, so re-fetching on every message would add needless latency.
"""

from __future__ import annotations

import time
from typing import Any, Optional

from app.config import settings

MCP_TOOLS_CACHE_SECONDS = 60

_tools_cache: Optional[dict[str, Any]] = None
_tools_cache_at: float = 0.0


def is_enabled() -> bool:
    # MCP-SQL access is disabled at the code level per explicit request — the
    # AI assistant must ground every answer only in this app's own direct
    # database access (ax-innovation-sqlserver.database.windows.net, via the
    # four fixed tools in aiCampaignTools.py), not MCP's raw-SQL bridge to
    # either connected database. This deliberately overrides MCP_SQL_ENABLED
    # so a stray env-var flip on a VM can't silently re-enable it. Every
    # caller (list_tools, call_tool, and aiAssistantService's
    # _build_mcp_tools_section/_execute_mcp_tool) funnels through this one
    # function, so disabling it here is the single point of control — to
    # restore the original env-driven behavior, delete this early return and
    # uncomment the line below it.
    return False
    # return bool(settings.MCP_SQL_ENABLED and settings.MCP_SQL_SERVER_URL)


def _auth_headers() -> Optional[dict[str, str]]:
    if settings.MCP_SQL_AUTH_TOKEN:
        return {"Authorization": f"Bearer {settings.MCP_SQL_AUTH_TOKEN}"}
    return None


async def list_tools(*, use_cache: bool = True) -> dict[str, Any]:
    """Returns `{"ok": True, "tools": [{"name", "description", "inputSchema"}, ...]}`
    or `{"ok": False, "error": str}`. Never raises."""
    global _tools_cache, _tools_cache_at

    if not is_enabled():
        return {"ok": False, "error": "MCP-SQL is not configured"}

    if use_cache and _tools_cache is not None and (time.time() - _tools_cache_at) < MCP_TOOLS_CACHE_SECONDS:
        return _tools_cache

    try:
        from mcp import ClientSession
        from mcp.client.streamable_http import streamablehttp_client
    except ImportError as exc:
        return {"ok": False, "error": f"mcp package not installed: {exc}"}

    try:
        async with streamablehttp_client(
            settings.MCP_SQL_SERVER_URL, headers=_auth_headers(), timeout=settings.MCP_SQL_TIMEOUT_SECONDS
        ) as (read, write, _get_session_id):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.list_tools()
                tools = [
                    {
                        "name": t.name,
                        "description": t.description or "",
                        "inputSchema": t.inputSchema,
                    }
                    for t in result.tools
                ]
    except Exception as exc:  # noqa: BLE001 - deliberately broad, see module docstring
        print(f"[mcpSqlClient] list_tools failed: {exc}")
        return {"ok": False, "error": str(exc)}

    response = {"ok": True, "tools": tools}
    _tools_cache = response
    _tools_cache_at = time.time()
    return response


async def call_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Returns `{"ok": True, "result": <content>}` or `{"ok": False, "error": str}`.
    Never raises."""
    if not is_enabled():
        return {"ok": False, "error": "MCP-SQL is not configured"}

    try:
        from mcp import ClientSession
        from mcp.client.streamable_http import streamablehttp_client
    except ImportError as exc:
        return {"ok": False, "error": f"mcp package not installed: {exc}"}

    try:
        async with streamablehttp_client(
            settings.MCP_SQL_SERVER_URL, headers=_auth_headers(), timeout=settings.MCP_SQL_TIMEOUT_SECONDS
        ) as (read, write, _get_session_id):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(name, arguments)
    except Exception as exc:  # noqa: BLE001 - see module docstring
        print(f"[mcpSqlClient] call_tool({name}) failed: {exc}")
        return {"ok": False, "error": str(exc)}

    if result.isError:
        text = "; ".join(getattr(block, "text", str(block)) for block in result.content)
        return {"ok": False, "error": text or "MCP tool call returned an error"}

    content = [
        {"type": block.type, "text": getattr(block, "text", None)} if block.type == "text" else {"type": block.type}
        for block in result.content
    ]
    return {"ok": True, "result": content}
