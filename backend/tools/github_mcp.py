from dotenv import load_dotenv

load_dotenv()

import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
import os

token = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
username = os.getenv("GITHUB_USERNAME")


async def mcp_hub():
    client = MultiServerMCPClient(
        {
            "github": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-github"],
                "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": token},
                "transport": "stdio",
            }
        }
    )
    print("✅ MCP Client created successfully")
    tools = await client.get_tools()

    return tools, username


async def mcp():
    tools, username = await mcp_hub()
    return tools, username


# Initialize MCP tools lazily to avoid event loop issues
_tools = None
_username = None


def get_mcp_tools():
    global _tools, _username
    if _tools is None:
        try:
            # Try to get the current event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is running, we need to use a different approach
                import concurrent.futures

                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, mcp())
                    _tools, _username = future.result()
            else:
                _tools, _username = asyncio.run(mcp())
        except RuntimeError:
            # No event loop, create one
            _tools, _username = asyncio.run(mcp())
    return _tools, _username


# Initialize on import for backward compatibility
try:
    _tools, _username = get_mcp_tools()
    print(f"✅ MCP Tools loaded: {len(_tools) if _tools else 0} tools")
    print(f"✅ Username: {_username}")
except Exception as e:
    print(f"⚠️ MCP initialization failed: {e}")
    _tools = []
    _username = username
