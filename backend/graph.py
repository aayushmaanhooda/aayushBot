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
from langgraph.types import Command, interrupt
from langchain_core.messages import HumanMessage
from tools.web import web_search_tool
from tools.rag import rag_tool
from tools.prompt import system_prompt
from langchain_core.tools import tool


load_dotenv()


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


TOOLS = [web_search_tool, rag_tool, now_tool]
tool_node = ToolNode(TOOLS)


def debug_tool_node(state: AgentState) -> dict:
    """Debug wrapper around tool execution"""
    print("🔧 Executing tools...")
    result = tool_node.invoke(state)
    print(
        f"✅ Tool execution completed. Results: {len(result.get('messages', []))} messages"
    )
    return result


policy_llm = llm.bind_tools(TOOLS)

graph = StateGraph(AgentState)


def agent_node(state: AgentState) -> dict:
    # Ensure system prompt is always included
    messages = state["messages"]
    if not any(
        isinstance(msg, type(system_prompt)) and msg.content == system_prompt.content
        for msg in messages
    ):
        messages = [system_prompt] + messages

    print(f"🤖 Agent processing: {messages[-1].content}")
    result = policy_llm.invoke(messages)

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


if __name__ == "__main__":
    print("=== Testing RAG Tool ===")
    out1 = agent.invoke(
        {
            "messages": [
                system_prompt,
                HumanMessage(content="what is your nickname?"),
            ]
        },
        config={"configurable": {"thread_id": "test-thread-1"}},
    )
    print("RAG Result:", out1["messages"][-1].content)

    print("\n=== Testing Web Search Tool ===")
    out2 = agent.invoke(
        {
            "messages": [
                system_prompt,
                HumanMessage(content="what are his skills?"),
            ]
        },
        config={"configurable": {"thread_id": "test-thread-2"}},
    )
    print("Web Search Result:", out2["messages"][-1].content)
