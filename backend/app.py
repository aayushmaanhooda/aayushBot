# FAST API ENDPOINT SERVING OUTPUT

import os
from fastapi import FastAPI
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app_name = os.getenv("APP_NAME")
app = FastAPI(title="Aayushmaan Personal Agent")

origins = [
    "https://your-frontend.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
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


class ChatResponse(BaseModel):
    answer: str


@app.get("/healthz", tags=["meta"])
async def healthz():
    return {"status": "Server is running", "service": app_name}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    return ChatResponse(
        answer=f"Backend received your message: '{request.message}' - API is working!"
    )


# local run: uvicorn api:app --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="localhost", port=8000)
