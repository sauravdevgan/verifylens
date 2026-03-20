"""Test the new key with older google.generativeai SDK"""
import os, io, base64, json, re
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))

import google.generativeai as genai
from PIL import Image
import numpy as np

api_key = os.environ.get("GEMINI_API_KEY", "")
print(f"Testing key: {api_key[:15]}...")
genai.configure(api_key=api_key)

# Create a test image
rng = np.random.RandomState(1)
arr = rng.randint(50, 200, (64, 64, 3), dtype=np.uint8)
img = Image.fromarray(arr)
buf = io.BytesIO()
img.save(buf, "JPEG")
img_bytes = buf.getvalue()
img_b64 = base64.b64encode(img_bytes).decode()

models_to_try = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro-latest",
    "gemini-pro-vision",
]

print("\n=== Testing models with google.generativeai SDK ===")
for model_name in models_to_try:
    try:
        model = genai.GenerativeModel(model_name)
        # Text only test first
        resp = model.generate_content("Say hello in one word.")
        print(f"  ✅ TEXT {model_name}: {resp.text.strip()[:20]}")
        
        # Vision test
        resp2 = model.generate_content([
            "What color dominates this image? One word.",
            {"mime_type": "image/jpeg", "data": img_b64}
        ])
        print(f"  ✅ VISION {model_name}: {resp2.text.strip()[:30]}")
        
        with open("working_model.txt", "w") as f:
            f.write(model_name)
        break
    except Exception as e:
        print(f"  ❌ {model_name}: {str(e)[:120]}")
