import asyncio
import os
import sys
from pathlib import Path

# Add current directory to path so we can import server
sys.path.append(str(Path(__file__).parent))

from server import send_subscription_email

async def test():
    # Mocking some data for the test
    test_email = "test@example.com"
    user_name = "Jane Doe"
    
    print(f"--- Testing Subscription Success Email for {test_email} ---")
    await send_subscription_email(
        user_email=test_email,
        user_name=user_name,
        plan_name="Premium",
        price="INR 1000",
        start_date="13/03/2026",
        next_billing="12/04/2026",
        type="success"
    )
    
    print(f"\n--- Testing Subscription Cancellation Email for {test_email} ---")
    await send_subscription_email(
        user_email=test_email,
        user_name=user_name,
        plan_name="Premium",
        price="N/A",
        start_date="N/A",
        next_billing="12/04/2026",
        type="cancel"
    )
    
    print("\nTests completed. Check console for MOCK logs or your email inbox if credentials are valid.")

if __name__ == "__main__":
    asyncio.run(test())
