from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Database & Models
from database import get_db, engine, Base
from models import Agent, Topic, KnowledgeGap, ChatMessage, Conversation

# Schemas
# Make sure FeedbackRequest is defined in your schemas.py file!
from schemas import (
    AgentCreate, 
    ChatRequest, 
    ChatResponse, 
    KnowledgeRequest, 
    AnalyzeRequest, 
    FinalizeRequest,
    FeedbackRequest 
)

# Services
from llm_service import GoogleLLMService
from vector_store import VectorStore

# Load environment variables
load_dotenv()

# Create Tables (Safe to run, checks if exists)
Base.metadata.create_all(bind=engine)

app = FastAPI()
llm_service = GoogleLLMService()
vector_store = VectorStore()

# CORS Setup
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
    
    # --- SUCCESS RATE CALCULATION ---
    # Calculate Success Rate based on Chat History (Excluding Playground/Training)
    rated_messages = db.query(ChatMessage).filter(
        ChatMessage.agent_id == agent_id,
        ChatMessage.role == "agent",
        ChatMessage.rating != 0,
        ChatMessage.conversation_id.isnot(None) 
    ).all()
    
    total = len(rated_messages)
    success_rate = 0
    
    if total > 0:
        positive = sum(1 for msg in rated_messages if msg.rating == 1)
        success_rate = int((positive / total) * 100)
    
    # Create response dictionary and inject stats
    agent_data = {
        "id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "color": agent.color,
        "status": agent.status,
        "success_rate": success_rate, # Computed field
        "total_ratings": total
    }
    return agent_data

@app.delete("/agents/{agent_id}")
def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Delete topics (and their vector entries)
    topics = db.query(Topic).filter(Topic.agent_id == agent_id).all()
    for topic in topics:
        vector_store.delete_documents(agent_id, topic.id)
        db.delete(topic)
        
    db.delete(agent)
    db.commit()
    return {"status": "success", "message": "Agent deleted"}

# --- CONVERSATIONS ---

@app.post("/conversations")
def create_conversation(db: Session = Depends(get_db)):
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
    conversations = db.query(Conversation).order_by(
        Conversation.updated_at.desc()
    ).limit(limit).all()
    return conversations

@app.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(ChatMessage.timestamp).all()
    return messages

@app.patch("/conversations/{conversation_id}")
def update_conversation(conversation_id: str, title: str, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.title = title
    conversation.updated_at = datetime.utcnow().isoformat()
    db.commit()
    return conversation

@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Explicitly delete messages first (fix for SQLite foreign key issues)
    db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation_id).delete()
    
    db.delete(conversation)
    db.commit()
    return {"status": "success", "message": "Conversation deleted"}

# --- CHAT & FEEDBACK ---

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        # 1. Get Embedding for User Message
        user_embedding = llm_service.get_embedding(request.message)
        
        # 2. Search Vector DB for Knowledge
        context_docs = vector_store.search(request.agent_id, user_embedding)
        context_text = "\n\n".join(context_docs) if context_docs else "No specific knowledge found."
        
        # 3. FETCH CHAT HISTORY (Context Awareness)
        history_text = ""
        if request.conversation_id:
            # Get last 10 messages, newest first
            recent_messages = db.query(ChatMessage).filter(
                ChatMessage.conversation_id == request.conversation_id
            ).order_by(desc(ChatMessage.timestamp)).limit(10).all()
            
            # Reverse to make them chronological (Old -> New)
            recent_messages.reverse()
            
            history_text = "\n".join([f"{msg.role.upper()}: {msg.content}" for msg in recent_messages])

        # 4. Construct Prompt (Summary First)
        system_prompt = f"You are {agent.name}. {agent.description}"
        
        full_prompt = f"""{system_prompt}

### INSTRUCTIONS:
1. **BE CONCISE.** Start with a high-level summary (2-3 sentences max).
2. Do NOT dump all the details immediately. 
3. Only provide deep technical details if the user specifically asks for "details", "more info", or "full explanation".
4. Use the provided Knowledge Base to answer.
5. Use the Conversation History to understand follow-up questions (e.g., if user says "Tell me more about that").

### KNOWLEDGE BASE (Reference Material):
{context_text}

### CONVERSATION HISTORY (Context):
{history_text}

### CURRENT USER MESSAGE:
USER: {request.message}

YOUR RESPONSE:"""
        
        # 5. Generate Response
        response_text = llm_service.generate_response(full_prompt)
        if not response_text:
             response_text = "I'm having trouble thinking right now. Please check my API key."

        # 6. Save messages to database
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
        
        # 7. Update conversation timestamp & Auto-Title
        if request.conversation_id:
            conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
            if conversation:
                conversation.updated_at = datetime.utcnow().isoformat()
                
                # Generate title if it's new
                if conversation.title == "New Conversation":
                    try:
                        title = llm_service.generate_conversation_title(request.message)
                        if title and len(title) < 50: 
                            conversation.title = title
                    except Exception as e:
                        print(f"Title generation failed: {e}")
        
        db.commit()
        
        # 8. Detect Knowledge Gap (Simple Heuristic)
        if "don't know" in response_text.lower() or "do not know" in response_text.lower():
            # Check for duplicates
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

    except Exception as e:
        print(f"Chat Endpoint Error: {str(e)}")
        # Raise 500 so frontend knows something went wrong
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/messages/{message_id}/feedback")
def submit_feedback(message_id: str, request: FeedbackRequest, db: Session = Depends(get_db)):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    msg.rating = request.rating
    db.commit()
    return {"status": "success", "rating": msg.rating}

