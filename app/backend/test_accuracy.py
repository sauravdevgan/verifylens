"""
Test the advanced forensic detector with two images:
1. A synthetic "AI-like" image (uniform, smooth, standard AI size 512x512)
2. A "real-like" image (noisy, natural, odd dimensions, complex texture)
"""
import asyncio, sys, io, base64, math
sys.path.insert(0, r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend")

from server import analyze_locally

async def test():
    from PIL import Image
    import numpy as np

    print("=" * 60)
    print("ADVANCED FORENSIC DETECTOR ACCURACY TEST")
    print("=" * 60)

    # ── TEST 1: AI-style image ──────────────────────────────────────
    # Very smooth, uniform, 512x512 (standard SD output), minimal noise
    print("\n[TEST 1] SYNTHETIC / AI-Generated-style image")
    ai_img = Image.new("RGB", (512, 512))
    pixels = ai_img.load()
    for y in range(512):
        for x in range(512):
            # Very smooth gradient - no noise, uniform transitions
            r = int(120 + 80 * math.sin(x / 512 * math.pi))
            g = int(100 + 60 * math.sin(y / 512 * math.pi))
            b = int(180 + 40 * math.cos((x + y) / 512 * math.pi))
            pixels[x, y] = (r, g, b)
    buf = io.BytesIO()
    ai_img.save(buf, format="JPEG", quality=95)  # High quality = less JPEG noise
    b64 = base64.b64encode(buf.getvalue()).decode()
    result1 = await analyze_locally(b64, "image/jpeg", "ai_test.jpg")
    print(f"  Verdict:     {result1['verdict']}")
    print(f"  Confidence:  {result1['confidence_score']}%")
    print(f"  Reasoning:   {result1['reasoning'][:120]}...")
    print(f"  Breakdown:")
    for s in result1['detailed_analysis']:
        icon = "🔴" if s['indicator'] == 'ai' else ("🟢" if s['indicator'] == 'real' else "⚪")
        print(f"    {icon} {s['category']}: {s['finding'][:80]}")

    # ── TEST 2: Natural/Real-style image ───────────────────────────
    # Noisy, complex, non-standard dimensions (1280x853 like a real DSLR shot)
    print("\n[TEST 2] NATURAL / Real photograph-style image")
    rng = np.random.RandomState(42)
    nat = rng.randint(0, 256, (853, 1280, 3), dtype=np.uint8)
    # Add natural-looking covariance structure
    from PIL import Image, ImageFilter
    nat_img = Image.fromarray(nat)
    # Multiple Gaussian blurs at different scales = complex natural texture
    blurred = nat_img.filter(ImageFilter.GaussianBlur(1))
    nat_arr = np.array(blurred, dtype=np.float32)
    # Add sensor noise pattern
    noise = rng.normal(0, 12, nat_arr.shape)
    nat_arr = np.clip(nat_arr + noise, 0, 255).astype(np.uint8)
    nat_img2 = Image.fromarray(nat_arr)
    buf2 = io.BytesIO()
    nat_img2.save(buf2, format="JPEG", quality=75)  # Normal JPEG quality
    b64_2 = base64.b64encode(buf2.getvalue()).decode()
    result2 = await analyze_locally(b64_2, "image/jpeg", "real_test.jpg")
    print(f"  Verdict:     {result2['verdict']}")
    print(f"  Confidence:  {result2['confidence_score']}%")
    print(f"  Reasoning:   {result2['reasoning'][:120]}...")
    print(f"  Breakdown:")
    for s in result2['detailed_analysis']:
        icon = "🔴" if s['indicator'] == 'ai' else ("🟢" if s['indicator'] == 'real' else "⚪")
        print(f"    {icon} {s['category']}: {s['finding'][:80]}")

    print("\n" + "=" * 60)
    print("ACCURACY CHECK:")
    t1_correct = result1['verdict'] == "AI-Generated"
    t2_correct = result2['verdict'] == "Likely Real"
    print(f"  Test 1 (AI-style)    → {result1['verdict']} {'✅ CORRECT' if t1_correct else '❌ WRONG'}")
    print(f"  Test 2 (Real-style)  → {result2['verdict']} {'✅ CORRECT' if t2_correct else '❌ WRONG'}")
    score = (int(t1_correct) + int(t2_correct))
    print(f"  Score: {score}/2 ({score * 50}%)")
    print("=" * 60)

asyncio.run(test())
