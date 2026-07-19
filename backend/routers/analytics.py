"""
Analytics Router — Dashboard metrics and AI-powered business intelligence.
"""
import logging
from fastapi import APIRouter, HTTPException
from typing import Optional

from agents.analytics_agent import get_analytics_agent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard():
    """Get all dashboard metrics."""
    agent = get_analytics_agent()
    try:
        metrics = await agent.get_dashboard_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/{conversation_id}")
async def get_conversation_insights(conversation_id: str):
    """Get AI insights for a specific conversation."""
    agent = get_analytics_agent()
    try:
        insights = await agent.generate_conversation_insights(conversation_id)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/funnel")
async def get_sales_funnel():
    """Get sales funnel data."""
    from database.supabase_client import get_supabase
    db = get_supabase()
    
    try:
        result = db.table("leads").select("status").execute()
        leads = result.data or []
        
        status_order = ["new", "contacted", "qualified", "negotiating", "won"]
        status_counts = {}
        for lead in leads:
            s = lead.get("status", "new")
            status_counts[s] = status_counts.get(s, 0) + 1
        
        total = len(leads)
        funnel = []
        running_count = total
        
        for status in status_order:
            count = status_counts.get(status, 0)
            funnel.append({
                "stage": status.title(),
                "count": count,
                "percentage": round(count / max(total, 1) * 100, 1),
                "color": {
                    "new": "#6c63ff",
                    "contacted": "#4ecdc4",
                    "qualified": "#f7b731",
                    "negotiating": "#fd9644",
                    "won": "#26de81"
                }.get(status, "#gray")
            })
        
        return {"funnel": funnel, "total_leads": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sentiment-trends")
async def get_sentiment_trends():
    """Get sentiment trends over time."""
    from database.supabase_client import get_supabase
    from datetime import datetime, timedelta
    db = get_supabase()
    
    try:
        # Get messages from last 30 days
        result = db.table("messages") \
            .select("sentiment, created_at") \
            .eq("role", "user") \
            .not_.is_("sentiment", "null") \
            .execute()
        
        messages = result.data or []
        
        # Group by day
        daily_sentiment = {}
        for msg in messages:
            try:
                date = msg["created_at"][:10]
                if date not in daily_sentiment:
                    daily_sentiment[date] = {"positive": 0, "negative": 0, "neutral": 0}
                sentiment = msg.get("sentiment", "neutral")
                if sentiment in daily_sentiment[date]:
                    daily_sentiment[date][sentiment] += 1
            except:
                pass
        
        trends = [
            {"date": date, **counts}
            for date, counts in sorted(daily_sentiment.items())[-14:]
        ]
        
        return {"trends": trends}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
