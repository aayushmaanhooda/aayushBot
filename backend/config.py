from pymongo import MongoClient
from langchain_voyageai import VoyageAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from dotenv import load_dotenv
import os

load_dotenv()

URI = os.environ["URI"]
db_name = os.getenv("DB_NAME")
collections = os.getenv("MONGODB_COLLECTION")
vector_index = os.getenv("ATLAS_VECTOR_SEARCH_INDEX_NAME")

# Create a new client and connect to the server
client = MongoClient(URI)

# Send a ping to confirm a successful connection
try:
    client.admin.command("ping")
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)


vector_store = MongoDBAtlasVectorSearch.from_connection_string(
    connection_string=URI,
    namespace=f"{db_name}.{collections}",  # database.collection
    embedding=VoyageAIEmbeddings(model="voyage-3-large"),
    index_name=vector_index,
)
