import json
import os

DB_FILE = "database.json"

def migrate():
    if not os.path.exists(DB_FILE):
        print("No database file, nothing to migrate.")
        return
        
    with open(DB_FILE, "r") as f:
        data = json.load(f)
        
    analyses = data.get("analyses", [])
    usage = data.get("usage", [])
    
    # Keep track of existing usage logs by (user_id, created_at)
    existing_logs = {(u.get("user_id"), u.get("created_at")) for u in usage}
    
    migrated_count = 0
    for a in analyses:
        uid = a.get("user_id")
        created = a.get("created_at")
        if (uid, created) not in existing_logs:
            usage.append({
                "user_id": uid,
                "created_at": created
            })
            existing_logs.add((uid, created))
            migrated_count += 1
            
    if migrated_count > 0:
        data["usage"] = usage
        with open(DB_FILE, "w") as f:
            json.dump(data, f)
        print(f"Migrated {migrated_count} historical analyses to persistent usage logs.")
    else:
        print("No historical analyses needed migration.")

if __name__ == "__main__":
    migrate()
