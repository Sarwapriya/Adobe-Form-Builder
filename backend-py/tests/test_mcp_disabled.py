"""The raw-SQL MCP path (arbitrary queries against either connected database,
including DWF) stays disabled at the code level. The chatbot's only retrieval
path is the fixed FormIQ tools (mcp_sql_client.call_formiq_tool), which read
AX-Innovation only — see tests/test_mcp_user_context.py."""

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


def test_prompt_never_mentions_dwf_or_raw_database_tools():
    for role in ("admin", "superadmin", "standard"):
        prompt = aiSystemPrompt.build_system_prompt(role)
        for forbidden in ("DATABASE QUERY TOOLS", "dwf", "DWF", "execute_sql_query", "CampaignFeedBack"):
            assert forbidden not in prompt


def test_prompt_is_the_versioned_file():
    assert aiSystemPrompt.CHATBOT_PROMPT_VERSION == 2
    assert aiSystemPrompt.build_system_prompt("standard") == aiSystemPrompt.load_chatbot_prompt(2)


def test_no_raw_sql_tool_is_offered_to_the_model():
    names = {t["function"]["name"] for t in aiAssistantService.chat_tools(True)}
    assert not names & {"execute_sql_query", "execute_parameterized_query", "get_table_sample", "list_connections", "get_database_schema"}
