import chromadb
from chromadb.config import Settings
import uuid

class VectorStore:
    def __init__(self):
        # Persistent storage in ./chroma_db
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.client.get_or_create_collection(name="knowledge_base")

    def add_document(self, agent_id: str, topic_id: str, text: str, embedding: list, raw_text: str = None):
        """
        Adds a document to the vector store with both raw and enriched versions.
        """
        doc_id = str(uuid.uuid4())
        self.collection.add(
            documents=[text],  # Store enriched version as main document
            embeddings=[embedding],
            metadatas=[{
                "agent_id": agent_id, 
                "topic_id": topic_id,
                "raw_text": raw_text or text  # Store raw version in metadata
            }],
            ids=[doc_id]
        )
        return doc_id

    def search(self, agent_id: str, query_embedding: list, n_results: int = 3):
        """
        Searches for relevant documents for a given agent.
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where={"agent_id": agent_id}
        )
        
        # Extract documents
        if results["documents"]:
            return results["documents"][0]
        return []

    def delete_documents(self, agent_id: str, topic_id: str):
        """
        Deletes all documents associated with a specific topic.
        """
        self.collection.delete(
            where={"$and": [{"agent_id": agent_id}, {"topic_id": topic_id}]}
        )

    def get_documents(self, agent_id: str, topic_id: str):
        """
        Retrieves all documents for a specific topic.
        """
        results = self.collection.get(
            where={"$and": [{"agent_id": agent_id}, {"topic_id": topic_id}]}
        )
        
        if results["documents"]:
            return results["documents"]
        return []
