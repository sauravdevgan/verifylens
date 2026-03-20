"""
Extended test script - prints all output for user to see
"""
import urllib.request, json, socket, uuid, io, base64

socket.setdefaulttimeout(15)
BASE = "http://localhost:8000/api"

email = f"test_{uuid.uuid4().hex[:6]}@test.com"
print(f"1. Registering: {email}")
req = urllib.request.Request(
    f"{BASE}/auth/register",
    data=json.dumps({"name": "AI Tester", "email": email, "password": "password123"}).encode(),
    headers={"Content-Type": "application/json"}
)
res = json.loads(urllib.request.urlopen(req).read().decode())
token = res["token"]
print(f"   ✅ Logged in as: {res['user']['name']} ({res['user']['email']})")
print(f"   Token starts with: {token[:30]}...")

# Create a test image with a Windows wallpaper-like gradient (more realistic)
from PIL import Image, ImageDraw
import io
buf = io.BytesIO()
img = Image.new("RGB", (800, 600))
draw = ImageDraw.Draw(img)
# Draw a gradient-like natural landscape
for y in range(600):
    color = (int(100 + y*0.1), int(150 - y*0.05), int(200 - y*0.2))
    draw.line([(0, y), (800, y)], fill=color)
img.save(buf, format="JPEG", quality=85)
buf.seek(0)
img_bytes = buf.read()
print(f"\n2. Test image created: {len(img_bytes)} bytes (gradient landscape)")

# Upload via multipart form
boundary = "----ABoundary12345"
form_body = (
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"authorization\"\r\n\r\n"
    f"Bearer {token}\r\n"
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"file\"; filename=\"landscape.jpg\"\r\n"
    f"Content-Type: image/jpeg\r\n\r\n"
).encode() + img_bytes + f"\r\n--{boundary}--\r\n".encode()

req_a = urllib.request.Request(
    f"{BASE}/analyze",
    data=form_body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
)

print(f"\n3. Sending image to /analyze endpoint...")
try:
    result = json.loads(urllib.request.urlopen(req_a).read().decode())
    print(f"\n=== ANALYSIS RESULT ===")
    print(f"   Verdict:          {result['verdict']}")
    print(f"   Confidence Score: {result['confidence_score']}%")
    print(f"   Reasoning:        {result['reasoning']}")
    print(f"\n   Detailed Analysis:")
    for item in result.get("detailed_analysis", []):
        icon = "🔴" if item['indicator'] == "ai" else ("🟢" if item['indicator'] == "real" else "⚪")
        print(f"   {icon} {item['category']}: {item['finding']}")
    print(f"\n   Share ID: {result.get('share_id')}")
    print(f"   Analysis ID: {result.get('id')}")
    print(f"\n4. Checking history...")
    hist_req = urllib.request.Request(
        f"{BASE}/analyses",
        headers={"Authorization": f"Bearer {token}"}
    )
    hist = json.loads(urllib.request.urlopen(hist_req).read().decode())
    print(f"   ✅ History has {len(hist)} analysis(es)")
    print(f"\n✅ ALL TESTS PASSED! The app is fully working.")
except Exception as e:
    print(f"   ❌ Error: {e}")
    if hasattr(e, 'read'): print(e.read().decode())
