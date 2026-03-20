"""Test Gemini Vision directly with a real image analysis"""
import asyncio, io, base64, math, os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))

import google.generativeai as genai
import numpy as np
from PIL import Image

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
print(f"Gemini key found: {'YES (' + GEMINI_KEY[:8] + '...)' if GEMINI_KEY else 'NO'}")

async def test_gemini(img: Image.Image, label: str):
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=90)
    img_bytes = buf.getvalue()
    
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = """You are an expert AI image detector. Analyze this image and respond ONLY with valid JSON:
{
    "verdict": "AI-Generated" or "Likely Real",
    "confidence_score": <0-100>,
    "reasoning": "<2-3 sentences>",
    "detailed_analysis": [
        {"category": "Texture & Patterns", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Lighting & Shadows", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Facial Features", "finding": "<detail or N/A>", "indicator": "ai" or "real" or "neutral"},
        {"category": "Background Consistency", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Edge Quality", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Metadata Artifacts", "finding": "<detail>", "indicator": "ai" or "real" or "neutral"}
    ]
}"""
    
    image_part = {"mime_type": "image/jpeg", "data": img_bytes}
    
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None, lambda: model.generate_content([prompt, image_part])
    )
    
    import json, re
    text = response.text.strip()
    # Remove markdown fences
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    result = json.loads(text.strip())
    
    print(f"\n[{label}]")
    print(f"  Verdict:    {result['verdict']}")
    print(f"  Confidence: {result['confidence_score']}%")
    print(f"  Reasoning:  {result['reasoning'][:150]}")

async def main():
    # Test 1: smooth uniform image (AI-like)
    ai_img = Image.new("RGB", (512, 512))
    pix = ai_img.load()
    for y in range(512):
        for x in range(512):
            r = int(120 + 80 * math.sin(x / 512 * math.pi))
            g = int(100 + 60 * math.sin(y / 512 * math.pi))
            b = int(180 + 40 * math.cos((x+y)/512*math.pi))
            pix[x,y] = (r, g, b)
    
    await test_gemini(ai_img, "SMOOTH GRADIENT (should be AI-Generated)")

asyncio.run(main())
