"""
Follow-up Router — Generate and send personalized follow-up messages.
"""
import uuid
import logging
from fastapi import APIRouter, HTTPException
from typing import Optional, List

from models.schemas import FollowupRequest, FollowupSendRequest
from agents.followup_agent import get_followup_agent
from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/followup", tags=["Follow-ups"])


@router.post("/generate")
async def generate_followup(request: FollowupRequest):
    """Generate a personalized follow-up message."""
    db = get_supabase()
    agent = get_followup_agent()
    
    # Get lead data
    lead_data = {}
    if request.lead_id:
        try:
            result = db.table("leads").select("*").eq("id", request.lead_id).execute()
            if result.data:
                lead_data = result.data[0]
        except Exception as e:
            logger.error(f"Failed to fetch lead: {e}")
    
    # Get conversation context
    conversation_context = ""
    if request.conversation_id:
        try:
            msgs = db.table("messages").select("role, content") \
                .eq("conversation_id", request.conversation_id) \
                .order("created_at") \
                .execute()
            if msgs.data:
                conversation_context = "\n".join([
                    f"{'Customer' if m['role'] == 'user' else 'AI'}: {m['content']}"
                    for m in msgs.data[-20:]
                ])
        except Exception as e:
            logger.error(f"Failed to fetch messages: {e}")
    
    # Generate
    result = await agent.generate(
        followup_type=request.followup_type,
        lead_data=lead_data,
        conversation_context=conversation_context,
        tone=request.tone,
        additional_context=request.additional_context or ""
    )
    
    # Save to DB
    followup_id = str(uuid.uuid4())
    try:
        db.table("followups").insert({
            "id": followup_id,
            "lead_id": request.lead_id,
            "conversation_id": request.conversation_id,
            "type": request.followup_type,
            "subject": result.get("subject"),
            "content": result["content"],
            "status": "draft",
            "recipient_email": request.recipient_email or lead_data.get("email"),
            "tone": request.tone,
        }).execute()
    except Exception as e:
        logger.error(f"Failed to save followup: {e}")
    
    return {
        "followup_id": followup_id,
        "type": request.followup_type,
        "subject": result.get("subject"),
        "content": result["content"],
        "status": "draft"
    }


@router.post("/send/{followup_id}")
async def send_followup(followup_id: str, recipient_email: Optional[str] = None):
    """Send a generated follow-up email via Resend."""
    db = get_supabase()
    agent = get_followup_agent()
    
    # Get followup
    result = db.table("followups").select("*").eq("id", followup_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    followup = result.data[0]
    
    if followup["type"] not in ["email", "meeting_summary"]:
        raise HTTPException(status_code=400, detail="Only email follow-ups can be sent automatically")
    
    email = recipient_email or followup.get("recipient_email")
    if not email:
        raise HTTPException(status_code=400, detail="No recipient email provided")
    
    # Send
    send_result = await agent.send_email(
        recipient_email=email,
        subject=followup.get("subject") or "Follow-up from SalesMind AI",
        content=followup["content"],
        lead_name=""
    )
    
    # Update status
    db.table("followups").update({
        "status": "sent" if send_result["success"] else "failed",
        "sent_at": "now()" if send_result["success"] else None,
        "resend_message_id": send_result.get("message_id"),
        "recipient_email": email
    }).eq("id", followup_id).execute()
    
    return {
        "followup_id": followup_id,
        "success": send_result["success"],
        "message_id": send_result.get("message_id"),
        "status": "sent" if send_result["success"] else "failed",
        "error": send_result.get("error")
    }


@router.get("")
async def get_followups(
    lead_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20
):
    """List all follow-ups."""
    db = get_supabase()
    try:
        query = db.table("followups").select("*").order("created_at", desc=True)
        if lead_id:
            query = query.eq("lead_id", lead_id)
        if status:
            query = query.eq("status", status)
        result = query.limit(limit).execute()
        return {"followups": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{followup_id}")
async def delete_followup(followup_id: str):
    """Delete a follow-up."""
    db = get_supabase()
    try:
        db.table("followups").delete().eq("id", followup_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
