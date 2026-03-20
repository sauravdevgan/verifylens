"""Direct test of the new REST API approach"""
import os, io, base64, json, urllib.request, math
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))
from PIL import Image

api_key = os.environ.get("GEMINI_API_KEY", "")
print(f"Key: {api_key[:15]}...")

# Create a smooth AI-like image
ai_img = Image.new("RGB", (256, 256))
pix = ai_img.load()
for y in range(256):
    for x in range(256):
        r = int(120 + 80 * math.sin(x / 256 * math.pi))
        g = int(100 + 60 * math.sin(y / 256 * math.pi))
        b = int(180 + 40 * math.cos((x+y)/256*math.pi))
        pix[x, y] = (r, g, b)
buf = io.BytesIO()
ai_img.save(buf, "JPEG")
img_b64 = base64.b64encode(buf.getvalue()).decode()

model = "models/gemini-2.5-flash"
url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={api_key}"
payload = json.dumps({
    "contents": [{
        "parts": [
            {"text": "Is this image AI-generated or a real photo? Reply with just: AI-Generated or Likely Real"},
            {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}}
        ]
    }]
}).encode()

try:
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=30).read().decode()
    data = json.loads(resp)
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    print(f"GEMINI RESULT: {text.strip()}")
    print("SOURCE: Gemini 2.5 Flash REST API (WORKING!)")
except Exception as e:
    print(f"ERROR: {e}")
