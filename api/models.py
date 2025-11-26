from sqlalchemy import Column, Integer, String, Text, ForeignKey
from database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    status = Column(String, default="active") # active, training, idle
    color = Column(String, default="bg-blue-500")

class KnowledgeGap(Base):
    __tablename__ = "knowledge_gaps"

    id = Column(String, primary_key=True, index=True)
    agent_id = Column(String, ForeignKey("agents.id"))
    question_text = Column(String)
    frequency = Column(Integer, default=1)
    status = Column(String, default="open")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String, primary_key=True, index=True)
    agent_id = Column(String, ForeignKey("agents.id"))
    name = Column(String)
    doc_count = Column(Integer, default=0)
    status = Column(String, default="active")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, default="New Conversation")
    created_at = Column(String)  # ISO format timestamp
    updated_at = Column(String)  # ISO format timestamp

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=True)
    agent_id = Column(String, ForeignKey("agents.id"))
    role = Column(String)
    content = Column(Text)
    timestamp = Column(String)
    rating = Column(Integer, default=0)

class AgentSkill(Base):
    __tablename__ = "agent_skills"

    id = Column(String, primary_key=True, index=True)
    agent_id = Column(String, ForeignKey("agents.id"))
    name = Column(String, index=True)
    description = Column(Text)
    code = Column(Text)
    parameters = Column(Text) # Storing JSON as text for simplicity in SQLite
