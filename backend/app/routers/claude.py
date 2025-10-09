"""
Claude API Proxy Router
Proxies Anthropic API calls from frontend to avoid exposing API key in browser
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import sys
from anthropic import Anthropic

# Set UTF-8 encoding for console output on Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

router = APIRouter(prefix="/claude", tags=["claude"])

# Initialize Anthropic client with backend API key
anthropic_client = None
api_key = os.getenv("ANTHROPIC_API_KEY")
if api_key:
    anthropic_client = Anthropic(api_key=api_key)
    print(f"[Claude] Initialized with API key: {api_key[:10]}...")
else:
    print("[Claude] WARNING: ANTHROPIC_API_KEY not found in environment")


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    system: Optional[str] = None  # Frontend sends string, we'll convert to list if needed
    max_tokens: int = 2000
    model: str = "claude-sonnet-4-5-20250929"


class ChatResponse(BaseModel):
    content: str
    model: str
    role: str = "assistant"


@router.post("/chat", response_model=ChatResponse)
async def claude_chat(request: ChatRequest):
    """
    Proxy Claude API chat requests from frontend

    This prevents exposing the Anthropic API key in the browser
    """
    if not anthropic_client:
        raise HTTPException(
            status_code=503,
            detail="Claude API not configured. Set ANTHROPIC_API_KEY in backend .env"
        )

    try:
        # Convert Pydantic models to dicts for Anthropic SDK
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        # Call Anthropic API
        # Build kwargs to avoid passing None for system
        kwargs = {
            "model": request.model,
            "max_tokens": request.max_tokens,
            "messages": messages
        }
        # System prompt should be a list of content blocks in newer API versions
        if request.system:
            if isinstance(request.system, str):
                kwargs["system"] = [{"type": "text", "text": request.system}]
            else:
                kwargs["system"] = request.system

        response = anthropic_client.messages.create(**kwargs)

        # Extract text content
        content = ""
        if response.content and len(response.content) > 0:
            if response.content[0].type == "text":
                content = response.content[0].text

        return ChatResponse(
            content=content,
            model=response.model,
            role="assistant"
        )

    except Exception as e:
        # Safe error logging for Windows console
        try:
            print(f"[Claude API Error]: {str(e)}")
        except UnicodeEncodeError:
            error_msg = str(e).encode('ascii', 'ignore').decode('ascii')
            print(f"[Claude API Error]: {error_msg}")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/health")
async def claude_health():
    """Check if Claude API is configured and accessible"""
    if not anthropic_client:
        return {
            "status": "unavailable",
            "message": "ANTHROPIC_API_KEY not configured"
        }

    return {
        "status": "ok",
        "message": "Claude API ready",
        "model": "claude-sonnet-4-5-20250929"
    }
