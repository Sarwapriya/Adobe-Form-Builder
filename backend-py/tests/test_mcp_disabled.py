"""MCP-SQL access is disabled at the code level (not just via the
MCP_SQL_ENABLED env var) -- the AI assistant must ground every answer only in
this app's own direct database access (ax-innovation-sqlserver.database.windows.net,
via the four fixed tools in aiCampaignTools.py). mcp_sql_client.is_enabled()
is the single point every other MCP code path funnels through
(list_tools/call_tool internally, _build_mcp_tools_section/_execute_mcp_tool
in aiAssistantService.py), so locking that one function down is enough to
verify the whole surface is inert.
"""

from __future__ import annotations

import asyncio

from app.services import aiAssistantService, aiSystemPrompt, mcp_sql_client


def test_is_enabled_is_hardcoded_false_regardless_of_env(monkeypatch):
    monkeypatch.setattr(mcp_sql_client.settings, "MCP_SQL_ENABLED", True)
    monkeypatch.setattr(mcp_sql_client.settings, "MCP_SQL_SERVER_URL", "http://mcp-mssql:8000/mcp")
    assert mcp_sql_client.is_enabled() is False


def test_list_tools_reports_not_configured_even_with_env_enabled(monkeypatch):
    monkeypatch.setattr(mcp_sql_client.settings, "MCP_SQL_ENABLED", True)
    monkeypatch.setattr(mcp_sql_client.settings, "MCP_SQL_SERVER_URL", "http://mcp-mssql:8000/mcp")
    result = asyncio.run(mcp_sql_client.list_tools())
    assert result == {"ok": False, "error": "MCP-SQL is not configured"}


def test_call_tool_reports_not_configured_even_with_env_enabled(monkeypatch):
    monkeypatch.setattr(mcp_sql_client.settings, "MCP_SQL_ENABLED", True)
    monkeypatch.setattr(mcp_sql_client.settings, "MCP_SQL_SERVER_URL", "http://mcp-mssql:8000/mcp")
    result = asyncio.run(mcp_sql_client.call_tool("execute_sql_query", {"query": "SELECT 1"}))
    assert result == {"ok": False, "error": "MCP-SQL is not configured"}


def test_build_mcp_tools_section_returns_none_by_default():
    assert asyncio.run(aiAssistantService._build_mcp_tools_section("admin")) is None


def test_admin_system_prompt_no_longer_mentions_database_query_tools():
    prompt = aiSystemPrompt.build_system_prompt("admin")
    assert "DATABASE QUERY TOOLS" not in prompt
    assert "dwf-microsite-db-prd" not in prompt
