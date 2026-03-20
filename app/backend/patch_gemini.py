import os

path = r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\server.py"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

OLD_FUNC = '''async def analyze_with_gpt(file_base64: str, content_type: str, filename: str):
    """Analyze image with GPT-5.2 Vision via emergentintegrations"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise Exception("EMERGENT_LLM_KEY not set")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"analysis-{uuid.uuid4()}",
            system_message="""You are an expert AI-generated media detector. Analyze the provided image and determine if it is AI-generated or a real photograph/image.

You MUST respond in EXACTLY this JSON format and nothing else:
{
    "verdict": "AI-Generated" or "Likely Real",
    "confidence_score": <number between 0 and 100>,
    "reasoning": "<2-3 sentence summary of your analysis>",
    "detailed_analysis": [
        {"category": "Texture & Patterns", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Lighting & Shadows", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Facial Features", "finding": "<detail or N/A>", "indicator": "ai" or "real" or "neutral"},
        {"category": "Background Consistency", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Edge Quality", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Metadata Artifacts", "finding": "<detail>", "indicator": "ai" or "real" or "neutral"}
    ]
}

Be thorough and analytical. Look for:
- Unnatural smoothness or plastic-like skin textures
- Inconsistent lighting directions
- Distorted or malformed hands, fingers, teeth, ears
- Repeating patterns or textures
- Unusual bokeh or depth of field artifacts
- Text or symbol anomalies
- Overly perfect symmetry
- Background inconsistencies or morphing
- Hair strand anomalies
- Jewelry or accessory distortions"""
        )
        chat.with_model("openai", "gpt-5.2")
        
        image_content = ImageContent(image_base64=file_base64)
        
        user_message = UserMessage(
            text=f"Analyze this image (filename: {filename}). Is it AI-generated or real? Provide your analysis in the exact JSON format specified.",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        # Try to extract JSON from the response
        response_text = response.strip()
        if response_text.startswith("```"):
            # Remove markdown code blocks
            lines = response_text.split("\\n")
            json_lines = []
            in_block = False
            for line in lines:
                if line.startswith("```"):
                    in_block = not in_block
                    continue
                if in_block:
                    json_lines.append(line)
            response_text = "\\n".join(json_lines)
        
        result = json.loads(response_text)
        
        # Validate and ensure required fields
        return {
            "verdict": result.get("verdict", "Unknown"),
            "confidence_score": min(max(float(result.get("confidence_score", 50)), 0), 100),
            "reasoning": result.get("reasoning", "Analysis completed."),
            "detailed_analysis": result.get("detailed_analysis", [])
        }
        
    except Exception as e:
        logger.error(f"GPT analysis error: {str(e)}")
        # Return a fallback response if API fails
        return {
            "verdict": "Analysis Error",
            "confidence_score": 0,
            "reasoning": f"Could not complete analysis: {str(e)}",
            "detailed_analysis": [
                {"category": "Error", "finding": str(e), "indicator": "neutral"}
            ]
        }'''

NEW_FUNC = '''async def analyze_with_gpt(file_base64: str, content_type: str, filename: str):
    """Analyze image with Gemini Vision API for AI detection"""
    import json as json_module
    import asyncio
    import google.generativeai as genai

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
}

Look for:
- Unnatural smoothness or plastic-like skin/surface textures
- Inconsistent or impossible lighting directions
- Distorted hands, fingers, teeth, ears, or text
- Repeating or tiling patterns
- Unusual depth of field or bokeh artifacts
- Overly perfect symmetry
- Background morphing or melting
- Strangely blended hair strands"""

    try:
        # Use Gemini Vision
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("EMERGENT_LLM_KEY")
        if not api_key or api_key == "dummy-key":
            raise Exception("No valid API key configured")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        # Decode base64 to bytes for Gemini
        import base64 as b64_module
        image_bytes = b64_module.b64decode(file_base64)

        image_part = {
            "mime_type": content_type if content_type.startswith("image/") else "image/jpeg",
            "data": image_bytes
        }

        # Run in executor since Gemini SDK is sync
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content([PROMPT, image_part])
        )

        response_text = response.text.strip()

        # Strip markdown code fences if present
        if response_text.startswith("```"):
            lines = response_text.split("\\n")
            json_lines = [l for l in lines if not l.startswith("```")]
            response_text = "\\n".join(json_lines).strip()

        result = json_module.loads(response_text)

        return {
            "verdict": result.get("verdict", "Unknown"),
            "confidence_score": min(max(float(result.get("confidence_score", 50)), 0), 100),
            "reasoning": result.get("reasoning", "Analysis completed."),
            "detailed_analysis": result.get("detailed_analysis", [])
        }

    except Exception as e:
        logger.error(f"Gemini analysis error: {str(e)}")
        return {
            "verdict": "Analysis Error",
            "confidence_score": 0,
            "reasoning": f"Could not complete analysis: {str(e)}",
            "detailed_analysis": [
                {"category": "Error", "finding": str(e), "indicator": "neutral"}
            ]
        }'''

if OLD_FUNC in text:
    text = text.replace(OLD_FUNC, NEW_FUNC)
    print("Replaced analyze_with_gpt successfully!")
else:
    print("ERROR: Could not find the function to replace!")
    # Try to find the start
    idx = text.find("async def analyze_with_gpt")
    print(f"Function found at position: {idx}")

with open(path, "w", encoding="utf-8") as f:
    f.write(text)
