"""
Print the FULL raw Gemini response to see exactly what it returns
"""
import os, io, base64, json, urllib.request
from dotenv import load_dotenv; from pathlib import Path
load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))
from PIL import Image; import numpy as np

api_key = os.environ.get("GEMINI_API_KEY", "")

# Minimal test image
rng = np.random.RandomState(1)
arr = rng.randint(80, 180, (128, 128, 3), dtype=np.uint8)
img = Image.fromarray(arr)
buf = io.BytesIO(); img.save(buf, "JPEG"); img_bytes = buf.getvalue()
img_b64 = base64.b64encode(img_bytes).decode()

PROMPT = """You are an expert AI-generated media detector. Analyze this image and determine if it is AI-generated or a real photograph.

Respond in EXACTLY this JSON format and nothing else:
{
    "verdict": "AI-Generated" or "Likely Real",
    "confidence_score": <number 0-100>,
    "reasoning": "<2-3 sentence summary>",
    "detailed_analysis": [
        {"category": "Texture & Patterns", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Lighting & Shadows", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Facial Features", "finding": "<detail or N/A>", "indicator": "ai" or "real" or "neutral"},
        {"category": "Background Consistency", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Edge Quality", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Metadata Artifacts", "finding": "<detail>", "indicator": "ai" or "real" or "neutral"}
    ]
}"""

model = "models/gemini-2.5-flash"
url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={api_key}"
payload = json.dumps({
    "contents": [{"parts": [{"text": PROMPT}, {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}}]}],
    "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048}
}).encode()

req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
raw = urllib.request.urlopen(req, timeout=30).read().decode()
resp_data = json.loads(raw)
full_text = resp_data["candidates"][0]["content"]["parts"][0]["text"]

print("=== FULL RAW GEMINI RESPONSE ===")
print(repr(full_text[:100]))  # Show exact chars to see if there are backticks/extra text
print("\n=== RESPONSE TEXT ===")
print(full_text[:500])

# Now try parsing
import re
text = full_text.strip()
# Remove backtick code fences
text = re.sub(r"```json\s*", "", text)
text = re.sub(r"```\s*", "", text).strip()
try:
    parsed = json.loads(text)
    print("\n=== PARSED SUCCESSFULLY ===")
    print(f"Verdict: {parsed.get('verdict')}")
    print(f"Score: {parsed.get('confidence_score')}")
except json.JSONDecodeError as e:
    print(f"\n=== JSON PARSE ERROR ===")
    print(f"Error: {e}")
    print(f"Offending text: {text[:300]}")
