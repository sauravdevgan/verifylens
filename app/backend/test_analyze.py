"""
Test script: register a user, login, then upload a test image for AI detection.
"""
import urllib.request, json, socket, uuid, os, io, base64, re

socket.setdefaulttimeout(15)

BASE = "http://localhost:8000/api"

# 1. Register a fresh test user
email = f"test_{uuid.uuid4().hex[:6]}@test.com"
print(f"Registering: {email}")
req = urllib.request.Request(
    f"{BASE}/auth/register",
    data=json.dumps({"name": "AI Tester", "email": email, "password": "password123"}).encode(),
    headers={"Content-Type": "application/json"}
)
res = json.loads(urllib.request.urlopen(req).read().decode())
token = res["token"]
print(f"Logged in. Token: {token[:30]}...")

# 2. Create a tiny test JPEG in memory (solid color - looks "AI-uniform")
from PIL import Image
buf = io.BytesIO()
img = Image.new("RGB", (512, 512), color=(180, 130, 200))  # Solid purple - uniform
img.save(buf, format="JPEG")
buf.seek(0)
img_bytes = buf.read()
img_b64 = base64.b64encode(img_bytes).decode()
print(f"Created test image, size: {len(img_bytes)} bytes")

# 3. Upload to /analyze using multipart form
boundary = "----TestBoundary1234567890"
body_parts = []
body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"authorization\"\r\n\r\nBearer {token}")
body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test_image.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n" )
body = "\r\n".join(body_parts).encode() + img_bytes + f"\r\n--{boundary}--\r\n".encode()

req_analyze = urllib.request.Request(
    f"{BASE}/analyze",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
)

print("Uploading to /analyze endpoint...")
try:
    result_raw = urllib.request.urlopen(req_analyze).read().decode()
    result = json.loads(result_raw)
    print("\n=== ANALYSIS RESULT ===")
    print(f"Verdict: {result.get('verdict')}")
    print(f"Confidence: {result.get('confidence_score')}%")
    print(f"Reasoning: {result.get('reasoning')}")
    print("\nDetailed Analysis:")
    for item in result.get("detailed_analysis", []):
        print(f"  [{item.get('indicator', '?').upper()}] {item.get('category')}: {item.get('finding')}")
    print("\nSUCCESS! The analyze endpoint is working.")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, "read"):
        print(e.read().decode())
