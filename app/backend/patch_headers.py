import os

path = r"c:\Users\Asus user\OneDrive\Desktop\project\app\backend\server.py"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Add Header to imports
if "Header" not in text.split("from fastapi")[1].split("\n")[0]:
    text = text.replace("from fastapi import FastAPI, UploadFile, File, HTTPException, Form, APIRouter",
                        "from fastapi import FastAPI, UploadFile, File, HTTPException, Form, APIRouter, Header")

# Replace get_me
text = text.replace('async def get_me(authorization: str = ""):', 'async def get_me(authorization: str = Header("")):')

# Replace others
text = text.replace('async def get_analyses(authorization: str = ""):', 'async def get_analyses(authorization: str = Header("")):')
text = text.replace('async def get_analysis(analysis_id: str, authorization: str = ""):', 'async def get_analysis(analysis_id: str, authorization: str = Header("")):')
text = text.replace('async def delete_analysis(analysis_id: str, authorization: str = ""):', 'async def delete_analysis(analysis_id: str, authorization: str = Header("")):')

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Headers injected successfully!")
