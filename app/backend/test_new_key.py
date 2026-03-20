"""Test the new API key with gemini-1.5-flash (same as server.py)"""
import os, io, base64
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))

from PIL import Image
from google import genai as genai_new
from google.genai import types as genai_types

api_key = os.environ.get("GEMINI_API_KEY", "")
print(f"Testing key: {api_key[:15]}...")

# Create a real-looking noisy test image
import numpy as np
rng = np.random.RandomState(1)
arr = rng.randint(50, 200, (256, 256, 3), dtype=np.uint8)
img = Image.fromarray(arr)
buf = io.BytesIO()
img.save(buf, "JPEG", quality=75)
img_bytes = buf.getvalue()

client = genai_new.Client(api_key=api_key)

result = {}
try:
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=[
            "Is this image AI-generated or real? Reply with just one of: 'AI-Generated' or 'Likely Real'",
            genai_types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")
        ]
    )
    result["status"] = "SUCCESS"
    result["response"] = response.text.strip()
except Exception as e:
    result["status"] = "FAIL"
    result["error"] = str(e)[:300]

with open("gemini_new_key_test.txt", "w", encoding="utf-8") as f:
    import json
    f.write(json.dumps(result, indent=2))

print("Result:", result)
