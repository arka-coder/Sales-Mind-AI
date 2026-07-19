"""
SalesMind AI — API Key Health Check
Reads keys from .env and tests: Groq, OpenAI, ElevenLabs, Resend, Supabase
"""

import os, sys, requests
from dotenv import load_dotenv

load_dotenv()

PASS = "\033[92m✅ PASS\033[0m"
FAIL = "\033[91m❌ FAIL\033[0m"
SKIP = "\033[93m⚠️  SKIP\033[0m"

results = []

def check(name, passed, detail=""):
    status = PASS if passed else FAIL
    print(f"  {status}  {name}" + (f" — {detail}" if detail else ""))
    results.append((name, passed))

print("\n" + "="*55)
print("   SalesMind AI — API Health Check")
print("="*55 + "\n")

# ─── 1. GROQ ─────────────────────────────────────────────
print("🤖 Groq (LLM)")
key = os.getenv("GROQ_API_KEY", "")
if not key:
    check("Groq API Key", False, "GROQ_API_KEY not set")
else:
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                  "messages": [{"role": "user", "content": "Say OK"}],
                  "max_tokens": 5},
            timeout=15,
        )
        if r.status_code == 200:
            check("Groq", True, f"model={os.getenv('GROQ_MODEL')}")
        else:
            check("Groq", False, f"HTTP {r.status_code}: {r.text[:120]}")
    except Exception as e:
        check("Groq", False, str(e))

# ─── 2. OPENAI (Whisper STT) ─────────────────────────────
print("\n🎙️  OpenAI (Whisper STT)")
key = os.getenv("OPENAI_API_KEY", "")
if not key:
    print(f"  {SKIP}  OpenAI — OPENAI_API_KEY not set (optional)")
else:
    try:
        r = requests.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=10,
        )
        if r.status_code == 200:
            check("OpenAI", True, "key valid")
        else:
            check("OpenAI", False, f"HTTP {r.status_code}: {r.text[:120]}")
    except Exception as e:
        check("OpenAI", False, str(e))

# ─── 3. ELEVENLABS TTS ───────────────────────────────────
print("\n🔊 ElevenLabs (TTS)")
key = os.getenv("ELEVENLABS_API_KEY", "")
if not key:
    print(f"  {SKIP}  ElevenLabs — ELEVENLABS_API_KEY not set (optional)")
else:
    try:
        r = requests.get(
            "https://api.elevenlabs.io/v1/models",
            headers={"xi-api-key": key},
            timeout=10,
        )
        if r.status_code == 200:
            models = r.json()
            count = len(models) if isinstance(models, list) else "?"
            check("ElevenLabs", True, f"{count} model(s) available")
        else:
            check("ElevenLabs", False, f"HTTP {r.status_code}: {r.text[:120]}")
    except Exception as e:
        check("ElevenLabs", False, str(e))

# ─── 4. RESEND EMAIL ─────────────────────────────────────
print("\n📧 Resend (Email)")
key = os.getenv("RESEND_API_KEY", "")
if not key:
    print(f"  {SKIP}  Resend — RESEND_API_KEY not set (optional)")
else:
    try:
        r = requests.get(
            "https://api.resend.com/domains",
            headers={"Authorization": f"Bearer {key}"},
            timeout=10,
        )
        if r.status_code == 200:
            check("Resend", True, "key valid")
        else:
            check("Resend", False, f"HTTP {r.status_code}: {r.text[:120]}")
    except Exception as e:
        check("Resend", False, str(e))

# ─── 5. SUPABASE ─────────────────────────────────────────
print("\n🗄️  Supabase (Database)")
url  = os.getenv("SUPABASE_URL", "")
anon = os.getenv("SUPABASE_ANON_KEY", "")
if not url or not anon or "your_" in anon:
    print(f"  {SKIP}  Supabase — credentials not fully configured (required)")
else:
    try:
        # Use the health endpoint — works with anon key
        r = requests.get(
            f"{url}/auth/v1/health",
            headers={"apikey": anon, "Authorization": f"Bearer {anon}"},
            timeout=10,
        )
        if r.status_code == 200:
            check("Supabase", True, "auth service healthy")
        else:
            check("Supabase", False, f"HTTP {r.status_code}: {r.text[:120]}")
    except Exception as e:
        check("Supabase", False, str(e))

# ─── SUMMARY ─────────────────────────────────────────────
print("\n" + "="*55)
passed = sum(1 for _, ok in results if ok)
total  = len(results)
print(f"   Result: {passed}/{total} APIs working")
print("="*55 + "\n")
if passed < total:
    sys.exit(1)
