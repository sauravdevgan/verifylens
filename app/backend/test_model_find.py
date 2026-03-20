"""Try different Gemini model names to find one that works"""
import os; from dotenv import load_dotenv; from pathlib import Path
load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))
import google.generativeai as genai, io, base64, math, json, re
from PIL import Image

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Create test image
ai_img = Image.new("RGB", (256, 256))
pix = ai_img.load()
for y in range(256):
    for x in range(256):
        pix[x, y] = (int(120 + 80 * (x/256)), int(100 + 60 * (y/256)), 180)
buf = io.BytesIO()
ai_img.save(buf, "JPEG")
img_bytes = buf.getvalue()
img_b64 = base64.b64encode(img_bytes).decode()

models_to_try = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro-latest",
    "gemini-pro-vision",
    "models/gemini-1.5-flash",
    "models/gemini-1.5-flash-latest",
    "models/gemini-pro-vision",
]

for model_name in models_to_try:
    try:
        model = genai.GenerativeModel(model_name)
        prompt = "Say 'hello' in one word."
        resp = model.generate_content(prompt)
        print(f"✅ TEXT model works: {model_name} -> {resp.text.strip()[:30]}")
        
        # Try vision
        resp2 = model.generate_content([
            "What color is dominant in this image? One word answer.",
            {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}}
        ])
        print(f"✅ VISION model works: {model_name} -> {resp2.text.strip()[:30]}")
        break
    except Exception as e:
        print(f"❌ {model_name}: {str(e)[:80]}")
