"""
ML Models — Lead scoring, sentiment analysis, intent classification, 
and conversion prediction for SalesMind AI.
"""
import numpy as np
import logging
from typing import Dict, List, Any, Tuple
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)


# ============================================
# SENTIMENT ANALYZER
# ============================================

class SentimentAnalyzer:
    """Hybrid sentiment analysis using VADER for speed + LLM for depth."""

    def __init__(self):
        self.vader = SentimentIntensityAnalyzer()

    def analyze(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of text."""
        scores = self.vader.polarity_scores(text)
        
        compound = scores["compound"]
        
        # Classify
        if compound >= 0.15:
            sentiment = "positive"
            intensity = min(1.0, compound)
        elif compound <= -0.15:
            sentiment = "negative"
            intensity = min(1.0, abs(compound))
        else:
            sentiment = "neutral"
            intensity = 0.5
        
        # Buying signal detection
        positive_signals = [
            "interested", "great", "love", "perfect", "exactly", "yes", "definitely",
            "sounds good", "tell me more", "how much", "when can", "works for me",
            "impressive", "amazing", "fantastic", "absolutely"
        ]
        negative_signals = [
            "no", "not interested", "too expensive", "can't afford", "not right now",
            "competitor", "already have", "don't need", "maybe later", "think about it",
            "not sure", "concerned", "worried", "problem", "issue"
        ]
        
        text_lower = text.lower()
        buying_signals = sum(1 for s in positive_signals if s in text_lower)
        objection_signals = sum(1 for s in negative_signals if s in text_lower)
        
        return {
            "sentiment": sentiment,
            "score": compound,
            "intensity": intensity,
            "positive": scores["pos"],
            "negative": scores["neg"],
            "neutral": scores["neu"],
            "buying_signals": buying_signals,
            "objection_signals": objection_signals,
            "buying_score": min(1.0, buying_signals / 3) if buying_signals > 0 else 0.0
        }

    def analyze_conversation(self, messages: List[Dict]) -> Dict[str, Any]:
        """Analyze sentiment across an entire conversation."""
        user_messages = [m["content"] for m in messages if m["role"] == "user"]
        
        if not user_messages:
            return {"overall": "neutral", "trend": "stable", "trajectory": []}
        
        analyses = [self.analyze(msg) for msg in user_messages]
        
        compounds = [a["score"] for a in analyses]
        avg_compound = np.mean(compounds) if compounds else 0
        
        # Trend analysis
        if len(compounds) >= 3:
            first_half = np.mean(compounds[:len(compounds)//2])
            second_half = np.mean(compounds[len(compounds)//2:])
            trend = "improving" if second_half > first_half + 0.1 else \
                    "declining" if second_half < first_half - 0.1 else "stable"
        else:
            trend = "stable"
        
        overall = "positive" if avg_compound >= 0.15 else \
                  "negative" if avg_compound <= -0.15 else "neutral"
        
        total_buying = sum(a["buying_signals"] for a in analyses)
        total_objections = sum(a["objection_signals"] for a in analyses)
        
        return {
            "overall": overall,
            "score": avg_compound,
            "trend": trend,
            "trajectory": compounds,
            "buying_signals_count": total_buying,
            "objection_signals_count": total_objections,
            "analyses": analyses
        }


# ============================================
# INTENT CLASSIFIER
# ============================================

class IntentClassifier:
    """Rule-based + pattern intent classification."""

    INTENT_PATTERNS = {
        "ready_to_buy": [
            "how do i sign up", "where do i purchase", "let's do it", "i'm ready",
            "send me the contract", "i'll take it", "let's move forward", "proceed",
            "i want to buy", "place order", "get started"
        ],
        "interested": [
            "tell me more", "can you explain", "how does it work", "what are the features",
            "i'm curious", "interesting", "sounds good", "i like", "this looks",
            "what about", "how would", "can it do"
        ],
        "price_sensitive": [
            "how much", "what's the cost", "pricing", "too expensive", "cheaper",
            "budget", "afford", "discount", "deal", "offer", "negotiate", "price"
        ],
        "hesitant": [
            "i'm not sure", "maybe", "i'll think about it", "let me consider",
            "i need time", "not ready yet", "i'll get back to you", "need to discuss",
            "check with my team", "not yet"
        ],
        "objecting": [
            "too expensive", "already have", "not interested", "don't need",
            "another vendor", "competitor", "contract", "locked in", "switching"
        ],
        "just_browsing": [
            "just looking", "comparing options", "research", "exploring",
            "checking out", "gathering information", "learning about"
        ],
        "churning": [
            "cancel", "leave", "switching", "disappointed", "unhappy", "not working",
            "waste of money", "refund", "terrible", "awful", "worst"
        ]
    }

    def classify(self, text: str) -> Tuple[str, float]:
        """Classify user intent from text."""
        text_lower = text.lower()
        
        scores = {}
        for intent, patterns in self.INTENT_PATTERNS.items():
            score = sum(1 for p in patterns if p in text_lower)
            if score > 0:
                scores[intent] = score
        
        if not scores:
            return "general_inquiry", 0.5
        
        best_intent = max(scores, key=scores.get)
        confidence = min(0.95, scores[best_intent] / 3)
        
        return best_intent, confidence

    def detect_objection(self, text: str) -> Tuple[str, str]:
        """Detect specific objection type and generate counter strategy."""
        text_lower = text.lower()
        
        objections = {
            "price": {
                "patterns": ["expensive", "cost", "price", "budget", "afford", "cheap", "cheaper"],
                "type": "Price Objection",
                "strategy": "Emphasize ROI and value over cost. Offer flexible payment options or demonstrate cost savings."
            },
            "timing": {
                "patterns": ["not now", "later", "think about it", "not ready", "next quarter", "right now"],
                "type": "Timing Objection",
                "strategy": "Create urgency. Ask what would need to happen for them to be ready. Offer a pilot program."
            },
            "competitor": {
                "patterns": ["already use", "competitor", "another vendor", "current solution", "locked in"],
                "type": "Competitor Objection",
                "strategy": "Acknowledge their current solution. Highlight unique differentiators and switching support."
            },
            "trust": {
                "patterns": ["not sure", "don't know", "uncertain", "risky", "proven", "guarantee"],
                "type": "Trust Objection",
                "strategy": "Share case studies, testimonials, and offer a risk-free trial or guarantee."
            },
            "authority": {
                "patterns": ["check with", "my boss", "team", "approval", "decision maker", "not my call"],
                "type": "Authority Objection",
                "strategy": "Offer to present to the decision maker. Provide materials that help them champion internally."
            },
            "need": {
                "patterns": ["don't need", "not relevant", "not applicable", "different situation"],
                "type": "Need Objection",
                "strategy": "Ask deeper discovery questions. Uncover hidden pain points they haven't articulated."
            }
        }
        
        for key, obj in objections.items():
            if any(p in text_lower for p in obj["patterns"]):
                return obj["type"], obj["strategy"]
        
        return None, None


# ============================================
# LEAD SCORER
# ============================================

class LeadScorer:
    """
    AI-powered lead scoring using multiple signals.
    Returns a 0-100 score with category and confidence.
    """

    def score_lead(self, lead_data: Dict[str, Any], 
                   conversation_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Score a lead based on available data signals.
        
        Signals:
        - Profile completeness (email, phone, company, position)
        - Industry fit
        - Sentiment from conversations
        - Engagement level
        - Intent signals
        - Response time
        """
        score = 0
        factors = []
        
        # Profile completeness (0-20 points)
        profile_score = 0
        if lead_data.get("email"):
            profile_score += 5
        if lead_data.get("phone"):
            profile_score += 5
        if lead_data.get("company"):
            profile_score += 5
        if lead_data.get("position"):
            profile_score += 5
        score += profile_score
        if profile_score >= 15:
            factors.append("Complete contact profile")

        # Industry signals (0-15 points)
        high_value_industries = [
            "technology", "software", "saas", "fintech", "healthcare", 
            "finance", "banking", "consulting", "enterprise"
        ]
        industry = (lead_data.get("industry") or "").lower()
        if any(ind in industry for ind in high_value_industries):
            score += 15
            factors.append(f"High-value industry: {lead_data.get('industry')}")
        elif industry:
            score += 8

        # Position / seniority (0-15 points)
        senior_titles = [
            "ceo", "cto", "cfo", "vp", "director", "head of", "chief", "founder",
            "president", "owner", "partner", "manager"
        ]
        position = (lead_data.get("position") or "").lower()
        if any(title in position for title in senior_titles):
            score += 15
            factors.append(f"Decision-maker title: {lead_data.get('position')}")
        elif position:
            score += 5

        # Source quality (0-10 points)
        source_scores = {
            "referral": 10, "form": 8, "api": 8, "manual": 5, "csv": 3
        }
        source = lead_data.get("source", "manual").lower()
        source_score = source_scores.get(source, 5)
        score += source_score
        if source == "referral":
            factors.append("High-quality referral source")

        # Conversation signals (0-40 points)
        if conversation_data:
            sentiment_score = conversation_data.get("sentiment_score", 0)
            intent = conversation_data.get("intent", "")
            buying_signals = conversation_data.get("buying_signals", 0)
            message_count = conversation_data.get("message_count", 0)
            objections = conversation_data.get("objection_count", 0)

            # Sentiment (0-15)
            if sentiment_score >= 0.5:
                score += 15
                factors.append("Highly positive sentiment")
            elif sentiment_score >= 0.15:
                score += 10
                factors.append("Positive sentiment")
            elif sentiment_score >= 0:
                score += 5

            # Intent (0-15)
            intent_values = {
                "ready_to_buy": 15, "interested": 10, "price_sensitive": 8,
                "hesitant": 4, "just_browsing": 2, "objecting": 1, "churning": 0
            }
            score += intent_values.get(intent, 5)
            if intent in ["ready_to_buy", "interested"]:
                factors.append(f"Strong buying intent: {intent.replace('_', ' ')}")

            # Engagement depth (0-10)
            if message_count >= 10:
                score += 10
                factors.append("High engagement depth")
            elif message_count >= 5:
                score += 6
            elif message_count >= 2:
                score += 3

            # Buying signals
            if buying_signals >= 3:
                score += min(10, buying_signals * 2)
                factors.append("Multiple buying signals detected")
            
            # Objections (negative)
            if objections >= 3:
                score -= 10
                factors.append("Multiple objections raised")
            elif objections >= 1:
                score -= 5

        # Manual signals from notes
        notes = (lead_data.get("notes") or "").lower()
        if any(word in notes for word in ["urgent", "asap", "immediately", "priority"]):
            score += 10
            factors.append("Urgent timeline indicated")

        # Clamp score
        score = max(0, min(100, score))

        # Categorize
        if score >= 70:
            category = "hot"
        elif score >= 40:
            category = "warm"
        else:
            category = "cold"

        # Confidence (based on data quality)
        data_completeness = sum([
            bool(lead_data.get("email")),
            bool(lead_data.get("company")),
            bool(lead_data.get("position")),
            bool(conversation_data),
            score > 0
        ]) / 5
        confidence = round(data_completeness * 100, 1)

        # Buying probability
        buying_probability = round(score / 100 * 0.85 + 0.05, 2)  # 5% floor, 90% ceiling

        # Urgency
        urgency = "high" if score >= 70 else "medium" if score >= 40 else "low"

        # Next action recommendation
        if category == "hot":
            recommended_action = "Schedule a product demo or call immediately. Strike while interest is high."
        elif category == "warm":
            recommended_action = "Send personalized follow-up. Address specific pain points. Offer a free trial."
        else:
            recommended_action = "Add to nurture sequence. Share educational content. Re-engage in 2-3 weeks."

        return {
            "score": score,
            "category": category,
            "confidence": confidence,
            "buying_probability": buying_probability,
            "urgency_level": urgency,
            "recommended_action": recommended_action,
            "key_factors": factors[:5]  # Top 5 factors
        }


# Singletons
_sentiment_analyzer = None
_intent_classifier = None
_lead_scorer = None


def get_sentiment_analyzer() -> SentimentAnalyzer:
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        _sentiment_analyzer = SentimentAnalyzer()
    return _sentiment_analyzer


def get_intent_classifier() -> IntentClassifier:
    global _intent_classifier
    if _intent_classifier is None:
        _intent_classifier = IntentClassifier()
    return _intent_classifier


def get_lead_scorer() -> LeadScorer:
    global _lead_scorer
    if _lead_scorer is None:
        _lead_scorer = LeadScorer()
    return _lead_scorer
