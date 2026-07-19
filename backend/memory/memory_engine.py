"""
Memory Engine — Manages long-term conversation and customer memory for SalesMind AI.
Stores and retrieves customer profiles, conversation history, and behavioral patterns.
"""
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)


class ConversationMemory:
    """Manages per-conversation message history with sliding window."""

    def __init__(self, conversation_id: str, max_messages: int = 20):
        self.conversation_id = conversation_id
        self.max_messages = max_messages
        self._messages: List[Dict] = []
        self._loaded = False

    async def load(self):
        """Load recent messages from Supabase."""
        try:
            db = get_supabase()
            result = db.table("messages") \
                .select("role, content, created_at") \
                .eq("conversation_id", self.conversation_id) \
                .order("created_at", desc=False) \
                .limit(self.max_messages) \
                .execute()
            
            self._messages = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in result.data
            ]
            self._loaded = True
        except Exception as e:
            logger.error(f"Failed to load conversation memory: {e}")
            self._messages = []
            self._loaded = True

    def add_message(self, role: str, content: str):
        """Add a message to in-memory history."""
        self._messages.append({"role": role, "content": content})
        if len(self._messages) > self.max_messages:
            # Keep system messages, trim oldest non-system
            non_system = [m for m in self._messages if m["role"] != "system"]
            system = [m for m in self._messages if m["role"] == "system"]
            self._messages = system + non_system[-(self.max_messages - len(system)):]

    def get_messages(self) -> List[Dict]:
        """Get all messages as list of dicts."""
        return self._messages.copy()

    def get_formatted(self) -> str:
        """Get messages as formatted string for prompt context."""
        if not self._messages:
            return "No previous messages."
        
        formatted = []
        for msg in self._messages[-10:]:  # Last 10 for context
            role = "Customer" if msg["role"] == "user" else "Sales AI"
            formatted.append(f"{role}: {msg['content']}")
        return "\n".join(formatted)

    def clear(self):
        self._messages = []


class CustomerProfileMemory:
    """Manages long-term customer behavioral memory."""

    def __init__(self, lead_id: str):
        self.lead_id = lead_id
        self._profile: Dict[str, Any] = {}
        self._loaded = False

    async def load(self):
        """Load customer profile from Supabase."""
        try:
            db = get_supabase()
            result = db.table("customer_profiles") \
                .select("*") \
                .eq("lead_id", self.lead_id) \
                .limit(1) \
                .execute()
            
            if result.data:
                self._profile = result.data[0]
            else:
                self._profile = {
                    "lead_id": self.lead_id,
                    "preferences": {},
                    "pain_points": [],
                    "interests": [],
                    "objections_history": [],
                    "successful_approaches": [],
                    "preferred_tone": "professional",
                    "interaction_count": 0
                }
            self._loaded = True
        except Exception as e:
            logger.error(f"Failed to load customer profile: {e}")
            self._profile = {}
            self._loaded = True

    async def update(self, updates: Dict[str, Any]):
        """Update customer profile in Supabase."""
        try:
            db = get_supabase()
            self._profile.update(updates)
            self._profile["last_interaction_at"] = datetime.utcnow().isoformat()
            
            existing = db.table("customer_profiles") \
                .select("id") \
                .eq("lead_id", self.lead_id) \
                .execute()
            
            if existing.data:
                db.table("customer_profiles") \
                    .update(updates) \
                    .eq("lead_id", self.lead_id) \
                    .execute()
            else:
                db.table("customer_profiles") \
                    .insert({**self._profile, "lead_id": self.lead_id}) \
                    .execute()
        except Exception as e:
            logger.error(f"Failed to update customer profile: {e}")

    def get_context_summary(self) -> str:
        """Generate a concise context summary for AI prompts."""
        if not self._profile:
            return "New customer. No previous interaction history."
        
        parts = []
        
        if self._profile.get("interaction_count", 0) > 0:
            parts.append(f"Previous interactions: {self._profile['interaction_count']}")
        
        if self._profile.get("pain_points"):
            parts.append(f"Known pain points: {', '.join(self._profile['pain_points'][:3])}")
        
        if self._profile.get("interests"):
            parts.append(f"Interests: {', '.join(self._profile['interests'][:3])}")
        
        if self._profile.get("objections_history"):
            parts.append(f"Past objections: {', '.join(self._profile['objections_history'][:2])}")
        
        if self._profile.get("successful_approaches"):
            parts.append(f"What works: {', '.join(self._profile['successful_approaches'][:2])}")
        
        if self._profile.get("preferred_tone"):
            parts.append(f"Communication style: {self._profile['preferred_tone']}")
        
        if self._profile.get("personality_summary"):
            parts.append(f"Profile: {self._profile['personality_summary']}")
        
        return "\n".join(parts) if parts else "First interaction with this customer."

    def get_profile(self) -> Dict[str, Any]:
        return self._profile.copy()

    async def add_objection(self, objection: str):
        """Record a new objection."""
        objections = self._profile.get("objections_history", [])
        if objection not in objections:
            objections.append(objection)
            await self.update({"objections_history": objections[-10:]})

    async def add_pain_point(self, pain_point: str):
        """Record a pain point."""
        pain_points = self._profile.get("pain_points", [])
        if pain_point not in pain_points:
            pain_points.append(pain_point)
            await self.update({"pain_points": pain_points[-10:]})

    async def increment_interactions(self):
        """Increment interaction count."""
        count = self._profile.get("interaction_count", 0) + 1
        await self.update({"interaction_count": count})