# --- TOPICS & KNOWLEDGE ---

@app.get("/agents/{agent_id}/topics")
def get_topics(agent_id: str, db: Session = Depends(get_db)):
    return db.query(Topic).filter(Topic.agent_id == agent_id).all()

@app.post("/agents/{agent_id}/topics")
def create_topic(agent_id: str, name: str, db: Session = Depends(get_db)):
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
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.agent_id == agent_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    db.delete(topic)
    db.commit()
    vector_store.delete_documents(agent_id, topic_id)
    return {"status": "success", "message": "Topic deleted"}

@app.post("/agents/{agent_id}/topics/{topic_id}/knowledge")
def add_knowledge(agent_id: str, topic_id: str, request: KnowledgeRequest, db: Session = Depends(get_db)):
    enriched_text = llm_service.enrich_knowledge(request.text)
    embedding = llm_service.get_embedding(enriched_text)
    vector_store.add_document(agent_id, topic_id, enriched_text, embedding, raw_text=request.text)
    
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if topic:
        topic.doc_count += 1
        db.commit()
    
    # Auto-close related gaps
    open_gaps = db.query(KnowledgeGap).filter(
        KnowledgeGap.agent_id == agent_id,
        KnowledgeGap.status == "open"
    ).all()
    
    if topic:
        topic_lower = topic.name.lower()
        for gap in open_gaps:
            gap_lower = gap.question_text.lower()
            if topic_lower in gap_lower or any(word in gap_lower for word in topic_lower.split()):
                gap.status = "closed"
        db.commit()
        
    return {"status": "success", "message": "Knowledge added"}

@app.get("/agents/{agent_id}/topics/{topic_id}/summary")
def get_topic_summary(agent_id: str, topic_id: str, db: Session = Depends(get_db)):
    docs = vector_store.get_documents(agent_id, topic_id)
    if not docs or len(docs) == 0:
        return {"summary": "I don't know anything about this topic yet. Please teach me!"}
    
    combined_text = "\n\n".join(docs)
    summary = llm_service.summarize_text(combined_text)
    return {"summary": summary}

# --- APPRENTICE MODE ---

@app.post("/agents/{agent_id}/topics/{topic_id}/training/analyze")
def analyze_training_text(agent_id: str, topic_id: str, request: AnalyzeRequest):
    analysis = llm_service.analyze_text(request.text)
    return analysis

@app.post("/agents/{agent_id}/topics/{topic_id}/training/finalize")
def finalize_training(agent_id: str, topic_id: str, request: FinalizeRequest, db: Session = Depends(get_db)):
    crystallized_text = llm_service.crystallize_knowledge(request.original_text, request.qa_pairs)
    embedding = llm_service.get_embedding(crystallized_text)
    vector_store.add_document(agent_id, topic_id, crystallized_text, embedding)
    
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if topic:
        topic.doc_count += 1
        db.commit()
        
    return {"status": "success", "crystallized_text": crystallized_text}

# --- KNOWLEDGE GAPS ---

@app.get("/agents/{agent_id}/gaps")
def get_knowledge_gaps(agent_id: str, db: Session = Depends(get_db)):
    return db.query(KnowledgeGap).filter(KnowledgeGap.agent_id == agent_id, KnowledgeGap.status == "open").all()

@app.post("/agents/{agent_id}/gaps/resolve")
def resolve_gap(agent_id: str, request: KnowledgeRequest, db: Session = Depends(get_db)):
    gap_text = request.text
    suggested_name = llm_service.suggest_topic_name(gap_text)
    
    existing_topic = db.query(Topic).filter(
        Topic.agent_id == agent_id, 
        Topic.name.ilike(suggested_name)
    ).first()
    
    if existing_topic:
        return {"topic_id": existing_topic.id, "topic_name": existing_topic.name, "action": "found"}
    
    new_topic = Topic(
        id=str(uuid.uuid4()),
        agent_id=agent_id,
        name=suggested_name
    )
    db.add(new_topic)
    db.commit()
    
    return {"topic_id": new_topic.id, "topic_name": new_topic.name, "action": "created"}

# --- CHAT HISTORY (FOR TRAINING) ---

@app.get("/agents/{agent_id}/chat/history")
def get_chat_history(agent_id: str, limit: int = 50, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(
        ChatMessage.agent_id == agent_id
    ).order_by(ChatMessage.timestamp.desc()).limit(limit).all()
    return list(reversed(messages))