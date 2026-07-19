"""
Auth Router — Welcome emails via Resend, and auth health check.
Supabase Auth handles actual login/signup on the client side.
This router handles server-side helpers like transactional welcome emails.
"""
import logging
import resend
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Configure Resend SDK
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY


class WelcomeEmailRequest(BaseModel):
    email: EmailStr
    full_name: str = "there"


@router.post("/welcome-email")
async def send_welcome_email(request: WelcomeEmailRequest):
    """
    Send a branded welcome email when a new user signs up.
    Uses Resend for reliable transactional delivery.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — skipping welcome email")
        return {"success": False, "reason": "Email service not configured"}

    first_name = request.full_name.split()[0] if request.full_name else "there"
    year = datetime.now().year

    features = [
        ("&#x1F3AF;", "AI-powered lead scoring that prioritizes your best opportunities"),
        ("&#x1F916;", "Nexus AI — your always-on sales coach and strategy advisor"),
        ("&#x1F4E7;", "Automated follow-up emails sent at exactly the right time"),
        ("&#x1F399;", "Voice-enabled conversations with real-time AI coaching"),
    ]

    feature_rows = ""
    for icon, text in features:
        feature_rows += f"""
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="color:#32d583;font-size:16px;margin-right:10px;">{icon}</span>
            <span style="font-size:14px;color:#a8afb8;">{text}</span>
          </td>
        </tr>"""

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to SalesMind AI</title>
</head>
<body style="margin:0;padding:0;background:#08090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo header -->
          <tr>
            <td style="padding-bottom:32px;" align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#32d583,#6aa7ff);border-radius:16px;width:52px;height:52px;text-align:center;vertical-align:middle;font-size:24px;">&#x26A1;</td>
                  <td style="padding-left:12px;">
                    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">SalesMind AI</p>
                    <p style="margin:0;font-size:12px;color:#747d89;">Revenue OS</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#fff;line-height:1.2;">
                Welcome, {first_name}! &#x1F389;
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#a8afb8;line-height:1.7;">
                You've just joined the most intelligent sales platform on the market.
                SalesMind AI is ready to help you close more deals with less effort.
              </p>

              <!-- Features list -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                {feature_rows}
              </table>

              <!-- CTA button -->
              <div style="text-align:center;">
                <a href="http://localhost:3000/dashboard"
                   style="display:inline-block;background:linear-gradient(135deg,#32d583,#28c070);color:#08090b;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;box-shadow:0 0 30px rgba(50,213,131,0.3);">
                  Open Dashboard &#x2192;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#4f5864;line-height:1.7;">
                You're receiving this because you signed up for SalesMind AI.<br />
                &copy; {year} SalesMind AI. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    try:
        from_email = settings.RESEND_FROM_EMAIL
        from_addr = from_email if "<" in from_email else f"SalesMind AI <{from_email}>"

        params = {
            "from": from_addr,
            "to": [request.email],
            "subject": f"Welcome to SalesMind AI, {first_name}! &#x1F680;",
            "html": html_body,
        }
        result = resend.Emails.send(params)
        logger.info(f"Welcome email sent to {request.email} — ID: {result.get('id')}")
        return {"success": True, "message_id": result.get("id")}
    except Exception as e:
        logger.error(f"Failed to send welcome email to {request.email}: {e}")
        # Non-critical — don't block the signup flow
        return {"success": False, "error": str(e)}


@router.get("/health")
async def auth_health():
    """Check auth and email service health."""
    return {
        "supabase": bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY),
        "resend": bool(settings.RESEND_API_KEY),
        "resend_from": settings.RESEND_FROM_EMAIL,
    }
