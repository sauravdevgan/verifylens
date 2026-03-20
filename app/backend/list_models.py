"""List Gemini models via REST API"""
import os, urllib.request, json
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\.env"))

key = os.environ['GEMINI_API_KEY']

# Try v1beta
try:
    resp = urllib.request.urlopen(
        f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    ).read().decode()
    data = json.loads(resp)
    print("=== v1beta models (vision-capable) ===")
    for m in data.get("models", []):
        if "generateContent" in m.get("supportedGenerationMethods", []):
            print(f"  {m['name']}")
except Exception as e:
    print(f"v1beta error: {e}")

# Try v1
try:
    resp2 = urllib.request.urlopen(
        f"https://generativelanguage.googleapis.com/v1/models?key={key}"
    ).read().decode()
    data2 = json.loads(resp2)
    print("\n=== v1 models (vision-capable) ===")
    for m in data2.get("models", []):
        if "generateContent" in m.get("supportedGenerationMethods", []):
            print(f"  {m['name']}")
except Exception as e:
    print(f"v1 error: {e}")
