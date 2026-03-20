"""Full analyze test that writes output to a file for inspection"""
import urllib.request, json, socket, uuid, io, base64
import sys

socket.setdefaulttimeout(30)
BASE = "http://localhost:8000/api"

email = f"test_{uuid.uuid4().hex[:6]}@test.com"
req = urllib.request.Request(
    f"{BASE}/auth/register",
    data=json.dumps({"name": "AI Tester", "email": email, "password": "password123"}).encode(),
    headers={"Content-Type": "application/json"}
)
res = json.loads(urllib.request.urlopen(req).read().decode())
token = res["token"]

from PIL import Image, ImageDraw
buf = io.BytesIO()
img = Image.new("RGB", (512, 512))
draw = ImageDraw.Draw(img)
for y in range(512):
    color = (int(100 + y*0.1), int(150 - y*0.05), int(200 - y*0.2))
    draw.line([(0, y), (512, y)], fill=color)
img.save(buf, format="JPEG", quality=95)
buf.seek(0)
img_bytes = buf.read()

boundary = "----ABoundary12345"
form_body = (
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"authorization\"\r\n\r\n"
    f"Bearer {token}\r\n"
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"file\"; filename=\"gradient_512.jpg\"\r\n"
    f"Content-Type: image/jpeg\r\n\r\n"
).encode() + img_bytes + f"\r\n--{boundary}--\r\n".encode()

req_a = urllib.request.Request(
    f"{BASE}/analyze",
    data=form_body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
)

result = json.loads(urllib.request.urlopen(req_a).read().decode())

output = []
output.append(f"VERDICT: {result['verdict']}")
output.append(f"CONFIDENCE: {result['confidence_score']}%")
output.append(f"REASONING: {result['reasoning']}")
output.append("")
output.append("DETAILED ANALYSIS:")
for item in result.get("detailed_analysis", []):
    icon = "RED" if item['indicator'] == "ai" else ("GREEN" if item['indicator'] == "real" else "GREY")
    output.append(f"  [{icon}] {item['category']}: {item['finding']}")

# Check if Gemini was used
reasoning = result['reasoning']
is_gemini = not any(x in reasoning for x in ['sigma', 'ratio', 'std dev', 'heuristic', 'CV='])
output.append("")
output.append(f"SOURCE: {'Gemini 2.0 Flash (Real AI Analysis)' if is_gemini else 'Local Heuristic Fallback'}")

full_output = "\n".join(output)
print(full_output)

with open(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\last_result.txt", "w") as f:
    f.write(full_output)
