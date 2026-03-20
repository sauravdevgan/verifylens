import asyncio, io, base64, math, sys
sys.path.insert(0, r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend")

async def test():
    from server import analyze_locally
    from PIL import Image
    import numpy as np

    # TEST 1: AI synthetic - smooth gradient, 512x512 (standard Stable Diffusion size)
    ai_img = Image.new("RGB", (512, 512))
    pix = ai_img.load()
    for y in range(512):
        for x in range(512):
            r = int(120 + 80 * math.sin(x / 512 * math.pi))
            g = int(100 + 60 * math.sin(y / 512 * math.pi))
            b = int(180 + 40 * math.cos((x+y)/512*math.pi))
            pix[x,y] = (r, g, b)
    buf = io.BytesIO()
    ai_img.save(buf, "JPEG", quality=95)
    b64 = base64.b64encode(buf.getvalue()).decode()
    r1 = await analyze_locally(b64, "image/jpeg", "ai.jpg")

    # TEST 2: Real - pure sensor noise at camera-like resolution  
    rng = np.random.RandomState(42)
    nat = rng.randint(0, 256, (853, 1280, 3), dtype=np.uint8)
    noise = rng.normal(0, 12, nat.shape).astype(np.int16)
    nat2 = np.clip(nat.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    nat_img = Image.fromarray(nat2)
    buf2 = io.BytesIO()
    nat_img.save(buf2, "JPEG", quality=75)
    b64_2 = base64.b64encode(buf2.getvalue()).decode()
    r2 = await analyze_locally(b64_2, "image/jpeg", "real.jpg")

    print(f"AI image    -> {r1['verdict']} ({r1['confidence_score']}%)")
    print(f"Real image  -> {r2['verdict']} ({r2['confidence_score']}%)")
    t1 = r1['verdict'] == "AI-Generated"
    t2 = r2['verdict'] == "Likely Real"
    print(f"Correct: {int(t1)+int(t2)}/2  [AI={t1}, Real={t2}]")

asyncio.run(test())
