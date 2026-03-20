"""Find working model and get its correct name from REST API"""
import os, urllib.request, json, io, base64
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))
from PIL import Image
import numpy as np

key = os.environ['GEMINI_API_KEY']

# Get all models from v1beta
resp = urllib.request.urlopen(
    f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
).read().decode()
data = json.loads(resp)

vision_models = [
    m['name'] for m in data.get("models", [])
    if "generateContent" in m.get("supportedGenerationMethods", [])
]
print(f"Vision-capable models ({len(vision_models)}):")
for m in vision_models:
    print(f"  {m}")

# Try the first working model
rng = np.random.RandomState(1)
arr = rng.randint(50, 200, (64, 64, 3), dtype=np.uint8)
img = Image.fromarray(arr)
buf = io.BytesIO()
img.save(buf, "JPEG")
img_bytes = buf.getvalue()
img_b64 = base64.b64encode(img_bytes).decode()

print("\n=== Testing models via REST API directly ===")
for model_name in vision_models[:5]:
    try:
        clean_name = model_name.replace("models/", "")
        url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={key}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": "Describe this image in one word."},
                    {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}}
                ]
            }]
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
        res = json.loads(urllib.request.urlopen(req).read().decode())
        text = res["candidates"][0]["content"]["parts"][0]["text"]
        print(f"  ✅ {model_name}: {text.strip()[:40]}")
        with open("best_model.txt", "w") as f:
            f.write(clean_name)
        break
    except Exception as e:
        print(f"  ❌ {model_name}: {str(e)[:80]}")
