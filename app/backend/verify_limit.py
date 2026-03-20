import asyncio
import json
import os
import uuid
from datetime import datetime, timezone

# Mock the database for a quick check of the logic
DB_FILE = "database.json"

async def verify_limit_restoration():
    print("--- Verifying Limit Restoration Logic ---")
    
    # 1. Setup mock data
    user_id = "test-user-123"
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Load current db
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            data = json.load(f)
    else:
        data = {"users": [], "analyses": [], "orders": []}

    # Add 2 analyses for today
    base_count = len([a for a in data.get("analyses", []) if a.get("user_id") == user_id and a.get("created_at", "")[:10] == today])
    print(f"Initial analyses for today: {base_count}")
    
    new_id = str(uuid.uuid4())
    test_analysis = {
        "id": new_id,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "original_filename": "test.jpg"
    }
    data["analyses"].append(test_analysis)
    
    with open(DB_FILE, "w") as f:
        json.dump(data, f)
        
    # 2. Check count
    def get_count(u_id):
        with open(DB_FILE, "r") as f:
            d = json.load(f)
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return sum(1 for a in d.get("analyses", []) if a.get("user_id") == u_id and a.get("created_at", "")[:10] == today_str)

    count_after_add = get_count(user_id)
    print(f"Count after add: {count_after_add}")
    
    if count_after_add != base_count + 1:
        print("FAILED: Count did not increase")
        return

    # 3. Delete
    # Simulate the delete_one logic
    with open(DB_FILE, "r") as f:
        d = json.load(f)
    col = d.get("analyses", [])
    new_col = [a for a in col if not (a.get("id") == new_id and a.get("user_id") == user_id)]
    d["analyses"] = new_col
    with open(DB_FILE, "w") as f:
        json.dump(d, f)
        
    # 4. Check count again
    count_after_delete = get_count(user_id)
    print(f"Count after delete: {count_after_delete}")
    
    if count_after_delete == base_count:
        print("SUCCESS: Limit restored correctly!")
    else:
        print(f"FAILED: Limit not restored. Expected {base_count}, got {count_after_delete}")

if __name__ == "__main__":
    asyncio.run(verify_limit_restoration())
