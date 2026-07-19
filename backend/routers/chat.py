"""
Chat Router — Real-time AI sales chat with streaming support.
"""
import uuid
import time
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional

from models.schemas import ChatRequest, ConversationCreate
from agents.sales_agent import get_sales_agent
from database.supabase_client import get_supabase
from ml.models import get_sentiment_analyzer, get_intent_classifier

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/message")
async def send_message(request: ChatRequest):
    """Send a message and get AI sales response."""
    db = get_supabase()
    sales_agent = get_sales_agent()
    
    # Create or retrieve conversation
    conversation_id = request.conversation_id
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        try:
            db.table("conversations").insert({
                "id": conversation_id,
                "lead_id": request.lead_id,
                "title": request.message[:50] + "..." if len(request.message) > 50 else request.message,
                "channel": "chat",
                "status": "active",
            }).execute()
        except Exception as e:
            logger.error(f"Failed to create conversation: {e}")

    start_time = time.time()
    
    try:
        # Get AI response
        result = await sales_agent.chat(
            message=request.message,
            conversation_id=conversation_id,
            lead_id=request.lead_id,
            stream=False,
            context=request.context
        )
        
        latency_ms = int((time.time() - start_time) * 1000)
        message_id = str(uuid.uuid4())
        
        # Store messages in Supabase
        try:
            db.table("messages").insert([
                {
                    "id": str(uuid.uuid4()),
                    "conversation_id": conversation_id,
                    "role": "user",
                    "content": request.message,
                    "sentiment": result.get("sentiment"),
                    "intent": result.get("intent"),
                    "detected_objection": result.get("detected_objection"),
                },
                {
                    "id": message_id,
                    "conversation_id": conversation_id,
                    "role": "assistant",
                    "content": result["response"],
                    "latency_ms": latency_ms,
                    "model_used": "llama-3.3-70b-versatile",
                }
            ]).execute()
            
            # Update conversation timestamp and sentiment
            db.table("conversations").update({
                "last_message_at": "now()",
                "overall_sentiment": result.get("sentiment"),
                "updated_at": "now()",
            }).eq("id", conversation_id).execute()
        except Exception as e:
            logger.error(f"Failed to store messages: {e}")
        
        return {
            "message": result["response"],
            "conversation_id": conversation_id,
            "message_id": message_id,
            "sentiment": result.get("sentiment"),
            "intent": result.get("intent"),
            "coaching_tip": result.get("coaching_tip"),
            "detected_objection": result.get("detected_objection"),
            "objection_strategy": result.get("objection_strategy"),
            "competitor_insight": result.get("competitor_insight"),
            "buying_score": result.get("buying_score", 0),
            "latency_ms": latency_ms,
        }
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stream/{conversation_id}")
async def stream_message(conversation_id: str, message: str, lead_id: Optional[str] = None):
    """Stream AI response via Server-Sent Events."""
    sales_agent = get_sales_agent()
    
    async def event_generator():
        try:
            async for chunk in sales_agent.stream_response_generator(
                message=message,
                conversation_id=conversation_id,
                lead_id=lead_id
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/conversations")
async def get_conversations(limit: int = 20, offset: int = 0):
    """Get all conversations."""
    db = get_supabase()
    try:
        result = db.table("conversations") \
            .select("*") \
            .order("updated_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        return {"conversations": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str):
    """Get all messages for a conversation."""
    db = get_supabase()
    try:
        result = db.table("messages") \
            .select("*") \
            .eq("conversation_id", conversation_id) \
            .order("created_at", desc=False) \
            .execute()
        return {"messages": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation and its messages."""
    db = get_supabase()
    try:
        db.table("messages").delete().eq("conversation_id", conversation_id).execute()
        db.table("conversations").delete().eq("id", conversation_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/{conversation_id}/complete")
async def complete_conversation(conversation_id: str):
    """Mark a conversation as complete and generate insights."""
    db = get_supabase()
    from agents.analytics_agent import get_analytics_agent
    analytics = get_analytics_agent()
    
    try:
        # Generate insights
        insights = await analytics.generate_conversation_insights(conversation_id)
        
        # Update conversation
        db.table("conversations").update({
            "status": "completed",
            "overall_sentiment": insights.get("overall_sentiment"),
            "buying_intent_score": insights.get("buying_intent_score", 0),
            "conversion_probability": insights.get("conversion_probability", 0),
            "summary": insights.get("summary"),
            "key_pain_points": insights.get("key_pain_points", []),
            "competitor_mentions": insights.get("competitor_mentions", []),
        }).eq("id", conversation_id).execute()
        
        return {"success": True, "insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
