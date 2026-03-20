"""Test Gemini API directly and write error to a file"""
import os, io, base64
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))

from PIL import Image

api_key = os.environ.get("GEMINI_API_KEY", "")

img = Image.new("RGB", (64, 64), (120, 90, 200))
buf = io.BytesIO()
img.save(buf, "JPEG")
img_bytes = buf.getvalue()

errors = []
results = []

# Attempt 1: google-genai SDK
try:
    from google import genai as genai_new
    from google.genai import types as genai_types
    client = genai_new.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            genai_types.Part.from_text("What color is this image? Reply in one word."),
            genai_types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")
        ]
    )
    results.append(f"google-genai gemini-2.0-flash: SUCCESS -> {response.text.strip()}")
except Exception as e:
    errors.append(f"google-genai gemini-2.0-flash: FAIL -> {type(e).__name__}: {str(e)}")

# Attempt 2: google-genai SDK with gemini-2.0-flash-exp
try:
    from google import genai as genai_new
    from google.genai import types as genai_types
    client = genai_new.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.0-flash-exp",
        contents=[
            genai_types.Part.from_text("What color is this image? Reply in one word."),
            genai_types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")
        ]
    )
    results.append(f"google-genai gemini-2.0-flash-exp: SUCCESS -> {response.text.strip()}")
except Exception as e:
    errors.append(f"google-genai gemini-2.0-flash-exp: FAIL -> {type(e).__name__}: {str(e)}")

# Attempt 3: use google-genai without vision to confirm auth works
try:
    from google import genai as genai_new
    client = genai_new.Client(api_key=api_key)
    response = client.models.generate_content(model="gemini-2.0-flash", contents="Say hello")
    results.append(f"google-genai text only: SUCCESS -> {response.text.strip()[:50]}")
except Exception as e:
    errors.append(f"google-genai text only: FAIL -> {type(e).__name__}: {str(e)}")

# Write to file
with open("gemini_test_result.txt", "w", encoding="utf-8") as f:
    f.write("=== GEMINI API TEST RESULTS ===\n\n")
    f.write("SUCCESSES:\n")
    for r in results:
        f.write(f"  {r}\n")
    f.write("\nERRORS:\n")
    for e in errors:
        f.write(f"  {e}\n")

print(f"Written to gemini_test_result.txt - {len(results)} success, {len(errors)} errors")
