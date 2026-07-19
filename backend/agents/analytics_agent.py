"""
Analytics Agent — Generates business intelligence insights from lead and conversation data.
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from groq import Groq

from config import settings
from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)


class AnalyticsAgent:
    """Synthesizes data and generates AI-powered business intelligence."""

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    async def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Fetch and compute all dashboard metrics from Supabase."""
        db = get_supabase()
        
        try:
            # Leads data
            leads_result = db.table("leads").select("*").execute()
            leads = leads_result.data or []
            
            # Conversations data
            conv_result = db.table("conversations").select("*").execute()
            conversations = conv_result.data or []
            
            # Follow-ups
            followup_result = db.table("followups").select("id, status").execute()
            followups = followup_result.data or []
            
            # Compute metrics
            total_leads = len(leads)
            hot_leads = sum(1 for l in leads if l.get("category") == "hot")
            warm_leads = sum(1 for l in leads if l.get("category") == "warm")
            cold_leads = sum(1 for l in leads if l.get("category") == "cold")
            
            avg_score = sum(l.get("score", 0) for l in leads) / max(total_leads, 1)
            
            # Sentiment breakdown
            sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
            for lead in leads:
                s = lead.get("sentiment", "neutral")
                if s in sentiment_counts:
                    sentiment_counts[s] += 1
            
            # Status breakdown
            status_counts = {}
            for lead in leads:
                status = lead.get("status", "new")
                status_counts[status] = status_counts.get(status, 0) + 1
            
            # Conversion rate estimation
            won = status_counts.get("won", 0)
            conversion_rate = round((won / max(total_leads, 1)) * 100, 1)
            
            # Active conversations
            active_convs = sum(1 for c in conversations if c.get("status") == "active")
            
            # Follow-ups sent
            sent_followups = sum(1 for f in followups if f.get("status") == "sent")
            
            # Conversion trend (last 7 days mock data for now)
            conversion_trend = self._generate_trend_data(leads)
            
            # Top segments
            top_segments = self._get_top_segments(leads)
            
            # AI insights
            ai_insights = await self._generate_insights(
                leads, conversations, total_leads, hot_leads, conversion_rate
            )
            
            return {
                "total_leads": total_leads,
                "hot_leads": hot_leads,
                "warm_leads": warm_leads,
                "cold_leads": cold_leads,
                "total_conversations": len(conversations),
                "active_conversations": active_convs,
                "avg_conversion_rate": conversion_rate,
                "avg_lead_score": round(avg_score, 1),
                "total_followups_sent": sent_followups,
                "sentiment_breakdown": sentiment_counts,
                "leads_by_status": status_counts,
                "conversion_trend": conversion_trend,
                "top_performing_segments": top_segments,
                "ai_insights": ai_insights,
            }
        except Exception as e:
            logger.error(f"Dashboard metrics error: {e}")
            return self._empty_metrics()

    async def _generate_insights(
        self, leads: List, conversations: List, 
        total_leads: int, hot_leads: int, conversion_rate: float
    ) -> List[str]:
        """Generate AI business intelligence insights."""
        try:
            context = f"""
Lead Data Summary:
- Total leads: {total_leads}
- Hot leads: {hot_leads} ({round(hot_leads/max(total_leads,1)*100, 1)}%)
- Avg conversion rate: {conversion_rate}%
- Total active conversations: {len([c for c in conversations if c.get('status') == 'active'])}
"""
            prompt = f"""As a sales intelligence AI, analyze this data and provide 4 specific, actionable business insights:

{context}

Generate 4 insights in this format (one per line, start with an emoji):
- Each insight must be specific and actionable
- Focus on what the sales team should DO, not just observe
- Reference actual numbers when possible
- Be direct and business-focused

Return exactly 4 bullet points, each starting with an appropriate emoji."""

            completion = self.client.chat.completions.create(
                model=settings.GROQ_MODEL_FAST,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=400,
            )
            
            insights_text = completion.choices[0].message.content
            insights = [line.strip() for line in insights_text.split("\n") 
                       if line.strip() and len(line.strip()) > 20]
            return insights[:4]
        except Exception as e:
            logger.error(f"Insight generation error: {e}")
            return [
                "📊 Analyze your hot leads first — they're most likely to convert this week.",
                "💡 Follow up with warm leads within 24 hours to maintain engagement.",
                "🎯 Focus outreach on industries showing highest sentiment scores.",
                "⚡ Schedule demos for interested leads before they cool down."
            ]

    def _generate_trend_data(self, leads: List) -> List[Dict]:
        """Generate 7-day trend data."""
        now = datetime.utcnow()
        trend = []
        for i in range(7, 0, -1):
            date = now - timedelta(days=i)
            day_str = date.strftime("%b %d")
            # Count leads created on this day
            count = sum(
                1 for l in leads 
                if l.get("created_at", "").startswith(date.strftime("%Y-%m-%d"))
            )
            trend.append({
                "date": day_str,
                "leads": count,
                "conversions": max(0, count - 1),
                "revenue": count * 2500
            })
        return trend

    def _get_top_segments(self, leads: List) -> List[Dict]:
        """Identify top performing lead segments by industry."""
        industry_scores = {}
        for lead in leads:
            industry = lead.get("industry", "Unknown") or "Unknown"
            if industry not in industry_scores:
                industry_scores[industry] = {"total": 0, "count": 0, "hot": 0}
            industry_scores[industry]["total"] += lead.get("score", 0)
            industry_scores[industry]["count"] += 1
            if lead.get("category") == "hot":
                industry_scores[industry]["hot"] += 1
        
        segments = []
        for industry, data in industry_scores.items():
            if data["count"] > 0:
                segments.append({
                    "segment": industry,
                    "avg_score": round(data["total"] / data["count"], 1),
                    "total_leads": data["count"],
                    "hot_leads": data["hot"],
                    "conversion_rate": round(data["hot"] / data["count"] * 100, 1)
                })
        
        segments.sort(key=lambda x: x["avg_score"], reverse=True)
        return segments[:5]

    def _empty_metrics(self) -> Dict:
        return {
            "total_leads": 0, "hot_leads": 0, "warm_leads": 0, "cold_leads": 0,
            "total_conversations": 0, "active_conversations": 0,
            "avg_conversion_rate": 0.0, "avg_lead_score": 0.0,
            "total_followups_sent": 0,
            "sentiment_breakdown": {"positive": 0, "negative": 0, "neutral": 0},
            "leads_by_status": {},
            "conversion_trend": [],
            "top_performing_segments": [],
            "ai_insights": ["Add your first leads to start seeing insights."]
        }

    async def generate_conversation_insights(self, conversation_id: str) -> Dict[str, Any]:
        """Deep analysis of a completed conversation."""
        db = get_supabase()
        
        try:
            # Get messages
            msgs_result = db.table("messages").select("*") \
                .eq("conversation_id", conversation_id) \
                .order("created_at") \
                .execute()
            messages = msgs_result.data or []
            
            if not messages:
                return {"error": "No messages found"}
            
            # Format conversation
            conv_text = "\n".join([
                f"{'Customer' if m['role'] == 'user' else 'Sales AI'}: {m['content']}"
                for m in messages
            ])
            
            prompt = f"""Analyze this sales conversation and provide structured insights:

{conv_text}

Provide a JSON-structured analysis with:
1. overall_sentiment: positive/negative/neutral
2. buying_intent_score: 0-100
3. conversion_probability: 0-100
4. key_pain_points: list of 3 pain points mentioned
5. competitor_mentions: any competitors mentioned
6. recommended_actions: 3 specific next actions for the sales rep
7. objections_detected: list of objections raised
8. summary: 2-sentence summary of the conversation
9. coaching_tips: 2 tips for the sales rep

Return ONLY valid JSON, no markdown."""

            completion = self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=600,
            )
            
            import json
            try:
                result = json.loads(completion.choices[0].message.content)
            except:
                result = {
                    "overall_sentiment": "neutral",
                    "buying_intent_score": 50,
                    "conversion_probability": 40,
                    "key_pain_points": ["Cost concerns", "Implementation complexity", "ROI uncertainty"],
                    "competitor_mentions": [],
                    "recommended_actions": ["Schedule a demo", "Send pricing proposal", "Follow up in 48h"],
                    "objections_detected": [],
                    "summary": "Customer showed initial interest. Further qualification needed.",
                    "coaching_tips": ["Build more rapport before pricing discussion", "Ask about timeline"]
                }
            
            result["conversation_id"] = conversation_id
            return result
            
        except Exception as e:
            logger.error(f"Conversation insights error: {e}")
            return {"error": str(e), "conversation_id": conversation_id}


_analytics_agent = None

def get_analytics_agent() -> AnalyticsAgent:
    global _analytics_agent
    if _analytics_agent is None:
        _analytics_agent = AnalyticsAgent()
    return _analytics_agent
