# LANGGRAPH FLOW
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv

from langgraph.prebuilt import ToolNode, tools_condition
import asyncio
from langgraph.types import Command, interrupt
from langchain_core.messages import HumanMessage
from tools.web import web_search_tool
from tools.rag import rag_tool
from tools.prompt import system_prompt
from tools.github_mcp import mcp_hub
from langchain_core.tools import tool
import asyncio

load_dotenv()


async def mcp():
    tools, username = await mcp_hub()
    return tools, username


mcp_tools = asyncio.run(mcp())[0]
username = asyncio.run(mcp())[1]


# utility tools
@tool
def now_tool(tz: str = "Australia/Sydney") -> str:
    """
    Use this tool to return current dat eand time to the user
    Return the current local date/time.
    """
    return datetime.now(ZoneInfo(tz)).strftime("%Y-%m-%d %H:%M:%S %Z")


llm = init_chat_model("openai:gpt-4o")


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]


TOOLS = [web_search_tool, rag_tool, now_tool] + mcp_tools
tool_node = ToolNode(TOOLS)


async def debug_tool_node(state: AgentState) -> dict:
    """Debug wrapper around tool execution with MCP username injection"""
    print("🔧 Executing tools...")

    # Check if any MCP tools are being called
    messages = state.get("messages", [])
    last_message = messages[-1] if messages else None

    # Check if the last message has tool calls
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        print(
            f"🔧 Tool calls detected: {[tc.get('name', 'unknown') for tc in last_message.tool_calls]}"
        )

        # Print tool calls BEFORE username injection
        print("\n📋 TOOL CALLS BEFORE USERNAME INJECTION:")
        for i, tool_call in enumerate(last_message.tool_calls):
            print(f"  Tool {i+1}: {tool_call.get('name', 'unknown')}")
            print(f"    Args: {tool_call.get('args', {})}")

        # Check if any of the tool calls are MCP tools
        mcp_tool_calls = []
        for tool_call in last_message.tool_calls:
            tool_name = tool_call.get("name", "")
            # Check if this is an MCP tool by checking if it's in our MCP tools list
            if any(tool_name == mcp_tool.name for mcp_tool in mcp_tools):
                mcp_tool_calls.append(tool_call)
                print(f"🎯 MCP tool detected: {tool_name}")

        # If MCP tools are being called, inject username into the tool call arguments
        if mcp_tool_calls:
            print(f"\n📝 Injecting username '{username}' into MCP tool calls")
            for tool_call in mcp_tool_calls:
                if "args" not in tool_call:
                    tool_call["args"] = {}
                tool_call["args"]["username"] = username
                print(f"✅ Username added to {tool_call.get('name')} tool call")

        # Print tool calls AFTER username injection
        print("\n📋 TOOL CALLS AFTER USERNAME INJECTION:")
        for i, tool_call in enumerate(last_message.tool_calls):
            print(f"  Tool {i+1}: {tool_call.get('name', 'unknown')}")
            print(f"    Args: {tool_call.get('args', {})}")
            if "username" in tool_call.get("args", {}):
                print(f"    🎯 Username: {tool_call['args']['username']}")

    # Use async invoke for MCP tools
    result = await tool_node.ainvoke(state)
    print(
        f"\n✅ Tool execution completed. Results: {len(result.get('messages', []))} messages"
    )
    return result


policy_llm = llm.bind_tools(TOOLS)

graph = StateGraph(AgentState)


async def agent_node(state: AgentState) -> dict:
    # Ensure system prompt is always included
    messages = state["messages"]
    if not any(
        isinstance(msg, type(system_prompt)) and msg.content == system_prompt.content
        for msg in messages
    ):
        messages = [system_prompt] + messages

    print(f"🤖 Agent processing: {messages[-1].content}")
    result = await policy_llm.ainvoke(messages)

    # Debug: Check if the agent wants to call tools
    if hasattr(result, "tool_calls") and result.tool_calls:
        print(
            f"🔧 Agent wants to call tools: {[tc.get('name', 'unknown') for tc in result.tool_calls]}"
        )
    else:
        print("💭 Agent responded without calling tools")

    return {"messages": [result]}


graph.add_node("agent", agent_node)
graph.add_node("tools", debug_tool_node)

graph.set_entry_point("agent")
graph.add_conditional_edges("agent", tools_condition)
graph.add_edge("tools", "agent")

from langgraph.checkpoint.memory import InMemorySaver

memory = InMemorySaver()
agent = graph.compile(checkpointer=memory)

if __name__ == "__main__":
    async def test_agent():
        print("=== Testing Tool ===")
        out1 = await agent.ainvoke(
            {
                "messages": [
                    system_prompt,
                    HumanMessage(content="what are latest projects you are working on?"),
                ]
            },
            config={"configurable": {"thread_id": "test-thread-1"}},
        )
        print("Result:", out1["messages"][-1].content)
    
    asyncio.run(test_agent())
