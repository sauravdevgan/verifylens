"""Patch server.py to use new google-genai SDK for Gemini 2.0 Flash"""
import os

path = r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\server.py"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace the old Gemini SDK call block
OLD = (
    '    try:\n'
    '        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("EMERGENT_LLM_KEY")\n'
    '        if not api_key or api_key == "dummy-key":\n'
    '            raise Exception("No valid API key configured")\n'
    '\n'
    '        genai.configure(api_key=api_key)\n'
    '        model = genai.GenerativeModel("gemini-1.5-flash")\n'
    '\n'
    '        # Decode base64 to bytes for Gemini\n'
    '        import base64 as b64_module\n'
    '        image_bytes = b64_module.b64decode(file_base64)\n'
    '\n'
    '        image_part = {\n'
    '            "mime_type": content_type if content_type.startswith("image/") else "image/jpeg",\n'
    '            "data": image_bytes\n'
    '        }\n'
    '\n'
    '        # Run in executor since Gemini SDK is sync\n'
    '        loop = asyncio.get_event_loop()\n'
    '        response = await loop.run_in_executor(\n'
    '            None,\n'
    '            lambda: model.generate_content([PROMPT, image_part])\n'
    '        )\n'
    '\n'
    '        response_text = response.text.strip()\n'
    '\n'
    '        # Strip markdown code fences if present\n'
    '        if response_text.startswith("```"):\n'
    '            lines = response_text.split("\\n")\n'
    '            json_lines = [l for l in lines if not l.startswith("```")]\n'
    '            response_text = "\\n".join(json_lines).strip()\n'
    '\n'
    '        result = json_module.loads(response_text)\n'
    '\n'
    '        return {\n'
    '            "verdict": result.get("verdict", "Unknown"),\n'
    '            "confidence_score": min(max(float(result.get("confidence_score", 50)), 0), 100),\n'
    '            "reasoning": result.get("reasoning", "Analysis completed."),\n'
    '            "detailed_analysis": result.get("detailed_analysis", [])\n'
    '        }\n'
    '\n'
    '    except Exception as e:\n'
    '        logger.error(f"Gemini analysis error: {str(e)}")\n'
    '        # Fall back to local heuristic analysis\n'
    '        return await analyze_locally(file_base64, content_type, filename)'
)

NEW = (
    '    try:\n'
    '        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("EMERGENT_LLM_KEY")\n'
    '        if not api_key or api_key == "dummy-key":\n'
    '            raise Exception("No valid API key")\n'
    '\n'
    '        import base64 as b64_module, re as re_module\n'
    '        from google import genai as genai_new\n'
    '        from google.genai import types as genai_types\n'
    '\n'
    '        image_bytes = b64_module.b64decode(file_base64)\n'
    '        mime = content_type if content_type.startswith("image/") else "image/jpeg"\n'
    '\n'
    '        client = genai_new.Client(api_key=api_key)\n'
    '\n'
    '        loop = asyncio.get_event_loop()\n'
    '        response = await loop.run_in_executor(\n'
    '            None,\n'
    '            lambda: client.models.generate_content(\n'
    '                model="gemini-2.0-flash",\n'
    '                contents=[\n'
    '                    genai_types.Part.from_text(PROMPT),\n'
    '                    genai_types.Part.from_bytes(data=image_bytes, mime_type=mime)\n'
    '                ]\n'
    '            )\n'
    '        )\n'
    '\n'
    '        response_text = response.text.strip()\n'
    '        response_text = re_module.sub(r"```json\\s*", "", response_text)\n'
    '        response_text = re_module.sub(r"```\\s*", "", response_text).strip()\n'
    '\n'
    '        result = json_module.loads(response_text)\n'
    '        return {\n'
    '            "verdict": result.get("verdict", "Unknown"),\n'
    '            "confidence_score": min(max(float(result.get("confidence_score", 50)), 0), 100),\n'
    '            "reasoning": result.get("reasoning", "Analysis completed."),\n'
    '            "detailed_analysis": result.get("detailed_analysis", [])\n'
    '        }\n'
    '\n'
    '    except Exception as e:\n'
    '        logger.error(f"Gemini analysis error: {str(e)}")\n'
    '        return await analyze_locally(file_base64, content_type, filename)'
)

if OLD in text:
    text = text.replace(OLD, NEW)
    print("PATCHED: Replaced old google.generativeai block with new google-genai SDK")
else:
    print("ERROR: Could not find the block to replace")
    idx = text.find('genai.configure(api_key=api_key)')
    print(f"Found 'genai.configure' at pos: {idx}")

with open(path, "w", encoding="utf-8") as f:
    f.write(text)
