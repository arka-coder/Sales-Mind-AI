from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


# ============================================
# ENUMS
# ============================================

class LeadCategory(str, Enum):
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"

class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    NEGOTIATING = "negotiating"
    WON = "won"
    LOST = "lost"
    NURTURING = "nurturing"

class SentimentEnum(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class ChannelEnum(str, Enum):
    CHAT = "chat"
    VOICE = "voice"
    EMAIL = "email"
    WHATSAPP = "whatsapp"

class FollowupType(str, Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    LINKEDIN = "linkedin"
    SMS = "sms"
    MEETING_SUMMARY = "meeting_summary"
    CALL_SUMMARY = "call_summary"

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# ============================================
# LEAD MODELS
# ============================================

class LeadBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    industry: Optional[str] = None
    source: Optional[str] = "manual"
    notes: Optional[str] = None
    tags: Optional[List[str]] = []
    status: Optional[LeadStatus] = LeadStatus.NEW

class LeadCreate(LeadBase):
    raw_data: Optional[Dict[str, Any]] = {}

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    industry: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[LeadStatus] = None

class LeadScoreResult(BaseModel):
    score: int
    category: LeadCategory
    confidence: float
    sentiment: SentimentEnum
    intent: str
    buying_probability: float
    urgency_level: str
    recommended_action: str
    key_factors: List[str]

class Lead(LeadBase):
    id: str
    score: int = 0
    category: LeadCategory = LeadCategory.COLD
    confidence: float = 0.0
    sentiment: SentimentEnum = SentimentEnum.NEUTRAL
    intent: str = "unknown"
    buying_probability: float = 0.0
    urgency_level: str = "low"
    recommended_action: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# CONVERSATION MODELS
# ============================================

class MessageCreate(BaseModel):
    role: MessageRole
    content: str
    conversation_id: Optional[str] = None

class Message(BaseModel):
    id: str
    conversation_id: str
    role: MessageRole
    content: str
    sentiment: Optional[str] = None
    intent: Optional[str] = None
    detected_objection: Optional[str] = None
    confidence: Optional[float] = None
    tokens_used: Optional[int] = None
    latency_ms: Optional[int] = None
    created_at: datetime

class ConversationCreate(BaseModel):
    lead_id: Optional[str] = None
    title: Optional[str] = None
    channel: Optional[ChannelEnum] = ChannelEnum.CHAT

class Conversation(BaseModel):
    id: str
    lead_id: Optional[str] = None
    title: Optional[str] = None
    channel: ChannelEnum = ChannelEnum.CHAT
    status: str = "active"
    overall_sentiment: Optional[str] = None
    buying_intent_score: float = 0.0
    conversion_probability: float = 0.0
    summary: Optional[str] = None
    key_pain_points: List[str] = []
    competitor_mentions: List[str] = []
    message_count: int = 0
    created_at: datetime
    updated_at: datetime


# ============================================
# CHAT MODELS
# ============================================

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    lead_id: Optional[str] = None
    stream: bool = True
    context: Optional[str] = None

class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    message_id: str
    sentiment: Optional[str] = None
    intent: Optional[str] = None
    coaching_tip: Optional[str] = None
    detected_objection: Optional[str] = None
    suggested_response: Optional[str] = None
    tokens_used: Optional[int] = None


# ============================================
# DOCUMENT / RAG MODELS
# ============================================

class DocumentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class Document(BaseModel):
    id: str
    name: str
    original_filename: str
    file_type: str
    file_size_bytes: Optional[int] = None
    status: str = "processing"
    chunk_count: int = 0
    description: Optional[str] = None
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime

class KnowledgeQuery(BaseModel):
    query: str
    n_results: int = 5
    filters: Optional[Dict[str, Any]] = {}


# ============================================
# FOLLOWUP MODELS
# ============================================

class FollowupRequest(BaseModel):
    lead_id: Optional[str] = None
    conversation_id: Optional[str] = None
    followup_type: FollowupType = FollowupType.EMAIL
    tone: str = "professional"
    additional_context: Optional[str] = None
    recipient_email: Optional[str] = None

class FollowupSendRequest(BaseModel):
    followup_id: str
    recipient_email: Optional[str] = None

class Followup(BaseModel):
    id: str
    lead_id: Optional[str] = None
    conversation_id: Optional[str] = None
    type: FollowupType
    subject: Optional[str] = None
    content: str
    status: str = "draft"
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    recipient_email: Optional[str] = None
    created_at: datetime


# ============================================
# ANALYTICS MODELS
# ============================================

class DashboardMetrics(BaseModel):
    total_leads: int
    hot_leads: int
    warm_leads: int
    cold_leads: int
    total_conversations: int
    active_conversations: int
    avg_conversion_rate: float
    avg_lead_score: float
    total_followups_sent: int
    sentiment_breakdown: Dict[str, int]
    leads_by_status: Dict[str, int]
    conversion_trend: List[Dict[str, Any]]
    top_performing_segments: List[Dict[str, Any]]
    ai_insights: List[str]

class SalesFunnelData(BaseModel):
    stage: str
    count: int
    value: float
    conversion_rate: float


# ============================================
# INSIGHT MODELS
# ============================================

class ConversationInsight(BaseModel):
    conversation_id: str
    sentiment: str
    buying_intent_score: float
    conversion_probability: float
    key_pain_points: List[str]
    competitor_mentions: List[str]
    recommended_actions: List[str]
    objections_detected: List[str]
    mood_trajectory: List[Dict[str, Any]]
    summary: str
    coaching_tips: List[str]


# ============================================
# VOICE MODELS
# ============================================

class VoiceTranscribeRequest(BaseModel):
    language: Optional[str] = "en"

class VoiceSynthesizeRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None


# ============================================
# CSV UPLOAD MODELS
# ============================================

class CSVUploadResult(BaseModel):
    total_rows: int
    processed: int
    failed: int
    leads_created: List[str]
    errors: List[str]
