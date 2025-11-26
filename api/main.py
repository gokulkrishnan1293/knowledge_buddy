from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
from dotenv import load_dotenv
from database import get_db, engine, Base
from models import Agent, Topic, KnowledgeGap, ChatMessage, Conversation
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

# --- CONVERSATIONS ---

@app.post("/conversations")
def create_conversation(db: Session = Depends(get_db)):
    """
    Creates a new conversation thread.
    """
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    
    conversation = Conversation(
        id=str(uuid.uuid4()),
        title="New Conversation",
        created_at=now,
        updated_at=now
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

@app.get("/conversations")
def get_conversations(limit: int = 50, db: Session = Depends(get_db)):
    """
    Retrieves all conversation threads.
    """
    conversations = db.query(Conversation).order_by(
        Conversation.updated_at.desc()
    ).limit(limit).all()
    return conversations

@app.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db)):
    """
    Retrieves all messages for a specific conversation.
    """
    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(ChatMessage.timestamp).all()
    return messages

@app.patch("/conversations/{conversation_id}")
def update_conversation(conversation_id: str, title: str, db: Session = Depends(get_db)):
    """
    Updates a conversation's title.
    """
    from datetime import datetime
    
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.title = title
    conversation.updated_at = datetime.utcnow().isoformat()
    db.commit()
    return conversation

@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """
    Deletes a conversation and all its messages.
    """
    # Delete all messages in the conversation
    db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation_id).delete()
    
    # Delete the conversation
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conversation)
    db.commit()
    return {"status": "success", "message": "Conversation deleted"}

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
    # 1. Enrich the knowledge
    enriched_text = llm_service.enrich_knowledge(request.text)
    
    # 2. Generate Embedding (based on enriched version for better semantic search)
    embedding = llm_service.get_embedding(enriched_text)
    
    # 3. Store in Vector DB with both raw and enriched versions
    vector_store.add_document(agent_id, topic_id, enriched_text, embedding, raw_text=request.text)
    
    # 4. Update Doc Count
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if topic:
        topic.doc_count += 1
        db.commit()
    
    # 4. Auto-close related knowledge gaps
    # Find open gaps that might be related to this topic
    open_gaps = db.query(KnowledgeGap).filter(
        KnowledgeGap.agent_id == agent_id,
        KnowledgeGap.status == "open"
    ).all()
    
    # Close gaps if the topic name is similar to the gap question
    if topic:
        topic_lower = topic.name.lower()
        for gap in open_gaps:
            gap_lower = gap.question_text.lower()
            # Simple heuristic: if topic name appears in gap question, close it
            if topic_lower in gap_lower or any(word in gap_lower for word in topic_lower.split()):
                gap.status = "closed"
        db.commit()
        
    return {"status": "success", "message": "Knowledge added"}

@app.get("/agents/{agent_id}/topics/{topic_id}/summary")
def get_topic_summary(agent_id: str, topic_id: str, db: Session = Depends(get_db)):
    """
    Returns a summary of all knowledge for a specific topic.
    """
    # 1. Get all documents for this topic
    docs = vector_store.get_documents(agent_id, topic_id)
    
    if not docs or len(docs) == 0:
        return {"summary": "I don't know anything about this topic yet. Please teach me!"}
    
    # 2. Combine all documents
    combined_text = "\n\n".join(docs)
    
    # 3. Generate summary
    summary = llm_service.summarize_text(combined_text)
    
    return {"summary": summary}

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

