-- ============================================
-- SalesMind AI — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    position TEXT,
    industry TEXT,
    source TEXT DEFAULT 'manual',  -- manual, csv, form, api
    
    -- AI Scoring
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    category TEXT DEFAULT 'cold' CHECK (category IN ('hot', 'warm', 'cold')),
    confidence NUMERIC(5,2) DEFAULT 0,
    
    -- AI Analysis
    sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    intent TEXT DEFAULT 'unknown',
    buying_probability NUMERIC(5,2) DEFAULT 0,
    urgency_level TEXT DEFAULT 'low' CHECK (urgency_level IN ('high', 'medium', 'low')),
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    recommended_action TEXT,
    next_followup_date TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'negotiating', 'won', 'lost', 'nurturing')),
    
    -- Raw data (from CSV or form)
    raw_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    
    -- Conversation metadata
    title TEXT,
    channel TEXT DEFAULT 'chat' CHECK (channel IN ('chat', 'voice', 'email', 'whatsapp')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    
    -- AI Analysis
    overall_sentiment TEXT DEFAULT 'neutral',
    buying_intent_score NUMERIC(5,2) DEFAULT 0,
    conversion_probability NUMERIC(5,2) DEFAULT 0,
    summary TEXT,
    key_pain_points TEXT[],
    competitor_mentions TEXT[],
    
    -- Counts
    message_count INTEGER DEFAULT 0,
    user_message_count INTEGER DEFAULT 0,
    ai_message_count INTEGER DEFAULT 0,
    
    -- Timing
    last_message_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- AI Analysis per message
    sentiment TEXT,
    intent TEXT,
    detected_objection TEXT,
    confidence NUMERIC(5,2),
    
    -- Metadata
    tokens_used INTEGER,
    model_used TEXT,
    latency_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- KNOWLEDGE DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt', 'csv', 'md')),
    file_size_bytes INTEGER,
    
    -- Processing status
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    chunk_count INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Metadata
    description TEXT,
    tags TEXT[],
    
    -- Storage
    storage_path TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FOLLOWUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    
    type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'linkedin', 'sms', 'meeting_summary', 'call_summary')),
    subject TEXT,
    content TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Email specific
    recipient_email TEXT,
    resend_message_id TEXT,
    
    -- AI metadata
    generation_prompt TEXT,
    tone TEXT DEFAULT 'professional',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INSIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    
    -- Insight data
    insight_type TEXT NOT NULL CHECK (insight_type IN ('sentiment', 'intent', 'objection', 'competitive', 'prediction', 'coaching')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info', 'success')),
    
    -- Scores
    score NUMERIC(5,2),
    confidence NUMERIC(5,2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    entity_type TEXT,  -- lead, conversation, document, followup
    entity_id UUID,
    
    properties JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMER PROFILES (Long-term Memory)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE UNIQUE,
    
    -- Accumulated intelligence
    preferences JSONB DEFAULT '{}',
    pain_points TEXT[],
    interests TEXT[],
    objections_history TEXT[],
    successful_approaches TEXT[],
    
    -- Communication style
    preferred_tone TEXT DEFAULT 'professional',
    response_speed TEXT DEFAULT 'normal',
    decision_style TEXT DEFAULT 'analytical',
    
    -- Summary
    personality_summary TEXT,
    relationship_summary TEXT,
    
    last_interaction_at TIMESTAMPTZ,
    interaction_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_followups_lead ON followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);

CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (Enable for production)
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- For development: allow all operations (update in production with auth policies)
CREATE POLICY "Allow all" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all" ON followups FOR ALL USING (true);
CREATE POLICY "Allow all" ON insights FOR ALL USING (true);
CREATE POLICY "Allow all" ON customer_profiles FOR ALL USING (true);
CREATE POLICY "Allow all" ON analytics_events FOR ALL USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_followups_updated_at BEFORE UPDATE ON followups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
