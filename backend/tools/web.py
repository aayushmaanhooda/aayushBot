from langchain_tavily import TavilySearch
from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

web_search = TavilySearch(max_results=2)

@tool("web_search_tool", return_direct=False)
def web_search_tool(query: str) -> str:
    """
    Use this tool to search the web when the user asks about current events,
    news, or things not in the local knowledge.
    Input: query (str) - the search term.
    Output: short text with titles and urls of results.
    """
    res = web_search.invoke({"query": query})
    return res["results"]
    