# FAST API ENDPOINT SERVING OUTPUT

import os
import sys
from pathlib import Path
from fastapi import FastAPI
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uuid

# Add the current directory to Python path for imports
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from graph import agent

load_dotenv()

app_name = os.getenv("APP_NAME")
app = FastAPI(title="Aayushmaan Personal Agent")

origins = [
    "https://aayush-bot-tf6k.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "*",  # Allow all origins for testing - remove in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    session_id: str = None 


class ChatResponse(BaseModel):
    answer: str
    session_id: str


@app.get("/healthz", tags=["meta"])
async def healthz():
    return {"status": "Server is running", "service": app_name}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        # Generate or use existing session ID
        session_id = request.session_id or str(uuid.uuid4())

        # Create config with session-specific thread ID
        config = {"configurable": {"thread_id": session_id}}

        # Create a human message from the request
        human_message = HumanMessage(content=request.message)

        # Invoke the agent with the message and session config
        # The checkpointer will automatically merge this with existing conversation history
        result = agent.invoke({"messages": [human_message]}, config=config)

        # Extract the last message content as the response
        response_content = result["messages"][-1].content

        return ChatResponse(answer=response_content, session_id=session_id)
    except Exception as e:
        session_id = request.session_id or str(uuid.uuid4())
        return ChatResponse(
            answer=f"Sorry, I encountered an error: {str(e)}", session_id=session_id
        )


# local run: uvicorn api:app --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="localhost", port=8000)
