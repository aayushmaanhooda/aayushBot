# AayushBot 2.0 🤖

A personal AI assistant built for Aayushmaan Hooda using modern AI technologies. This chatbot can answer questions about Aayushmaan's background, search the web for current information, and provide a conversational interface with personality.

## 🚀 Features

- **Personal Knowledge Base**: RAG-powered system that can answer questions about Aayushmaan's background, education, work experience, and projects
- **Web Search Integration**: Real-time web search capabilities for current events, news, and up-to-date information
- **Conversational Memory**: Session-based conversation history using LangGraph checkpointing (under development phase)
- **Modern UI**: Clean, responsive React frontend with Tailwind CSS
- **RESTful API**: FastAPI backend with CORS support for cross-origin requests

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangGraph** - AI agent orchestration and workflow management
- **LangChain** - LLM integration and tooling
- **OpenAI GPT-4** - Large language model
- **MongoDB** - Vector database for RAG functionality
- **Tavily API** - Web search capabilities

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript/JSX** - Frontend logic and components

## 📁 Project Structure

```
aayushbot2.0/
├── backend/                 # FastAPI backend
│   ├── app.py              # Main FastAPI application
│   ├── graph.py            # LangGraph agent configuration
│   ├── config.py           # Configuration settings
│   ├── requirements.txt    # Python dependencies
│   └── tools/              # AI agent tools
│       ├── rag.py          # RAG tool for personal knowledge
│       ├── web.py          # Web search tool
│       ├── prompt.py       # System prompt configuration
│       └── profile.pdf     # Knowledge base document
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── api/            # API integration
│   │   └── ...
│   ├── package.json        # Node.js dependencies
│   └── ...
└── bot_env/                # Python virtual environment
```

## 🔧 API Endpoints

### POST `/chat`
Send a message to the AI assistant.

**Request:**
```json
{
  "message": "What's your nickname?",
  "session_id": "optional-session-id"
}
```

**Response:**
```json
{
  "answer": "My friends call me Aayush!",
  "session_id": "session-uuid"
}
```

### GET `/healthz`
Health check endpoint.

## 🤖 AI Agent Capabilities

The bot uses a LangGraph-powered agent with two main tools:
1. **RAG Tool** (`rag_tool`): Answers questions about Aayushmaan's personal information from the knowledge base
2. **Web Search Tool** (`web_search_tool`): Searches the web for current information, news, and real-time data


## 🚀 Deployment

The application is configured for deployment with:
- Backend: Suitable for platforms like Railway, Render, or Heroku
- Frontend: Deployable to Vercel, Netlify, or similar platforms
- CORS configured for `https://aayush-bot-tf6k.vercel.app`

## 📝 License

This is a personal project for Aayushmaan Hooda.

## 🤝 Contributing

This is a personal assistant project. For questions or suggestions, please contact Aayushmaan directly.

---

*Built with ❤️ by Aayushmaan Hooda*
