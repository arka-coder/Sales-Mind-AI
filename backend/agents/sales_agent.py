"""
Sales Agent — Primary AI sales conversation agent powered by Groq LLaMA 3.3 70B.
Handles human-like sales conversations with memory, RAG context, and strategic reasoning.
"""
import time
import logging
from typing import AsyncGenerator, Optional, Dict, Any, List

from groq import Groq
from config import settings
from memory.memory_engine import ConversationMemory, CustomerProfileMemory
from ml.models import get_sentiment_analyzer, get_intent_classifier
from rag.pipeline import get_rag_pipeline

logger = logging.getLogger(__name__)

SALES_AGENT_SYSTEM_PROMPT = """You are Alex, an elite AI Sales Representative for a cutting-edge B2B SaaS company. You have 15+ years of sales experience and are known for your exceptional ability to:

1. BUILD GENUINE RAPPORT: Connect with customers authentically, remembering their context and showing you care.
2. UNDERSTAND PSYCHOLOGY: Read between the lines to understand what customers REALLY want vs. what they say.
3. COMMUNICATE WITH PRECISION: Speak clearly, confidently, and persuasively without being pushy.
4. HANDLE OBJECTIONS MASTERFULLY: Turn "no" into "let me think about it" and "let me think" into "yes."
5. CREATE VALUE: Always demonstrate ROI and business impact, not just features.
6. CLOSE STRATEGICALLY: Know when to push and when to back off.

YOUR COMMUNICATION STYLE:
- Be warm but professional
- Use the customer's name naturally (not robotically)
- Ask intelligent discovery questions
- Listen actively (reference what they said previously)
- Use social proof subtly
- Create urgency without pressure
- Never use clichés like "Great question!" or "Absolutely!"
- Vary your sentence structure and length
- Be concise — no walls of text

YOUR GOALS IN ORDER:
1. Understand their situation and pain points
2. Show how you can solve their specific problem
3. Build enough trust to have a business conversation
4. Move them toward a next step (demo, trial, proposal)

KNOWLEDGE BASE CONTEXT (use when relevant):
{rag_context}

CUSTOMER MEMORY:
{customer_memory}

CONVERSATION HISTORY:
{conversation_history}

IMPORTANT RULES:
- Never make up pricing unless you have specific information
- Never promise features that aren't confirmed
- If you don't know something, say "Let me connect you with our specialist for that"
- Keep responses focused and conversational (2-4 paragraphs max)
- Always end with a soft next step or question to keep the conversation moving
"""

COACHING_PROMPT = """Based on this conversation, provide a brief AI coaching tip for the sales rep.

Conversation snippet:
{conversation}

Customer's latest message: {latest_message}

Provide ONE specific, actionable coaching tip in 1-2 sentences. Focus on what the rep should do next strategically. Be direct and specific."""

COMPETITOR_ANALYSIS_PROMPT = """A customer mentioned: "{customer_message}"

Analyze this competitor mention and provide:
1. The competitor they mentioned
2. 2-3 key advantages we likely have
3. A persuasive response that acknowledges their current solution while highlighting our differentiation

Keep it confident but not aggressive. Focus on value addition, not disparaging competitors."""


