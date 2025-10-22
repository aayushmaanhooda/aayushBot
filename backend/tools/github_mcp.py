from dotenv import load_dotenv

load_dotenv()

import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
import os

token = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
username= os.getenv("GITHUB_USERNAME")

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

    return tools  , username

        
async def mcp():
    tools, username = await mcp_hub()
    return tools, username

tools = asyncio.run(mcp())
print(tools[0])
print("-"*100)
print(tools[1])
