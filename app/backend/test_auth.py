import asyncio
import jwt
from local_db import db

JWT_SECRET = "supersecret_emergent_jwt_key_2024"
JWT_ALGORITHM = "HS256"

async def test():
    try:
        user_id = "0f2745be-b9c7-40cb-989a-0ab84a479b18"
        token = jwt.encode({"user_id": user_id}, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        
        print(f"User found: {user}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test())
