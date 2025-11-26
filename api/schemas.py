from pydantic import BaseModel
from typing import Optional, List

class AgentBase(BaseModel):
    name: str
    description: str
    personality: Optional[str] = None
    color: Optional[str] = "bg-blue-500"

class AgentCreate(AgentBase):
    pass

class Agent(AgentBase):
    id: str
    status: str

    class Config:
        orm_mode = True

class ChatRequest(BaseModel):
    agent_id: str
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    source: str

class KnowledgeRequest(BaseModel):
    text: str

class AnalyzeRequest(BaseModel):
    text: str

class FinalizeRequest(BaseModel):
    original_text: str
    qa_pairs: List[dict] # [{"q": "...", "a": "..."}]
