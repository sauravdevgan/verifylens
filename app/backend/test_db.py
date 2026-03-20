import asyncio
from local_db import db

async def main():
    await db.users.insert_one({'id': 'test2', 'password_hash': 'hash'})
    res = await db.users.find_one({'id': 'test2'}, {'password_hash': 0})
    print(res)

asyncio.run(main())
