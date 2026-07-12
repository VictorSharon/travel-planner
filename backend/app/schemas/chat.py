from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    destination: Optional[str] = None
    context: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str