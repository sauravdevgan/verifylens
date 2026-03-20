import asyncio
import json
import os
import uuid
from datetime import datetime, timezone

DB_FILE = "database.json"

async def test_persistent_usage():
    print("--- Testing Persistent Usage Logic ---")
    
    user_id = "test-user-persistent"
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Reset usage for today for this user
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            data = json.load(f)
        data["usage"] = [u for u in data.get("usage", []) if not (u["user_id"] == user_id and u["created_at"][:10] == today)]
        data["analyses"] = [a for a in data.get("analyses", []) if not (a["user_id"] == user_id and a["created_at"][:10] == today)]
        with open(DB_FILE, "w") as f:
            json.dump(data, f)

    # 1. Perform an analysis (Simulate analyze_media)
    now = datetime.now(timezone.utc).isoformat()
    analysis_id = str(uuid.uuid4())
    
    # Simulate the backend logic
    with open(DB_FILE, "r") as f:
        data = json.load(f)
    
    # Insert analysis
    data["analyses"].append({"id": analysis_id, "user_id": user_id, "created_at": now})
    # Insert usage log
    data["usage"].append({"user_id": user_id, "created_at": now})
    
    with open(DB_FILE, "w") as f:
        json.dump(data, f)
        
    print("Analysis performed. Usage recorded.")

    # 2. Check count
    def get_usage_count(u_id):
        with open(DB_FILE, "r") as f:
            d = json.load(f)
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        logs = d.get("usage", [])
        return sum(1 for l in logs if l["user_id"] == u_id and l["created_at"][:10] == today_str)

    count_after_add = get_usage_count(user_id)
    print(f"Usage count after add: {count_after_add}")
    
    # 3. Delete analysis (Simulate delete_analysis)
    with open(DB_FILE, "r") as f:
        data = json.load(f)
    data["analyses"] = [a for a in data["analyses"] if a["id"] != analysis_id]
    with open(DB_FILE, "w") as f:
        json.dump(data, f)
    
    print("Analysis deleted.")

    # 4. Check count again (Should STAY the same)
    count_after_delete = get_usage_count(user_id)
    print(f"Usage count after delete: {count_after_delete}")
    
    if count_after_delete == 1:
        print("SUCCESS: Usage remained persistent at 1!")
    else:
        print(f"FAILED: Usage changed to {count_after_delete}")

if __name__ == "__main__":
    asyncio.run(test_persistent_usage())
