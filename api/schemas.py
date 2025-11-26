from pydantic import BaseModel
from typing import Optional, List, Dict, Any

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
    context_text: Optional[str] = None

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

class FeedbackRequest(BaseModel):
    rating: int # 1 or -1

class SkillCreate(BaseModel):
    name: str
    description: str
    code: str
    parameters: Dict[str, Any]

class SkillUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class SkillResponse(SkillCreate):
    id: str
    agent_id: str