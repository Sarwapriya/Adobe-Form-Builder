"""Standalone connectivity check for the MCP-SQL server (MCP_SQL_SERVER_URL
in .env) — run this BEFORE trusting the chat integration, since it isolates
whether the server/transport/protocol actually line up from whether the AI
provider + tool-dispatch plumbing around it works.

Usage (from backend-py/, with your .env pointed at the real server):
    python scripts/test_mcp_sql.py

Prints the discovered tools (name/description/input schema) on success, or
the real error on failure — most likely failure mode is the server using the
older HTTP+SSE transport instead of the Streamable HTTP transport this client
assumes (see mcp_sql_client.py's docstring); if so, tell me the error text
and the client swaps to `mcp.client.sse.sse_client` instead, same call shape.
"""

from __future__ import annotations

import asyncio
import json
import sys

from app.services import mcp_sql_client


async def main() -> None:
    if not mcp_sql_client.is_enabled():
        print("MCP-SQL is not configured — set MCP_SQL_SERVER_URL (and leave MCP_SQL_ENABLED=true) in .env")
        sys.exit(1)

    print(f"Listing tools from {mcp_sql_client.settings.MCP_SQL_SERVER_URL} ...")
    listed = await mcp_sql_client.list_tools(use_cache=False)
    if not listed["ok"]:
        print(f"FAILED: {listed['error']}")
        sys.exit(1)

    tools = listed["tools"]
    if not tools:
        print("Connected, but the server exposed zero tools.")
        return

    print(f"OK — {len(tools)} tool(s) found:\n")
    for t in tools:
        print(f"- {t['name']}: {t['description']}")
        print(f"  input schema: {json.dumps(t['inputSchema'], indent=2)}")
        print()


if __name__ == "__main__":
    asyncio.run(main())
