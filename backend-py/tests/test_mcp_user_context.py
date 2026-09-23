"""The signed user context sent to the MCP server, and the FormIQ MCP tool client."""

from __future__ import annotations

import asyncio
import contextlib
import json
from types import SimpleNamespace

import pytest

from app.services import mcp_sql_client
from app.services.mcp_user_context import HEADER_NAME, mint_user_context

# Shared with the MCP server repo (mcp_mssql_py: tests/test_auth.py) — both
# implementations must agree on this exact token.
SHARED_VECTOR_TOKEN = (
    "eyJleHAiOjE4MDAwMDAwNjAsImlhdCI6MTgwMDAwMDAwMCwicm9sZSI6InN0YW5kYXJkIiwic3ViIjoidXNlci0xIiwic3Vic2lkaWFyeUlkIjoiU0dFIn0"
    "._c8SffCFu-WDpElqIXTSPvS5767jzHDHjGcxBDVRcP8"
)


def test_shared_test_vector():
    token = mint_user_context({"sub": "user-1", "role": "standard", "subsidiaryId": "SGE"}, "shared-vector-secret", now=1800000000)
    assert token == SHARED_VECTOR_TOKEN


def test_missing_secret_refuses_to_mint():
    with pytest.raises(ValueError):
        mint_user_context({"sub": "u", "role": "admin"}, "")


@pytest.fixture
def fake_mcp(monkeypatch):
    """Captures what the backend sends to the MCP server."""
    import mcp
    import mcp.client.streamable_http as transport

    sent: dict = {}
    reply = {"text": json.dumps({"campaigns": []}), "is_error": False}

    @contextlib.asynccontextmanager
    async def fake_client(url, headers=None, timeout=None):
        sent["url"], sent["headers"] = url, headers
        yield (None, None, None)

    class FakeSession:
        def __init__(self, read, write):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def initialize(self):
            pass

        async def call_tool(self, name, arguments):
            sent["name"], sent["arguments"] = name, arguments
            return SimpleNamespace(content=[SimpleNamespace(type="text", text=reply["text"])], isError=reply["is_error"])

    monkeypatch.setattr(transport, "streamablehttp_client", fake_client)
    monkeypatch.setattr(mcp, "ClientSession", FakeSession)
    monkeypatch.setattr(mcp_sql_client.settings, "MCP_SQL_SERVER_URL", "http://mcp-mssql:8000/mcp")
    monkeypatch.setattr(mcp_sql_client.settings, "MCP_USER_CONTEXT_SECRET", "s3cret")
    monkeypatch.setattr(mcp_sql_client.settings, "MCP_SQL_AUTH_TOKEN", None)
    return sent, reply


AUTH = {"sub": "user-9", "role": "standard", "subsidiaryId": "SGE", "username": "u"}


def test_user_context_comes_from_the_session_not_the_tool_arguments(fake_mcp):
    sent, _reply = fake_mcp
    args = {"query": "hr", "subsidiary": "SESAR", "role": "admin"}
    result = asyncio.run(mcp_sql_client.call_formiq_tool("search_previous_campaigns", args, AUTH))
    assert result == {"campaigns": []}
    token = sent["headers"][HEADER_NAME]
    payload = json.loads(__import__("base64").urlsafe_b64decode(token.split(".")[0] + "=="))
    assert (payload["sub"], payload["role"], payload["subsidiaryId"]) == ("user-9", "standard", "SGE")
    # LLM-supplied values are passed through only as tool arguments (the MCP
    # server treats `subsidiary` as a narrowing filter and has no `role` param).
    assert sent["arguments"] == args


@pytest.mark.parametrize("name", ["execute_sql_query", "get_table_sample", "list_connections", "get_database_schema"])
def test_raw_sql_and_dwf_capable_tools_can_never_be_called(fake_mcp, name):
    sent, _reply = fake_mcp
    result = asyncio.run(mcp_sql_client.call_formiq_tool(name, {"query": "SELECT * FROM CampaignFeedBack"}, AUTH))
    assert result["error"]["code"] == "UNKNOWN_TOOL"
    assert "name" not in sent


def test_disabled_without_shared_secret(fake_mcp, monkeypatch):
    monkeypatch.setattr(mcp_sql_client.settings, "MCP_USER_CONTEXT_SECRET", None)
    result = asyncio.run(mcp_sql_client.call_formiq_tool("get_campaign_details", {"formId": "x"}, AUTH))
    assert result["error"]["code"] == "UNAVAILABLE"


def test_tool_error_payload_is_passed_through(fake_mcp):
    _sent, reply = fake_mcp
    reply["text"] = json.dumps({"error": {"code": "NOT_FOUND", "message": "campaign not found"}})
    result = asyncio.run(mcp_sql_client.call_formiq_tool("get_campaign_details", {"formId": "x"}, AUTH))
    assert result == {"error": {"code": "NOT_FOUND", "message": "campaign not found"}}


def test_only_three_retrieval_tools_are_exposed():
    assert mcp_sql_client.FORMIQ_MCP_TOOLS == {"search_previous_campaigns", "get_campaign_details", "search_question_library"}