@app.post("/agents/{agent_id}/gaps/resolve")
def resolve_gap(agent_id: str, request: KnowledgeRequest, db: Session = Depends(get_db)):
    """
    Resolves a knowledge gap by finding an existing topic or creating a new one.
    """
    gap_text = request.text
    
    # 1. Search Vector DB for similar context to find existing topic
    embedding = llm_service.get_embedding(gap_text)
    # We need a way to get the topic_id from the search result. 
    # The current vector_store.search returns text. We need metadata.
    # Let's assume for now we create a new topic if it's a gap, OR we rely on the user to pick.
    # But the requirement is "find closest match topic".
    # We need to update VectorStore.search to return metadata or use a new method.
    
    # For this iteration, let's try to find a topic by name similarity or just create a new one if it's distinct.
    # Actually, let's use the LLM to suggest a name, then check if that topic exists.
    
    suggested_name = llm_service.suggest_topic_name(gap_text)
    
    # Check if topic exists (case-insensitive partial match)
    # First try exact match (case-insensitive)
    existing_topic = db.query(Topic).filter(
        Topic.agent_id == agent_id, 
        Topic.name.ilike(suggested_name)
    ).first()
    
    # If no exact match, try partial match (e.g., "Rendering" matches "Rendering Overview")
    if not existing_topic:
        topics = db.query(Topic).filter(Topic.agent_id == agent_id).all()
        suggested_lower = suggested_name.lower()
        for topic in topics:
            topic_lower = topic.name.lower()
            # Check if either name contains the other
            if suggested_lower in topic_lower or topic_lower in suggested_lower:
                existing_topic = topic
                break
    
    if existing_topic:
        return {"topic_id": existing_topic.id, "topic_name": existing_topic.name, "action": "found"}
    
    # Create new topic
    new_topic = Topic(
        id=str(uuid.uuid4()),
        agent_id=agent_id,
        name=suggested_name
    )
    db.add(new_topic)
    db.commit()
    
    return {"topic_id": new_topic.id, "topic_name": new_topic.name, "action": "created"}

# --- KNOWLEDGE GAPS ---

@app.get("/agents/{agent_id}/gaps")
def get_knowledge_gaps(agent_id: str, db: Session = Depends(get_db)):
    return db.query(KnowledgeGap).filter(KnowledgeGap.agent_id == agent_id, KnowledgeGap.status == "open").all()

# --- CHAT HISTORY ---

@app.get("/agents/{agent_id}/chat/history")
def get_chat_history(agent_id: str, limit: int = 50, db: Session = Depends(get_db)):
    """
    Retrieves chat history for an agent.
    """
    messages = db.query(ChatMessage).filter(
        ChatMessage.agent_id == agent_id
    ).order_by(ChatMessage.timestamp.desc()).limit(limit).all()
    
    # Return in chronological order (oldest first)
    return list(reversed(messages))

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

Your knowledge base contains the following information. Your job is to synthesize this information and explain it clearly and naturally to the user. Don't just repeat the text - understand it, enrich it, and explain it in your own words as if you're teaching someone.

Knowledge Base:
{context_text}

Guidelines:
- Synthesize the information into a coherent, well-explained response
- Add helpful context, examples, or clarifications where appropriate
- Speak naturally as {agent.name}, not like you're reading from a document
- If the knowledge base doesn't contain the answer, say you don't know

User Question: {request.message}

Your Response:"""
    
    # 4. Generate Response
    response_text = llm_service.generate_response(full_prompt)
    
    # 5. Save messages to database
    from datetime import datetime
    
    user_msg = ChatMessage(
        id=str(uuid.uuid4()),
        conversation_id=request.conversation_id,
        agent_id=request.agent_id,
        role="user",
        content=request.message,
        timestamp=datetime.utcnow().isoformat()
    )
    
    agent_msg = ChatMessage(
        id=str(uuid.uuid4()),
        conversation_id=request.conversation_id,
        agent_id=request.agent_id,
        role="agent",
        content=response_text,
        timestamp=datetime.utcnow().isoformat()
    )
    
    db.add(user_msg)
    db.add(agent_msg)
    
    # Update conversation timestamp if provided
    if request.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if conversation:
            conversation.updated_at = datetime.utcnow().isoformat()
            
            # Auto-generate title from first user message if still "New Conversation"
            if conversation.title == "New Conversation":
                title = llm_service.generate_conversation_title(request.message)
                conversation.title = title
    
    db.commit()
    
    # 6. Detect Knowledge Gap
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
