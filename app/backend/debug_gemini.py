"""
Debug: Call analyze_with_gpt directly and print the full Gemini error
Run from the backend directory
"""
import asyncio, os, io, base64, json, urllib.request, math, sys
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))
os.chdir(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend")
sys.path.insert(0, r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend")

api_key = os.environ.get("GEMINI_API_KEY", "")
print(f"API Key in env: {api_key[:20]}...")

# Simulate what the server receives: a JPEG portrait-like image
from PIL import Image
import numpy as np

# Create something portrait-like (faces with complex features)
rng = np.random.RandomState(99)
arr = rng.randint(80, 180, (512, 512, 3), dtype=np.uint8)
img = Image.fromarray(arr)
buf = io.BytesIO()
img.save(buf, "JPEG", quality=85)
img_bytes = buf.getvalue()
print(f"Test image: {len(img_bytes)} bytes")

file_base64 = base64.b64encode(img_bytes).decode()
img_b64 = file_base64  # Already base64 of bytes

# Simulate exactly what analyze_with_gpt does
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

# The issue: the server decodes base64 → bytes → re-encodes to base64
# Let's trace exactly what happens in analyze_with_gpt:
import base64 as b64_module
image_bytes = b64_module.b64decode(file_base64)  # decode back to bytes
mime = "image/jpeg"
img_b64_final = b64_module.b64encode(image_bytes).decode()  # re-encode to b64

payload = json.dumps({
    "contents": [{
        "parts": [
            {"text": PROMPT},
            {"inline_data": {"mime_type": mime, "data": img_b64_final}}
        ]
    }],
    "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024}
}).encode()

print(f"\nPayload size: {len(payload)} bytes ({len(payload)//1024} KB)")
print("Calling Gemini REST API...")

try:
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    raw = urllib.request.urlopen(req, timeout=30).read().decode()
    resp_data = json.loads(raw)
    response_text = resp_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    print(f"\nGEMINI RESPONSE:\n{response_text[:500]}")
except urllib.request.HTTPError as he:
    error_body = he.read().decode()
    print(f"\nHTTP ERROR {he.code}:\n{error_body[:1000]}")
except Exception as e:
    print(f"\nERROR: {type(e).__name__}: {e}")
