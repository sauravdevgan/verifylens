import asyncio
import httpx
import uuid
import random

async def test_full_flow():
    base_url = "http://localhost:8000/api"
    unique_id = str(uuid.uuid4())[:8]
    email = f"test_{unique_id}@example.com"
    password = "password123"
    name = f"User {unique_id}"

    async with httpx.AsyncClient() as client:
        print(f"--- Testing Full Auth Flow for {email} ---")
        
        # 1. Registration - Send OTP
        print("1. Requesting registration OTP...")
        resp = await client.post(f"{base_url}/auth/send-otp", json={"email": email})
        if resp.status_code != 200:
            print(f"FAILED: /auth/send-otp returned {resp.status_code}")
            print(resp.text)
            return
        
        reg_otp = resp.json().get("mock_otp")
        print(f"SUCCESS: Registration OTP received: {reg_otp}")
        
        # 2. Complete Registration
        print("2. Completing registration...")
        resp = await client.post(f"{base_url}/auth/register", json={
            "name": name,
            "email": email,
            "password": password,
            "otp": reg_otp
        })
        if resp.status_code != 200:
            print(f"FAILED: /auth/register returned {resp.status_code}")
            print(resp.text)
            return
        
        print("SUCCESS: Registration complete.")
        
        # 3. Login - Step 1
        print("3. Logging in (Step 1)...")
        resp = await client.post(f"{base_url}/auth/login", json={
            "email": email,
            "password": password
        })
        if resp.status_code != 200:
            print(f"FAILED: /auth/login returned {resp.status_code}")
            print(resp.text)
            return
        
        login_otp = resp.json().get("mock_otp")
        print(f"SUCCESS: Login OTP received: {login_otp}")
        
        # 4. Login - Step 2 (Verify)
        print("4. Verifying login OTP (Step 2)...")
        resp = await client.post(f"{base_url}/auth/login/verify", json={
            "email": email,
            "otp": login_otp
        })
        if resp.status_code != 200:
            print(f"FAILED: /auth/login/verify returned {resp.status_code}")
            print(resp.text)
            return
        
        data = resp.json()
        token = data.get("token")
        if token:
            print(f"SUCCESS: Login verified! Token: {token[:20]}...")
        else:
            print("FAILED: Token missing from verification response.")

if __name__ == "__main__":
    asyncio.run(test_full_flow())
