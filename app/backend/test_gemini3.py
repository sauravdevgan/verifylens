"""Test Gemini with inline base64 data_url format"""
import io, base64, math, os, json, re
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))

import google.generativeai as genai
from PIL import Image

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
print(f"Key: {GEMINI_KEY[:12]}...")
genai.configure(api_key=GEMINI_KEY)

# Create smooth AI-like image
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
img_bytes = buf.getvalue()
img_b64 = base64.b64encode(img_bytes).decode()

model = genai.GenerativeModel("gemini-1.5-flash")
prompt = 'Is this image AI-generated or a real photo? Reply with JSON only: {"verdict": "AI-Generated" or "Likely Real", "confidence_score": <0-100>, "reasoning": "<2 sentences>"}'

response = model.generate_content([
    prompt,
    {
        "inline_data": {
            "mime_type": "image/jpeg",
            "data": img_b64
        }
    }
])

text = response.text.strip()
text = re.sub(r"```json\s*", "", text)
text = re.sub(r"```\s*", "", text)
print("Raw response:", text[:200])
result = json.loads(text.strip())
print(f"Verdict: {result['verdict']}")
print(f"Confidence: {result['confidence_score']}%")
print(f"Reasoning: {result['reasoning']}")
