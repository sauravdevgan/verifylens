import json
import os
from pathlib import Path

# Always resolve the DB file relative to this file's directory (app/backend/)
# so it works correctly when the server is launched from the project root.
DB_FILE = str(Path(__file__).parent / "database.json")

class Cursor:
    def __init__(self, data):
        self.data = data
    def sort(self, field, direction):
        rev = direction == -1
        self.data.sort(key=lambda x: x.get(field, ""), reverse=rev)
        return self
    async def to_list(self, limit):
        return self.data[:limit]

class Collection:
    def __init__(self, name, parent):
        self.name = name
        self.parent = parent

    async def insert_one(self, doc):
        data = self.parent._load()
        if self.name not in data:
            data[self.name] = []
        data[self.name].append(doc)
        self.parent._save(data)
        
    async def find_one(self, query, projection=None):
        data = self.parent._load().get(self.name, [])
        for doc in data:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                res = dict(doc)
                if projection:
                    if projection.get('_id') == 0:
                        res.pop('_id', None)
                    for k in list(res.keys()):
                        if projection.get(k) == 0:
                            if k in res: res.pop(k)
                return res
        return None

    def find(self, query, projection=None):
        data = self.parent._load().get(self.name, [])
        results = []
        for doc in data:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                res = dict(doc)
                if projection and projection.get('_id') == 0:
                    if '_id' in res: res.pop('_id')
                results.append(res)
        return Cursor(results)

    async def delete_one(self, query):
        data = self.parent._load()
        col = data.get(self.name, [])
        new_col = []
        deleted = 0
        for doc in col:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match and deleted == 0:
                deleted = 1
            else:
                new_col.append(doc)
        data[self.name] = new_col
        self.parent._save(data)
        class DeleteResult:
            deleted_count = deleted
        return DeleteResult()

    async def update_one(self, query, update):
        data = self.parent._load()
        col = data.get(self.name, [])
        for doc in col:
            match = all(doc.get(k) == v for k, v in query.items())
            if match:
                if "$set" in update:
                    doc.update(update["$set"])
                break
        data[self.name] = col
        self.parent._save(data)

class LocalDB:
    def __init__(self):
        self.users = Collection("users", self)
        self.analyses = Collection("analyses", self)
        self.orders = Collection("orders", self)
        self.usage = Collection("usage", self)
        if not os.path.exists(DB_FILE):
            self._save({"users": [], "analyses": [], "orders": [], "usage": []})
            
    def _load(self):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {"users": [], "analyses": [], "orders": []}
            
    def _save(self, data):
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f)
            
db = LocalDB()
