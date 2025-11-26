from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
from dotenv import load_dotenv
from database import get_db, engine, Base
from models import Agent, Topic, KnowledgeGap
from schemas import AgentCreate, ChatRequest, ChatResponse, KnowledgeRequest, AnalyzeRequest, FinalizeRequest
from llm_service import GoogleLLMService
from vector_store import VectorStore

# Load environment variables from .env file
load_dotenv()

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI()
llm_service = GoogleLLMService()
vector_store = VectorStore()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Knowledge Buddy API is running"}

# --- AGENTS ---

@app.get("/agents")
def get_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    return agents

@app.post("/agents")
def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    db_agent = Agent(
        id=str(uuid.uuid4()),
        name=agent.name,
        description=agent.description,
        personality=agent.personality,
        color=agent.color
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@app.get("/agents/{agent_id}")
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@app.delete("/agents/{agent_id}")
def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    # 1. Get Agent
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # 2. Get all topics to delete from Vector DB
    topics = db.query(Topic).filter(Topic.agent_id == agent_id).all()
    for topic in topics:
        vector_store.delete_documents(agent_id, topic.id)
        
    # 3. Delete Agent (Cascade should handle topics in SQL if configured, but let's be safe or rely on cascade)
    # Assuming standard SQL cascade might not be set up in models.py, let's delete topics manually first if needed.
    # But usually SQLAlchemy relationship cascade="all, delete" handles it. 
    # Let's check models.py later. For now, explicit delete is safer if unsure.
    for topic in topics:
        db.delete(topic)
        
    db.delete(agent)
    db.commit()
    
    return {"status": "success", "message": "Agent deleted"}

# --- TOPICS ---

@app.get("/agents/{agent_id}/topics")
def get_topics(agent_id: str, db: Session = Depends(get_db)):
    return db.query(Topic).filter(Topic.agent_id == agent_id).all()

@app.post("/agents/{agent_id}/topics")
def create_topic(agent_id: str, name: str, db: Session = Depends(get_db)):
    # Simple body for now, usually use Pydantic model
    db_topic = Topic(
        id=str(uuid.uuid4()),
        agent_id=agent_id,
        name=name
    )
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

@app.delete("/agents/{agent_id}/topics/{topic_id}")
def delete_topic(agent_id: str, topic_id: str, db: Session = Depends(get_db)):
    # 1. Delete from SQL
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.agent_id == agent_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    db.delete(topic)
    db.commit()
    
    # 2. Delete from Vector DB
    vector_store.delete_documents(agent_id, topic_id)
    
    return {"status": "success", "message": "Topic deleted"}

# --- KNOWLEDGE ---

@app.post("/agents/{agent_id}/topics/{topic_id}/knowledge")
def add_knowledge(agent_id: str, topic_id: str, request: KnowledgeRequest, db: Session = Depends(get_db)):
    # 1. Generate Embedding
    embedding = llm_service.get_embedding(request.text)
    
    # 2. Store in Vector DB
    vector_store.add_document(agent_id, topic_id, request.text, embedding)
    
    # 3. Update Doc Count
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if topic:
        topic.doc_count += 1
        db.commit()
        
    return {"status": "success", "message": "Knowledge added"}

@app.post("/agents/{agent_id}/topics/{topic_id}/training/analyze")
def analyze_training_text(agent_id: str, topic_id: str, request: AnalyzeRequest):
    # Analyze text and generate questions
    analysis = llm_service.analyze_text(request.text)
    return analysis

@app.post("/agents/{agent_id}/topics/{topic_id}/training/finalize")
def finalize_training(agent_id: str, topic_id: str, request: FinalizeRequest, db: Session = Depends(get_db)):
    # 1. Crystallize Knowledge
    crystallized_text = llm_service.crystallize_knowledge(request.original_text, request.qa_pairs)
    
    # 2. Generate Embedding for Crystallized Text
    embedding = llm_service.get_embedding(crystallized_text)
    
    # 3. Store in Vector DB
    vector_store.add_document(agent_id, topic_id, crystallized_text, embedding)
    
    # 4. Update Doc Count
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if topic:
        topic.doc_count += 1
        db.commit()
        
    return {"status": "success", "crystallized_text": crystallized_text}

# --- KNOWLEDGE GAPS ---

@app.get("/agents/{agent_id}/gaps")
def get_knowledge_gaps(agent_id: str, db: Session = Depends(get_db)):
    return db.query(KnowledgeGap).filter(KnowledgeGap.agent_id == agent_id, KnowledgeGap.status == "open").all()

# --- CHAT ---

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # 1. Get Embedding for User Message
    user_embedding = llm_service.get_embedding(request.message)
    
    # 2. Search Vector DB for Context
    context_docs = vector_store.search(request.agent_id, user_embedding)
    context_text = "\n\n".join(context_docs) if context_docs else "No specific knowledge found."
    
    # 3. Construct Prompt with Context
    system_prompt = f"You are {agent.name}. {agent.description}. {agent.personality}"
    full_prompt = f"""{system_prompt}

Use the following context to answer the user's question. If the answer is not in the context, say you don't know.

Context:
{context_text}

User: {request.message}
Agent:"""
    
    # 4. Generate Response
    response_text = llm_service.generate_response(full_prompt)
    
    # 5. Detect Knowledge Gap
    # Simple heuristic: if response contains "I don't know" or "I do not know" (case insensitive)
    if "don't know" in response_text.lower() or "do not know" in response_text.lower():
        # Check if similar gap exists (exact match for now for simplicity)
        existing_gap = db.query(KnowledgeGap).filter(
            KnowledgeGap.agent_id == request.agent_id,
            KnowledgeGap.question_text == request.message,
            KnowledgeGap.status == "open"
        ).first()
        
        if existing_gap:
            existing_gap.frequency += 1
        else:
            new_gap = KnowledgeGap(
                id=str(uuid.uuid4()),
                agent_id=request.agent_id,
                question_text=request.message,
                frequency=1
            )
            db.add(new_gap)
        db.commit()
    
    return ChatResponse(response=response_text, source="ai")
