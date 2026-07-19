"""
Apply schema.sql to Supabase using the Management API.
Uses direct SQL execution via postgrest or management REST.
"""
import sys, requests, time
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from config import settings

URL = settings.SUPABASE_URL
KEY = settings.SUPABASE_SERVICE_KEY   # service_role key - has full access

# Extract project ref from URL: https://<ref>.supabase.co
project_ref = URL.replace("https://", "").split(".")[0]
print(f"Project ref: {project_ref}")
print(f"URL: {URL}\n")

# Read the full schema
with open("database/schema.sql", "r") as f:
    full_sql = f.read()

# Parse individual statements (split on ';', skip empty/comment-only)
raw = full_sql.split(";")
stmts = []
for s in raw:
    lines = [l for l in s.splitlines() if l.strip() and not l.strip().startswith("--")]
    if lines:
        stmts.append(" ".join(lines).strip())

print(f"Total statements to run: {len(stmts)}\n")

ok = err = skip = 0

for i, stmt in enumerate(stmts):
    preview = stmt[:70].replace("\n", " ")
    
    # Try via Supabase's pg REST proxy (v1/query)
    resp = requests.post(
        f"{URL}/rest/v1/",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/sql",
        },
        data=(stmt + ";").encode(),
        timeout=20,
    )
    
    # Also try direct pg endpoint
    resp2 = requests.post(
        f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
        headers={
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
        },
        json={"query": stmt + ";"},
        timeout=20,
    )
    
    if resp2.status_code in (200, 201, 204):
        print(f"  OK   [{i+1:02d}] {preview}")
        ok += 1
    else:
        body = resp2.text[:120]
        if "already exists" in body or "duplicate" in body.lower():
            print(f"  SKIP [{i+1:02d}] Already exists - {preview}")
            skip += 1
        else:
            print(f"  ERR  [{i+1:02d}] {resp2.status_code}: {body[:80]}")
            print(f"        stmt: {preview}")
            err += 1

print(f"\nDone: {ok} ok, {skip} skipped, {err} errors")
