import asyncio
import httpx
import sys

async def verify_login_flow():
    base_url = "http://localhost:8000/api"
    test_email = "test@gmail.com"
    test_password = "password123"
    
    print(f"--- Starting 2FA Login Verification for {test_email} ---")
    
    # Step 1: Credential Verification
    async with httpx.AsyncClient() as client:
        try:
            print("1. Sending login credentials...")
            login_resp = await client.post(f"{base_url}/auth/login", json={
                "email": test_email,
                "password": test_password
            })
            
            if login_resp.status_code != 200:
                print(f"FAILED: Login step 1 failed with status {login_resp.status_code}")
                print(login_resp.text)
                return
                
            data = login_resp.json()
            otp = data.get("mock_otp")
            print(f"SUCCESS: OTP requested. Mock OTP received: {otp}")
            
            if not otp:
                print("FAILED: No mock OTP received (check your environment/server logs)")
                return
                
            # Step 2: OTP Verification
            print(f"2. Verifying OTP {otp} for {test_email}...")
            verify_resp = await client.post(f"{base_url}/auth/login/verify", json={
                "email": test_email,
                "otp": otp
            })
            
            if verify_resp.status_code != 200:
                print(f"FAILED: OTP verification failed with status {verify_resp.status_code}")
                print(verify_resp.text)
                return
                
            auth_data = verify_resp.json()
            token = auth_data.get("token")
            user = auth_data.get("user")
            
            if token and user:
                print(f"SUCCESS: Login complete! Token length: {len(token)}")
                print(f"User Name: {user.get('name')}")
            else:
                print("FAILED: Response missing token or user data")
                
        except Exception as e:
            print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    # Note: This assumes a user 'jane@example.com' with 'password123' exists in the DB.
    # You might need to run a small setup script first if testing on a clean DB.
    asyncio.run(verify_login_flow())
