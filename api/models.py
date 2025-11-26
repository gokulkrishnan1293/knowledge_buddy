from sqlalchemy import Column, Integer, String, Text, ForeignKey
from database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    status = Column(String, default="active") # active, training, idle
    color = Column(String, default="bg-blue-500")
    personality = Column(Text, nullable=True)

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
