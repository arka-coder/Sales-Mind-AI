"""Check Supabase table status."""
import sys, requests
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from config import settings

URL = settings.SUPABASE_URL
KEY = settings.SUPABASE_SERVICE_KEY

tables = ["leads", "conversations", "messages", "documents", "followups", "insights", "customer_profiles", "analytics_events"]
missing = []
existing = []

print(f"Supabase: {URL}\n")
for table in tables:
    resp = requests.get(
        f"{URL}/rest/v1/{table}?limit=1",
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"},
        timeout=10,
    )
    if resp.status_code == 200:
        existing.append(table)
        print(f"  OK   {table}")
    else:
        missing.append(table)
        print(f"  MISS {table}  [{resp.status_code}]")

print(f"\nExisting: {len(existing)}, Missing: {len(missing)}")
if missing:
    print(f"Missing: {missing}")
