# rag.py

import os, pymongo, pprint, sys
# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from config import vector_store
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_voyageai import VoyageAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from .prompt import system_prompt

load_dotenv()

# Load the PDF
loader = PyPDFLoader(os.path.join(os.path.dirname(__file__), "profile.pdf"))
data = loader.load()
print(data)


# Split PDF into documents
text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=20)
docs = text_splitter.split_documents(data)
print(docs)

# Add documents to the vector store
vector_store.add_documents(documents=docs)


# 1) Instantiate MongoDB Vector Search as a retriever
retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 10})

# 2) LLM for the synthesis step
llm = init_chat_model("gpt-4o-mini")

# 3) Prompt that stuffs retrieved docs as {context}
RAG_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt.content + "\n\nContext:\n{context}"),
        ("human", "{input}"),
    ]
)


# 4) Build RAG chain = retriever -> stuff -> llm
doc_chain = create_stuff_documents_chain(llm, RAG_PROMPT)
print("doc chain", doc_chain)
rag_chain = create_retrieval_chain(retriever, doc_chain)
print("rag chain", rag_chain)


@tool("rag_tool", return_direct=False)
def rag_tool(query: str) -> str:
    """
    Answer questions using my Aayushmaan life's knowledge base (MongoDB + vectors).
    Returns an answer with short citations.
    """
    result = rag_chain.invoke({"input": query})
    answer = result.get("answer", "")
    return answer
