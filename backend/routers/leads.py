"""
Leads Router — CRUD operations, CSV upload, and AI lead scoring.
"""
import uuid
import io
import csv
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List

from models.schemas import LeadCreate, LeadUpdate, CSVUploadResult
from database.supabase_client import get_supabase
from ml.models import get_lead_scorer, get_sentiment_analyzer, get_intent_classifier

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/leads", tags=["Leads"])


@router.get("")
async def get_leads(
    limit: int = 50,
    offset: int = 0,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all leads with optional filters."""
    db = get_supabase()
    try:
        query = db.table("leads").select("*").order("score", desc=True)
        
        if category:
            query = query.eq("category", category)
        if status:
            query = query.eq("status", status)
        
        result = query.range(offset, offset + limit - 1).execute()
        leads = result.data or []
        
        # Client-side search filter
        if search:
            search_lower = search.lower()
            leads = [
                l for l in leads
                if search_lower in (l.get("name") or "").lower()
                or search_lower in (l.get("email") or "").lower()
                or search_lower in (l.get("company") or "").lower()
            ]
        
        return {"leads": leads, "total": len(leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lead_id}")
async def get_lead(lead_id: str):
    """Get a single lead by ID."""
    db = get_supabase()
    try:
        result = db.table("leads").select("*").eq("id", lead_id).limit(1).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Lead not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_lead(lead: LeadCreate):
    """Create a new lead and auto-score with AI."""
    db = get_supabase()
    scorer = get_lead_scorer()
    
    lead_id = str(uuid.uuid4())
    
    # Score the lead
    score_result = scorer.score_lead(lead.model_dump())
    
    lead_data = {
        "id": lead_id,
        **lead.model_dump(),
        **score_result,
        "key_factors": None,  # Remove key_factors from DB insert
    }
    lead_data.pop("key_factors", None)
    
    try:
        db.table("leads").insert(lead_data).execute()
        return {"id": lead_id, **lead_data, "key_factors": score_result.get("key_factors", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{lead_id}")
async def update_lead(lead_id: str, lead: LeadUpdate):
    """Update a lead."""
    db = get_supabase()
    try:
        update_data = {k: v for k, v in lead.model_dump().items() if v is not None}
        db.table("leads").update(update_data).eq("id", lead_id).execute()
        return {"success": True, "id": lead_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{lead_id}")
async def delete_lead(lead_id: str):
    """Delete a lead."""
    db = get_supabase()
    try:
        db.table("leads").delete().eq("id", lead_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{lead_id}/rescore")
async def rescore_lead(lead_id: str):
    """Re-score a lead with latest conversation data."""
    db = get_supabase()
    scorer = get_lead_scorer()
    sentiment_analyzer = get_sentiment_analyzer()
    
    try:
        # Get lead data
        lead_result = db.table("leads").select("*").eq("id", lead_id).execute()
        if not lead_result.data:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        lead = lead_result.data[0]
        
        # Get conversation data
        conv_result = db.table("conversations").select("*") \
            .eq("lead_id", lead_id).execute()
        conversations = conv_result.data or []
        
        # Get messages for sentiment analysis
        conv_data = {}
        if conversations:
            conv_id = conversations[0]["id"]
            msgs_result = db.table("messages").select("role, content") \
                .eq("conversation_id", conv_id).execute()
            messages = msgs_result.data or []
            
            if messages:
                sentiment_result = sentiment_analyzer.analyze_conversation(messages)
                conv_data = {
                    "sentiment_score": sentiment_result["score"],
                    "intent": lead.get("intent", ""),
                    "buying_signals": sentiment_result.get("buying_signals_count", 0),
                    "message_count": len(messages),
                    "objection_count": sentiment_result.get("objection_signals_count", 0)
                }
        
        score_result = scorer.score_lead(lead, conv_data)
        
        # Update in DB
        db.table("leads").update({
            "score": score_result["score"],
            "category": score_result["category"],
            "confidence": score_result["confidence"],
            "buying_probability": score_result["buying_probability"],
            "urgency_level": score_result["urgency_level"],
            "recommended_action": score_result["recommended_action"],
        }).eq("id", lead_id).execute()
        
        return {
            "lead_id": lead_id,
            **score_result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    """Upload a CSV file and bulk-create scored leads."""
    db = get_supabase()
    scorer = get_lead_scorer()
    
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    
    try:
        reader = csv.DictReader(io.StringIO(content.decode("utf-8", errors="ignore")))
        rows = list(reader)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")
    
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    
    # Normalize column names (case-insensitive mapping)
    FIELD_MAP = {
        "name": ["name", "full_name", "contact_name", "first_name"],
        "email": ["email", "email_address", "contact_email"],
        "phone": ["phone", "phone_number", "mobile", "contact_phone"],
        "company": ["company", "company_name", "organization", "employer"],
        "position": ["position", "title", "job_title", "role"],
        "industry": ["industry", "sector", "vertical"],
        "notes": ["notes", "comments", "description", "message"],
    }

    leads_created = []
    errors = []
    
    for i, row in enumerate(rows):
        try:
            # Normalize row keys
            normalized = {}
            row_lower = {k.lower().strip(): v for k, v in row.items()}
            
            for field, aliases in FIELD_MAP.items():
                for alias in aliases:
                    if alias in row_lower and row_lower[alias].strip():
                        normalized[field] = row_lower[alias].strip()
                        break
            
            if not normalized.get("name") and not normalized.get("email"):
                errors.append(f"Row {i+1}: Missing name and email")
                continue
            
            # Provide fallback name
            if not normalized.get("name"):
                normalized["name"] = normalized.get("email", "Unknown Lead").split("@")[0].title()
            
            normalized["source"] = "csv"
            normalized["raw_data"] = dict(row)
            
            lead_id = str(uuid.uuid4())
            score_result = scorer.score_lead(normalized)
            
            lead_data = {
                "id": lead_id,
                **normalized,
                "score": score_result["score"],
                "category": score_result["category"],
                "confidence": score_result["confidence"],
                "buying_probability": score_result["buying_probability"],
                "urgency_level": score_result["urgency_level"],
                "recommended_action": score_result["recommended_action"],
            }
            
            db.table("leads").insert(lead_data).execute()
            leads_created.append(lead_id)
        except Exception as e:
            errors.append(f"Row {i+1}: {str(e)}")
    
    return CSVUploadResult(
        total_rows=len(rows),
        processed=len(leads_created),
        failed=len(errors),
        leads_created=leads_created,
        errors=errors[:10]  # Return max 10 errors
    )


@router.get("/{lead_id}/conversations")
async def get_lead_conversations(lead_id: str):
    """Get all conversations for a lead."""
    db = get_supabase()
    try:
        result = db.table("conversations").select("*") \
            .eq("lead_id", lead_id) \
            .order("created_at", desc=True) \
            .execute()
        return {"conversations": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
