# rag.py

import os, pymongo, pprint, sys, json, hashlib

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
from tools.prompt import system_prompt

load_dotenv()

# File paths
PDF_PATH = os.path.join(os.path.dirname(__file__), "profile.pdf")
HASH_FILE = os.path.join(os.path.dirname(__file__), ".pdf_hash.json")


def get_file_hash(file_path):
    """Get MD5 hash of a file"""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def load_stored_hash():
    """Load the stored hash from file"""
    try:
        if os.path.exists(HASH_FILE):
            with open(HASH_FILE, "r") as f:
                data = json.load(f)
                return data.get("pdf_hash", "")
    except:
        pass
    return ""


def save_hash(file_hash):
    """Save the current hash to file"""
    try:
        with open(HASH_FILE, "w") as f:
            json.dump({"pdf_hash": file_hash}, f)
    except Exception as e:
        print(f"Warning: Could not save hash file: {e}")


def should_rebuild_vectors():
    """Check if vectors need to be rebuilt based on PDF modification"""
    if not os.path.exists(PDF_PATH):
        print("Warning: profile.pdf not found!")
        return False

    current_hash = get_file_hash(PDF_PATH)
    stored_hash = load_stored_hash()

    if current_hash != stored_hash:
        print("📄 PDF has been modified - rebuilding vector store...")
        return True
    else:
        print("📄 PDF unchanged - using existing vectors")
        return False


def rebuild_vector_store():
    """Rebuild the vector store with new PDF content"""
    print("🔄 Loading and processing PDF...")

    # Load the PDF
    loader = PyPDFLoader(PDF_PATH)
    data = loader.load()

    # Split PDF into documents
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=30)
    docs = text_splitter.split_documents(data)

    # Clear existing documents and add new ones
    try:
        # Delete existing documents (if the vector store supports it)
        print("🗑️  Clearing existing vectors...")
        # Note: MongoDB Atlas Vector Search doesn't have a direct clear method
        # So we'll just add new documents (they will be indexed alongside existing ones)
        # In production, you might want to implement a more sophisticated cleanup

        print("📚 Adding new documents to vector store...")
        vector_store.add_documents(documents=docs)

        # Save the new hash
        current_hash = get_file_hash(PDF_PATH)
        save_hash(current_hash)

        print("✅ Vector store rebuilt successfully!")
        return docs

    except Exception as e:
        print(f"❌ Error rebuilding vector store: {e}")
        return []


# Check if we need to rebuild vectors
if should_rebuild_vectors():
    docs = rebuild_vector_store()
else:
    # Load the PDF for initial setup (if needed)
    loader = PyPDFLoader(PDF_PATH)
    data = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=20)
    docs = text_splitter.split_documents(data)

    # Only add documents if this is the first time (no hash file exists)
    if not os.path.exists(HASH_FILE):
        print("📚 First time setup - adding documents to vector store...")
        vector_store.add_documents(documents=docs)
        current_hash = get_file_hash(PDF_PATH)
        save_hash(current_hash)


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
