"""Test Gemini Vision with proper image format"""
import asyncio, io, base64, math, os, json, re
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))

import google.generativeai as genai
from PIL import Image

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
print(f"Key: {GEMINI_KEY[:12]}...")

genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# Test with a smooth gradient (AI-like)
ai_img = Image.new("RGB", (512, 512))
pix = ai_img.load()
for y in range(512):
    for x in range(512):
        r = int(120 + 80 * math.sin(x / 512 * math.pi))
        g = int(100 + 60 * math.sin(y / 512 * math.pi))
        b = int(180 + 40 * math.cos((x+y)/512*math.pi))
        pix[x, y] = (r, g, b)

buf = io.BytesIO()
ai_img.save(buf, "PNG")
buf.seek(0)

prompt = """Analyze this image. Is it AI-generated or a real photo? Reply ONLY with JSON:
{"verdict": "AI-Generated" or "Likely Real", "confidence_score": <0-100>, "reasoning": "<2 sentences>"}"""

# Use PIL Image directly  
response = model.generate_content([prompt, ai_img])
text = response.text.strip()
text = re.sub(r"```json\s*", "", text)
text = re.sub(r"```\s*", "", text)
result = json.loads(text.strip())
print(f"Verdict: {result['verdict']}")
print(f"Confidence: {result['confidence_score']}%")
print(f"Reasoning: {result['reasoning']}")
