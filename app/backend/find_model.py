"""List available models and find ones that support vision"""
import os, io, base64
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))

from PIL import Image
import numpy as np
from google import genai

client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])

# List all models
print("=== Available Models ===")
all_names = []
try:
    for m in client.models.list():
        print(f"  {m.name} | actions: {getattr(m, 'supported_actions', 'N/A')}")
        all_names.append(m.name)
except Exception as e:
    print(f"List failed: {e}")

# Try models that might work
from google.genai import types as genai_types

rng = np.random.RandomState(1)
arr = rng.randint(50, 200, (64, 64, 3), dtype=np.uint8)
img = Image.fromarray(arr)
buf = io.BytesIO()
img.save(buf, "JPEG")
img_bytes = buf.getvalue()

models_to_try = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001", 
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "models/gemini-1.5-flash",
    "models/gemini-1.5-flash-001",
    "gemini-pro-vision",
    "models/gemini-pro-vision",
]

print("\n=== Testing Models ===")
working = []
for model_name in models_to_try:
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=["Say hello in one word.", genai_types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")]
        )
        print(f"  ✅ WORKS: {model_name} -> {response.text.strip()[:30]}")
        working.append(model_name)
        break  # Found one that works
    except Exception as e:
        err = str(e)[:100]
        print(f"  ❌ FAIL: {model_name} -> {err}")

with open("working_models.txt", "w") as f:
    f.write("\n".join(working))
    
print(f"\nWorking models: {working}")