class SalesAgent:
    """Primary conversational sales AI agent."""

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.sentiment_analyzer = get_sentiment_analyzer()
        self.intent_classifier = get_intent_classifier()
        self.rag = get_rag_pipeline()
        self.model = settings.GROQ_MODEL

    async def chat(
        self,
        message: str,
        conversation_id: str,
        lead_id: Optional[str] = None,
        stream: bool = True,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a customer message and generate an intelligent sales response.
        Returns response dict with message, analysis, and coaching tip.
        """
        start_time = time.time()
        
        # Load memory
        conv_memory = ConversationMemory(conversation_id)
        await conv_memory.load()
        
        customer_memory_str = "New customer - first interaction."
        if lead_id:
            customer_memory = CustomerProfileMemory(lead_id)
            await customer_memory.load()
            customer_memory_str = customer_memory.get_context_summary()

        # Retrieve RAG context
        rag_chunks = self.rag.retrieve(message, n_results=3)
        rag_context = self.rag.format_context(rag_chunks) if rag_chunks else \
            "No specific product knowledge retrieved. Use general sales expertise."

        # Analyze customer message
        sentiment = self.sentiment_analyzer.analyze(message)
        intent, intent_confidence = self.intent_classifier.classify(message)
        objection_type, objection_strategy = self.intent_classifier.detect_objection(message)

        # Build conversation history
        conversation_history = conv_memory.get_formatted()

        # Build system prompt
        system_prompt = SALES_AGENT_SYSTEM_PROMPT.format(
            rag_context=rag_context,
            customer_memory=customer_memory_str,
            conversation_history=conversation_history
        )

        if context:
            system_prompt += f"\n\n--- SPECIAL INSTRUCTIONS ---\n{context}\n---------------------------\n"

        # Build messages
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add recent conversation
        for msg in conv_memory.get_messages()[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": message})

        # Generate response
        response_text = ""
        
        if stream:
            response_text = await self._stream_response(messages)
        else:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.75,
                max_tokens=600,
            )
            response_text = completion.choices[0].message.content

        # Generate coaching tip
        coaching_tip = await self._generate_coaching_tip(
            conversation_history, message, intent, sentiment
        )

        # Check for competitor mentions
        competitor_response = None
        competitor_keywords = ["competitor", "alternative", "instead", "versus", "compare",
                               "other solution", "already use", "current vendor"]
        if any(kw in message.lower() for kw in competitor_keywords):
            competitor_response = await self._handle_competitor(message)

        latency_ms = int((time.time() - start_time) * 1000)

        # Update memory
        conv_memory.add_message("user", message)
        conv_memory.add_message("assistant", response_text)
        
        if lead_id:
            await customer_memory.increment_interactions()
            if objection_type:
                await customer_memory.add_objection(objection_type)

        return {
            "response": response_text,
            "sentiment": sentiment["sentiment"],
            "intent": intent,
            "intent_confidence": intent_confidence,
            "detected_objection": objection_type,
            "objection_strategy": objection_strategy,
            "coaching_tip": coaching_tip,
            "competitor_insight": competitor_response,
            "buying_score": sentiment.get("buying_score", 0),
            "latency_ms": latency_ms,
            "rag_used": bool(rag_chunks),
        }

    async def _stream_response(self, messages: List[Dict]) -> str:
        """Generate streaming response and collect full text."""
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.75,
            max_tokens=600,
            stream=True,
        )
        
        full_text = ""
        for chunk in completion:
            if chunk.choices[0].delta.content:
                full_text += chunk.choices[0].delta.content
        
        return full_text

    async def stream_response_generator(
        self, 
        message: str,
        conversation_id: str,
        lead_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Yield response chunks for real-time streaming to frontend."""
        conv_memory = ConversationMemory(conversation_id)
        await conv_memory.load()
        
        customer_memory_str = "New customer."
        if lead_id:
            customer_memory = CustomerProfileMemory(lead_id)
            await customer_memory.load()
            customer_memory_str = customer_memory.get_context_summary()

        rag_chunks = self.rag.retrieve(message, n_results=3)
        rag_context = self.rag.format_context(rag_chunks) if rag_chunks else "No specific knowledge retrieved."

        system_prompt = SALES_AGENT_SYSTEM_PROMPT.format(
            rag_context=rag_context,
            customer_memory=customer_memory_str,
            conversation_history=conv_memory.get_formatted()
        )

        messages = [{"role": "system", "content": system_prompt}]
        for msg in conv_memory.get_messages()[-10:]:
            messages.append(msg)
        messages.append({"role": "user", "content": message})

        stream = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.75,
            max_tokens=600,
            stream=True,
        )

        full_response = ""
        for chunk in stream:
            if chunk.choices[0].delta.content:
                text = chunk.choices[0].delta.content
                full_response += text
                yield text

        # Save to memory after streaming
        conv_memory.add_message("user", message)
        conv_memory.add_message("assistant", full_response)

    async def _generate_coaching_tip(
        self, conversation: str, latest_message: str, 
        intent: str, sentiment: Dict
    ) -> str:
        """Generate a quick coaching tip for the sales rep."""
        try:
            # Map intent + sentiment to pre-built tips (fast, no API call needed)
            tips = {
                "ready_to_buy": "🚀 Customer shows buying intent! Move to close — ask for next step directly.",
                "price_sensitive": "💡 Price sensitivity detected. Lead with ROI and value before discussing cost.",
                "hesitant": "⏸️ Customer is hesitant. Ask open-ended questions to uncover the real concern.",
                "objecting": "🛡️ Objection detected. Acknowledge their concern, then pivot to value.",
                "just_browsing": "🔍 Customer is exploring. Share a compelling success story to generate interest.",
                "interested": "✅ Good engagement! Ask a deeper discovery question to qualify further.",
                "churning": "⚠️ Risk of churn detected. Escalate to retention specialist or offer immediate value.",
            }
            
            base_tip = tips.get(intent, "💬 Keep the conversation going with a thoughtful question.")
            
            if sentiment["sentiment"] == "negative":
                base_tip += " Customer mood is negative — acknowledge their frustration first."
            elif sentiment["sentiment"] == "positive" and sentiment.get("buying_score", 0) > 0.5:
                base_tip += " High buying energy — don't overthink it, move to next step!"
            
            return base_tip
        except Exception as e:
            logger.error(f"Coaching tip error: {e}")
            return "Keep the conversation going with a thoughtful follow-up question."

    async def _handle_competitor(self, message: str) -> str:
        """Generate a competitive positioning response."""
        try:
            prompt = COMPETITOR_ANALYSIS_PROMPT.format(customer_message=message)
            completion = self.client.chat.completions.create(
                model=settings.GROQ_MODEL_FAST,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=300,
            )
            return completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Competitor analysis error: {e}")
            return None


_sales_agent = None

def get_sales_agent() -> SalesAgent:
    global _sales_agent
    if _sales_agent is None:
        _sales_agent = SalesAgent()
    return _sales_agent
