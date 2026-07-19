"""
Follow-up Agent — Generates personalized follow-up messages and sends emails via Resend.
"""
import logging
from typing import Optional, Dict, Any, List
from groq import Groq
import resend

from config import settings
from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)

FOLLOWUP_PROMPTS = {
    "email": """You are an expert sales copywriter. Generate a personalized follow-up email.

Lead Information:
{lead_info}

Conversation Context:
{conversation_context}

Additional Instructions:
{additional_context}

Write a compelling follow-up email with:
- A specific, personalized subject line (on first line starting with "Subject: ")
- Warm but professional opening that references the conversation
- 2-3 sentences of genuine value (not generic)
- A clear, low-friction call to action
- Professional sign-off

Tone: {tone}
Keep it concise (under 200 words in the body). Sound human, not like a template.""",

    "whatsapp": """Generate a short, friendly WhatsApp follow-up message.

Lead Information:
{lead_info}

Conversation Context:
{conversation_context}

Write a WhatsApp message that:
- Starts casually (Hi [Name]!)
- References something specific from the conversation
- Provides immediate value or answers a question
- Has a simple, low-pressure CTA
- Feels like it's from a real person, not automated
- Is under 100 words
- Uses 1-2 relevant emojis naturally

Tone: {tone}""",

    "linkedin": """Generate a personalized LinkedIn follow-up message.

Lead Information:
{lead_info}

Conversation Context:
{conversation_context}

Write a LinkedIn message that:
- Is professional but not stiff
- References something specific about their company or role
- Provides clear value proposition
- Has a conversational CTA
- Is under 150 words

Tone: {tone}""",

    "meeting_summary": """Generate a professional meeting summary email.

Lead Information:
{lead_info}

Conversation Context:
{conversation_context}

Create a meeting summary with:
Subject line starting with "Subject: "
Body including:
- Brief recap of what was discussed (bullet points)
- Key decisions made
- Action items with owner and timeline
- Next meeting/step details
- Professional closing

Be specific and actionable, not vague.""",
}


class FollowupAgent:
    """Generates and sends personalized follow-up messages."""

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        resend.api_key = settings.RESEND_API_KEY

    async def generate(
        self,
        followup_type: str,
        lead_data: Dict[str, Any],
        conversation_context: str,
        tone: str = "professional",
        additional_context: str = ""
    ) -> Dict[str, str]:
        """Generate a follow-up message using AI."""
        
        # Format lead info
        lead_info = self._format_lead_info(lead_data)
        
        # Get appropriate prompt template
        prompt_template = FOLLOWUP_PROMPTS.get(followup_type, FOLLOWUP_PROMPTS["email"])
        
        prompt = prompt_template.format(
            lead_info=lead_info,
            conversation_context=conversation_context or "No previous conversation recorded.",
            additional_context=additional_context or "Follow up on the sales conversation.",
            tone=tone
        )
        
        completion = self.client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,
        )
        
        content = completion.choices[0].message.content
        
        # Extract subject line for emails
        subject = None
        body = content
        if followup_type in ["email", "meeting_summary"]:
            lines = content.strip().split("\n")
            for i, line in enumerate(lines):
                if line.lower().startswith("subject:"):
                    subject = line.replace("Subject:", "").replace("subject:", "").strip()
                    body = "\n".join(lines[i+1:]).strip()
                    break
            
            if not subject:
                subject = f"Following up on our conversation — {lead_data.get('company', 'Your Business')}"
        
        return {
            "content": body,
            "subject": subject,
            "type": followup_type,
        }

    async def send_email(
        self,
        recipient_email: str,
        subject: str,
        content: str,
        lead_name: str = ""
    ) -> Dict[str, Any]:
        """Send follow-up email via Resend."""
        try:
            # Convert plain text to basic HTML
            html_content = self._text_to_html(content, lead_name)
            
            params = {
                "from": settings.RESEND_FROM_EMAIL,
                "to": [recipient_email],
                "subject": subject,
                "html": html_content,
                "text": content,
            }
            
            email = resend.Emails.send(params)
            logger.info(f"Email sent to {recipient_email}: {email}")
            
            return {"success": True, "message_id": email.get("id"), "status": "sent"}
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return {"success": False, "error": str(e), "status": "failed"}

    def _format_lead_info(self, lead: Dict) -> str:
        """Format lead data for AI prompt."""
        parts = []
        if lead.get("name"):
            parts.append(f"Name: {lead['name']}")
        if lead.get("email"):
            parts.append(f"Email: {lead['email']}")
        if lead.get("company"):
            parts.append(f"Company: {lead['company']}")
        if lead.get("position"):
            parts.append(f"Position: {lead['position']}")
        if lead.get("industry"):
            parts.append(f"Industry: {lead['industry']}")
        if lead.get("category"):
            parts.append(f"Lead Category: {lead['category'].upper()}")
        if lead.get("notes"):
            parts.append(f"Notes: {lead['notes']}")
        return "\n".join(parts) if parts else "No lead information available."

    def _text_to_html(self, text: str, name: str) -> str:
        """Convert plain text follow-up to professional HTML email."""
        paragraphs = text.strip().split("\n\n")
        html_paragraphs = "".join(f"<p>{p.replace(chr(10), '<br>')}</p>" for p in paragraphs)
        
        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
         color: #1a1a2e; line-height: 1.7; margin: 0; padding: 0; }}
  .container {{ max-width: 600px; margin: 40px auto; padding: 40px; 
               background: #ffffff; border-radius: 12px; 
               box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
  .header {{ border-bottom: 2px solid #6c63ff; padding-bottom: 20px; margin-bottom: 30px; }}
  .logo {{ font-size: 22px; font-weight: 700; color: #6c63ff; }}
  p {{ margin: 0 0 16px; color: #374151; }}
  .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; 
             font-size: 12px; color: #9ca3af; text-align: center; }}
  .signature {{ margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; 
                border-left: 4px solid #6c63ff; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">⚡ SalesMind AI</div>
  </div>
  {html_paragraphs}
  <div class="signature">
    <strong>Alex</strong><br>
    AI Sales Representative<br>
    SalesMind AI Platform
  </div>
  <div class="footer">
    This email was personalized by SalesMind AI. 
    <a href="#" style="color: #6c63ff;">Unsubscribe</a>
  </div>
</div>
</body>
</html>"""


_followup_agent = None

def get_followup_agent() -> FollowupAgent:
    global _followup_agent
    if _followup_agent is None:
        _followup_agent = FollowupAgent()
    return _followup_agent
