"""Quick test to diagnose chat endpoint issues."""
import requests
import json

BASE = "http://localhost:8000"

print("=== Health Check ===")
r = requests.get(f"{BASE}/api/health")
print(r.json())

print("\n=== Test Chat Message ===")
payload = {
    "message": "Hello, I'm interested in your product",
    "stream": False
}
try:
    r = requests.post(f"{BASE}/api/chat/message", json=payload, timeout=60)
    print(f"Status: {r.status_code}")
    data = r.json()
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"ERROR: {e}")

print("\n=== Test Get Conversations ===")
try:
    r = requests.get(f"{BASE}/api/chat/conversations", timeout=10)
    print(f"Status: {r.status_code}")
    data = r.json()
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"ERROR: {e}")
