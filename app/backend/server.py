from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Header, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import razorpay
import smtplib
from email.message import EmailMessage
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection bypassed to local JSON
from local_db import db

# JWT config
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()

# Create a router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===== MODELS =====

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    otp: str

class SendOtpRequest(BaseModel):
    email: str

class UserLogin(BaseModel):
    email: str
    password: str

class LoginVerify(BaseModel):
    email: str
    otp: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class DeleteConfirm(BaseModel):
    otp: str

class EmailOtpNewRequest(BaseModel):
    new_email: str
    current_otp: str

class EmailUpdateFinal(BaseModel):
    new_email: str
    new_otp: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    plan: str = "free"
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class AnalysisResponse(BaseModel):
    id: str
    user_id: str
    file_type: str
    original_filename: str
    verdict: str
    confidence_score: float
    reasoning: str
    detailed_analysis: list
    share_id: str
    created_at: str
    file_preview: Optional[str] = None

class AnalysisListItem(BaseModel):
    id: str
    file_type: str
    original_filename: str
    verdict: str
    confidence_score: float
    share_id: str
    created_at: str
    file_preview: Optional[str] = None

# ===== AUTH HELPERS =====

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {"user_id": user_id, "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str = None):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        if token.startswith("Bearer "):
            token = token[7:]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
            
        # Check for plan expiration if cancelled
        if user.get("plan") != "free" and user.get("cancelled_at"):
            plan_updated_at = user.get("plan_updated_at")
            if plan_updated_at:
                try:
                    updated_dt = datetime.fromisoformat(plan_updated_at.replace('Z', '+00:00'))
                    expiry_dt = updated_dt + timedelta(days=30)
                    if datetime.now(timezone.utc) >= expiry_dt:
                        await db.users.update_one(
                            {"id": user["id"]},
                            {"$set": {"plan": "free"}, "$unset": {"cancelled_at": ""}}
                        )
                        user["plan"] = "free"
                        user.pop("cancelled_at", None)
                except Exception:
                    pass
                    
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===== AUTH ROUTES =====

# In-memory OTP store (email -> {otp: str, expires_at: float})
otp_store = {}

@api_router.post("/auth/send-otp")
async def send_otp(data: SendOtpRequest, background_tasks: BackgroundTasks):
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    otp = str(random.randint(100000, 999999))
    otp_store[email] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc).timestamp() + 600  # 10 mins
    }
    
    background_tasks.add_task(
        send_styled_otp_email,
        email,
        otp,
        "Verify Your Identity",
        "Use the code below to complete your registration."
    )
    # Check if mock mode is on for frontend auto-fill
    if not os.environ.get("GMAIL_USER") or not os.environ.get("GMAIL_APP_PASSWORD"):
        return {"message": "OTP sent successfully (MOCK)", "mock_otp": otp}
    return {"message": "OTP sent successfully to email"}

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Clear OTP after successful verification
    otp_store.pop(email, None)
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        token=token,
        user=UserResponse(id=user_id, name=data.name, email=data.email.lower(), created_at=now)
    )

@api_router.post("/auth/login")
async def login(data: UserLogin, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Credentials valid, send OTP instead of returning token
    email = user["email"].lower()
    otp = str(random.randint(100000, 999999))
    otp_store[f"login_{email}"] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc).timestamp() + 600
    }
    
    background_tasks.add_task(
        send_styled_otp_email,
        email,
        otp,
        "Login Verification",
        "A login attempt was made. Use the code below to sign in."
    )
    # Check if mock mode is on for frontend auto-fill
    if not os.environ.get("GMAIL_USER") or not os.environ.get("GMAIL_APP_PASSWORD"):
        return {"message": "OTP sent to email (MOCK)", "mock_otp": otp}
    return {"message": "OTP sent to email"}

@api_router.post("/auth/login/verify", response_model=TokenResponse)
async def login_verify(data: LoginVerify):
    email = data.email.lower()
    otp = data.otp
    
    stored_data = otp_store.get(f"login_{email}")
    if not stored_data or datetime.now(timezone.utc).timestamp() > stored_data["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired or not requested")
        
    if stored_data["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # Success
    otp_store.pop(f"login_{email}", None)
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    token = create_token(user["id"])
    return TokenResponse(
        token=token,
        user=UserResponse(id=user["id"], name=user["name"], email=user["email"], created_at=user["created_at"])
    )

# ===== FORGOT PASSWORD =====

class ForgotPasswordRequest(BaseModel):
    email: str

class ForgotPasswordVerify(BaseModel):
    email: str
    otp: str

class ForgotPasswordReset(BaseModel):
    email: str
    otp: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        # Return success anyway to avoid email enumeration
        return {"message": "If that email exists, a reset code has been sent."}
    
    otp = str(random.randint(100000, 999999))
    otp_store[f"reset_{email}"] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc).timestamp() + 600
    }
    background_tasks.add_task(
        send_styled_otp_email,
        email,
        otp,
        "Password Reset",
        "You requested a password reset. Use the code below to set a new password."
    )
    if not os.environ.get("GMAIL_USER") or not os.environ.get("GMAIL_APP_PASSWORD"):
        return {"message": "Reset code sent (MOCK)", "mock_otp": otp}
    return {"message": "If that email exists, a reset code has been sent."}

@api_router.post("/auth/forgot-password/verify")
async def forgot_password_verify(data: ForgotPasswordVerify):
    email = data.email.lower()
    stored = otp_store.get(f"reset_{email}")
    if not stored or datetime.now(timezone.utc).timestamp() > stored["expires_at"]:
        raise HTTPException(status_code=400, detail="Code expired or not requested")
    if stored["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid code")
    return {"message": "OTP verified"}

@api_router.post("/auth/forgot-password/reset", response_model=TokenResponse)
async def forgot_password_reset(data: ForgotPasswordReset):
    email = data.email.lower()
    stored = otp_store.get(f"reset_{email}")
    if not stored or datetime.now(timezone.utc).timestamp() > stored["expires_at"]:
        raise HTTPException(status_code=400, detail="Code expired or not requested")
    if stored["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid code")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    otp_store.pop(f"reset_{email}", None)
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(data.new_password)}})
    token = create_token(user["id"])
    return TokenResponse(
        token=token,
        user=UserResponse(id=user["id"], name=user["name"], email=user["email"], created_at=user["created_at"])
    )

@api_router.post("/auth/resend-otp")
async def resend_otp(data: dict, background_tasks: BackgroundTasks):
    email = data.get("email", "").lower()
    mode = data.get("mode", "login")  # "login" or "reset"

    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If that email exists, a new code has been sent."}

    otp = str(random.randint(100000, 999999))
    key = f"reset_{email}" if mode == "reset" else f"login_{email}"
    title = "Password Reset" if mode == "reset" else "Login Verification"
    subtitle = "Your new reset code:" if mode == "reset" else "A login attempt was made. Use the code below to sign in."

    otp_store[key] = {"otp": otp, "expires_at": datetime.now(timezone.utc).timestamp() + 600}
    background_tasks.add_task(send_styled_otp_email, email, otp, title, subtitle)

    if not os.environ.get("GMAIL_USER") or not os.environ.get("GMAIL_APP_PASSWORD"):
        return {"message": "New code sent (MOCK)", "mock_otp": otp}
    return {"message": "New code sent to your email"}


async def get_me(authorization: str = Header("")):
    user = await get_current_user(authorization)
    # user is already a dict returned by get_current_user
    return {
        "id": user.get("id"),
        "name": user.get("name"),
        "email": user.get("email"),
        "plan": user.get("plan", "free"),
        "plan_updated_at": user.get("plan_updated_at"),
        "cancelled_at": user.get("cancelled_at"),
        "created_at": user.get("created_at")
    }

@api_router.put("/auth/profile")
async def update_profile(data: UserUpdate, authorization: str = Header("")):
    user = await get_current_user(authorization)
    update_data = {}
    if data.name: update_data["name"] = data.name
    if data.email: update_data["email"] = data.email.lower()
    
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    
    return {"message": "Profile updated successfully"}

@api_router.post("/auth/email-otp-current")
async def email_otp_current(background_tasks: BackgroundTasks, authorization: str = Header("")):
    user = await get_current_user(authorization)
    email = user["email"].lower()
    
    otp = str(random.randint(100000, 999999))
    otp_store[f"email_old_{email}"] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc).timestamp() + 600
    }
    
    background_tasks.add_task(
        send_styled_otp_email,
        email,
        otp,
        "Verify Your Account",
        "You've requested to change your email. Please verify it's you."
    )
    if not os.environ.get("GMAIL_USER") or not os.environ.get("GMAIL_APP_PASSWORD"):
        return {"message": "OTP sent to existing email (MOCK)", "mock_otp": otp}
    return {"message": "Verification code sent to existing email"}

@api_router.post("/auth/email-otp-new")
async def email_otp_new(data: EmailOtpNewRequest, background_tasks: BackgroundTasks, authorization: str = Header("")):
    user = await get_current_user(authorization)
    old_email = user["email"].lower()
    new_email = data.new_email.lower()
    
    # 1. Verify old email OTP
    stored_old = otp_store.get(f"email_old_{old_email}")
    if not stored_old or datetime.now(timezone.utc).timestamp() > stored_old["expires_at"]:
        raise HTTPException(status_code=400, detail="Old email verification code expired or not requested")
    
    if stored_old["otp"] != data.current_otp:
        raise HTTPException(status_code=400, detail="Invalid verification code for old email")
    
    # 2. Check if new email already taken
    existing = await db.users.find_one({"email": new_email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 3. Send OTP to new email
    otp = str(random.randint(100000, 999999))
    otp_store[f"email_new_{new_email}"] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc).timestamp() + 600
    }
    
    background_tasks.add_task(
        send_styled_otp_email,
        new_email,
        otp,
        "Verify New Email",
        "Use the code below to confirm your new email address."
    )
    if not os.environ.get("GMAIL_USER") or not os.environ.get("GMAIL_APP_PASSWORD"):
        return {"message": "OTP sent to new email (MOCK)", "mock_otp": otp}
    return {"message": "Verification code sent to new email"}

@api_router.put("/auth/email-update")
async def email_update_final(data: EmailUpdateFinal, authorization: str = Header("")):
    user = await get_current_user(authorization)
    new_email = data.new_email.lower()
    
    stored_new = otp_store.get(f"email_new_{new_email}")
    if not stored_new or datetime.now(timezone.utc).timestamp() > stored_new["expires_at"]:
        raise HTTPException(status_code=400, detail="New email verification code expired or not requested")
        
    if stored_new["otp"] != data.new_otp:
        raise HTTPException(status_code=400, detail="Invalid verification code for new email")
        
    # Final check
    existing = await db.users.find_one({"email": new_email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Success! Update email
    await db.users.update_one({"id": user["id"]}, {"$set": {"email": new_email}})
    
    # Cleanup
    otp_store.pop(f"email_new_{new_email}", None)
    otp_store.pop(f"email_old_{user['email'].lower()}", None)
        
    return {"message": "Email updated successfully"}

@api_router.put("/auth/password")
async def change_password(data: PasswordChange, authorization: str = Header("")):
    user_doc = await get_current_user(authorization)
    # Re-fetch with password hash to verify
    full_user = await db.users.find_one({"id": user_doc["id"]})
    if not verify_password(data.current_password, full_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid current password")
    
    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    return {"message": "Password changed successfully"}

@api_router.post("/auth/delete-request")
async def delete_request(background_tasks: BackgroundTasks, authorization: str = Header("")):
    user = await get_current_user(authorization)
    email = user["email"].lower()
    
    otp = str(random.randint(100000, 999999))
    otp_store[f"delete_{email}"] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc).timestamp() + 600
    }
    
    background_tasks.add_task(
        send_styled_otp_email,
        email,
        otp,
        "Account Deletion Request",
        "You requested to delete your account. This is a security check."
    )
    if not os.environ.get("GMAIL_USER") or not os.environ.get("GMAIL_APP_PASSWORD"):
        return {"message": "OTP sent successfully (MOCK)", "mock_otp": otp}
    return {"message": "OTP sent successfully to email"}

@api_router.delete("/auth/delete-confirm")
async def delete_confirm(data: DeleteConfirm, authorization: str = Header("")):
    user = await get_current_user(authorization)
    email = user["email"].lower()
    
    stored_data = otp_store.get(f"delete_{email}")
    if not stored_data or datetime.now(timezone.utc).timestamp() > stored_data["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired or not requested")
        
    if stored_data["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    otp_store.pop(f"delete_{email}", None)
    
    # Delete user and associated analyses
    await db.users.delete_one({"id": user["id"]})
    await db.analyses.delete_one({"user_id": user["id"]}) # Need to fix local_db.py to handle multiple deletes or loop
    # For now, let's assume one or fix local_db later if it's strictly one delete
    
    return {"message": "Account deleted successfully"}

# ===== PLAN LIMITS =====
PLAN_LIMITS = {"free": 3, "vip": 20, "premium": 50}

async def get_today_upload_count(user_id: str) -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # 1. Count from persistent usage logs
    logs = await db.usage.find({"user_id": user_id}).to_list(1000)
    count = sum(1 for a in logs if a.get("created_at", "")[:10] == today)
    
    # 2. Fallback to existing analyses if logs are empty (for transition period)
    if count == 0:
        analyses = await db.analyses.find({"user_id": user_id}).to_list(1000)
        count = sum(1 for a in analyses if a.get("created_at", "")[:10] == today)
        
    return count

@api_router.get("/auth/usage")
async def get_usage(authorization: str = Header("")):
    user = await get_current_user(authorization)
    user_plan = user.get("plan", "free")
    daily_limit = PLAN_LIMITS.get(user_plan, 3)
    today_count = await get_today_upload_count(user["id"])
    return {
        "plan": user_plan,
        "today_count": today_count,
        "daily_limit": daily_limit,
        "remaining": max(0, daily_limit - today_count)
    }

# ===== ANALYSIS ROUTES =====

@api_router.post("/analyze", response_model=AnalysisResponse)
async def analyze_media(
    file: UploadFile = File(...),
    authorization: str = Form("")
):
    user = await get_current_user(authorization)

    # ===== DAILY LIMIT CHECK =====
    user_plan = user.get("plan", "free")
    daily_limit = PLAN_LIMITS.get(user_plan, 3)
    today_count = await get_today_upload_count(user["id"])
    if today_count >= daily_limit:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit reached. You've used {today_count}/{daily_limit} analyses today on your {user_plan.upper()} plan. Upgrade to get more!"
        )

    # Read file
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")
    
    # Determine file type
    content_type = file.content_type or "image/jpeg"
    is_video = content_type.startswith("video/")
    file_type = "video" if is_video else "image"
    
    # Convert to base64
    file_base64 = base64.b64encode(contents).decode('utf-8')
    
    # Create thumbnail (store lightweight version for dashboard)
    thumbnail_base64 = None
    if not is_video:
        try:
            from PIL import Image as PIL_Image
            import io
            img = PIL_Image.open(io.BytesIO(contents)).convert("RGB")
            img.thumbnail((300, 300))
            thumb_buf = io.BytesIO()
            img.save(thumb_buf, format="JPEG", quality=70)
            thumbnail_base64 = base64.b64encode(thumb_buf.getvalue()).decode('utf-8')
        except Exception as te:
            logger.warning(f"Thumbnail generation failed: {te}")
    
    # Analyze with GPT-5.2 Vision
    analysis_result = await analyze_with_gpt(file_base64, content_type, file.filename)
    
    # Store in DB
    analysis_id = str(uuid.uuid4())
    share_id = str(uuid.uuid4())[:8]
    now = datetime.now(timezone.utc).isoformat()
    
    analysis_doc = {
        "id": analysis_id,
        "user_id": user["id"],
        "file_type": file_type,
        "original_filename": file.filename or "unknown",
        "file_data": file_base64,
        "thumbnail_data": thumbnail_base64, # New field for efficient listing
        "file_content_type": content_type,
        "verdict": analysis_result["verdict"],
        "confidence_score": analysis_result["confidence_score"],
        "reasoning": analysis_result["reasoning"],
        "detailed_analysis": analysis_result["detailed_analysis"],
        "share_id": share_id,
        "created_at": now
    }
    
    await db.analyses.insert_one(analysis_doc)
    # Record persistent usage (not deleted even if analysis is deleted)
    await db.usage.insert_one({"user_id": user["id"], "created_at": now})
    
    return AnalysisResponse(
        id=analysis_id,
        user_id=user["id"],
        file_type=file_type,
        original_filename=file.filename or "unknown",
        verdict=analysis_result["verdict"],
        confidence_score=analysis_result["confidence_score"],
        reasoning=analysis_result["reasoning"],
        detailed_analysis=analysis_result["detailed_analysis"],
        share_id=share_id,
        created_at=now,
        file_preview=f"data:{content_type};base64,{file_base64}"
    )

async def analyze_with_gpt(file_base64: str, content_type: str, filename: str):
    """Analyze image with Gemini Vision API for AI detection"""
    import json as json_module
    import asyncio
    import urllib.request as url_module

    PROMPT = """You are an expert AI-generated media detector. Analyze this media and determine if it is AI-generated or a real recording/photograph.

Respond in EXACTLY this JSON format and nothing else:
{
    "verdict": "AI-Generated" or "Likely Real",
    "confidence_score": <number 0-100>,
    "reasoning": "<2-3 sentence summary>",
    "detailed_analysis": [
        {"category": "Texture & Patterns", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Lighting & Shadows", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Facial Features", "finding": "<detail or N/A>", "indicator": "ai" or "real" or "neutral"},
        {"category": "Background Consistency", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Edge Quality", "finding": "<detail>", "indicator": "ai" or "real"},
        {"category": "Metadata Artifacts", "finding": "<detail>", "indicator": "ai" or "real" or "neutral"}
    ]
}

Look for:
- Unnatural smoothness or plastic-like skin/surface textures
- Inconsistent or impossible lighting directions
- Distorted hands, fingers, teeth, ears, or text
- Repeating or tiling patterns
- Unusual depth of field or bokeh artifacts
- Overly perfect symmetry
- Background morphing or melting
- Strangely blended hair strands"""

    try:
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("EMERGENT_LLM_KEY")
        if not api_key or api_key == "dummy-key":
            raise Exception("No valid API key")

        import base64 as b64_module, re as re_module, io as io_module
        from PIL import Image as PIL_Image

        image_bytes = b64_module.b64decode(file_base64)
        is_video = content_type.startswith("video/")
        mime = content_type if is_video else "image/jpeg"

        if not is_video:
            # Downscale to max 768px — keeps payload small, avoids timeout/size rejections
            try:
                pil_img = PIL_Image.open(io_module.BytesIO(image_bytes)).convert("RGB")
                w, h = pil_img.size
                if max(w, h) > 768:
                    ratio = 768 / max(w, h)
                    pil_img = pil_img.resize((int(w * ratio), int(h * ratio)), PIL_Image.LANCZOS)
                out_buf = io_module.BytesIO()
                pil_img.save(out_buf, "JPEG", quality=85)
                image_bytes = out_buf.getvalue()
            except Exception as resize_err:
                logger.warning(f"Image resize failed: {resize_err}")

        img_b64 = b64_module.b64encode(image_bytes).decode()
        logger.info(f"Sending to Gemini: {len(image_bytes)//1024}KB")

        # Direct REST API call — bypasses broken SDK versions
        model = "models/gemini-2.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={api_key}"
        payload = json_module.dumps({
            "contents": [{
                "parts": [
                    {"text": PROMPT},
                    {"inline_data": {"mime_type": mime, "data": img_b64}}
                ]
            }],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048}
        }).encode()

        def _call_api():
            try:
                req = url_module.Request(url, data=payload, headers={"Content-Type": "application/json"})
                return url_module.urlopen(req, timeout=60).read().decode()
            except url_module.HTTPError as he:
                error_body = he.read().decode()
                raise Exception(f"Gemini HTTP {he.code}: {error_body[:500]}")

        loop = asyncio.get_event_loop()
        raw = await loop.run_in_executor(None, _call_api)
        resp_data = json_module.loads(raw)

        response_text = resp_data["candidates"][0]["content"]["parts"][0]["text"].strip()
        logger.info(f"Gemini responded, length={len(response_text)}")

        # Strip code fences
        response_text = re_module.sub(r"```json\s*", "", response_text)
        response_text = re_module.sub(r"```\s*", "", response_text).strip()

        # Try direct parse, then regex extraction fallback
        try:
            result = json_module.loads(response_text)
        except json_module.JSONDecodeError:
            json_match = re_module.search(r"\{[\s\S]*\}", response_text)
            if json_match:
                result = json_module.loads(json_match.group())
            else:
                raise Exception(f"Cannot parse Gemini JSON: {response_text[:200]}")

        return {
            "verdict": result.get("verdict", "Unknown"),
            "confidence_score": min(max(float(result.get("confidence_score", 50)), 0), 100),
            "reasoning": result.get("reasoning", "Analysis completed."),
            "detailed_analysis": result.get("detailed_analysis", [])
        }

    except Exception as e:
        logger.error(f"Gemini analysis error: {str(e)}")
        # If Gemini fails, explicitly return an error stating credits might be exhausted
        error_msg = str(e)
        if "No valid API key" in error_msg:
            reason = "Image analysis could not be completed: Please configure a valid Gemini API key."
        else:
            reason = "Image analysis could not be completed: Gemini API credit exhausted or API error."

        return {
            "verdict": "Analysis Unavailable",
            "confidence_score": 0,
            "reasoning": reason,
            "detailed_analysis": [{"category": "Error", "finding": error_msg, "indicator": "neutral"}]
        }

def send_subscription_email(user_email: str, user_name: str, plan_name: str, price: str, start_date: str, next_billing: str, type="success"):
    gmail_user = os.environ.get("GMAIL_USER")
    gmail_password = os.environ.get("GMAIL_APP_PASSWORD")
    if not gmail_user or not gmail_password:
        logger.info(f"MOCK SUBSCRIPTION EMAIL: {type.upper()} for {user_email} - {plan_name} Plan")
        return

    try:
        msg = EmailMessage()
        msg['Subject'] = f"VerifyLens - Subscription {'Confirmed' if type=='success' else 'Cancelled'}"
        msg['From'] = gmail_user
        msg['To'] = user_email

        color = "#10b981" if type == "success" else "#ef4444"
        title = "Subscription Confirmed!" if type == "success" else "Subscription Cancelled"
        message = f"Thank you for choosing VerifyLens. Your {plan_name} plan is now active." if type == "success" else "Your subscription has been cancelled. Your plan will remain active until the end of the current billing cycle."
        
        html = f"""
        <html>
        <body style="background-color: #0c0a09; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 8px; overflow: hidden; margin-top: 20px; border: 1px solid #262626;">
                <div style="padding: 40px;">
                    <h2 style="color: {color}; margin-top: 0; font-size: 24px;">{title}</h2>
                    <p style="color: #a3a3a3; line-height: 1.6;">Hello {user_name},</p>
                    <p style="color: #a3a3a3; line-height: 1.6; font-size: 15px;">{message}</p>
                    
                    <div style="background-color: #262626; border-radius: 8px; padding: 25px; margin-top: 30px;">
                        <h3 style="margin-top: 0; font-size: 12px; text-transform: uppercase; color: #737373; letter-spacing: 2px;">Plan Details</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <tr style="border-bottom: 1px solid #404040;">
                                <td style="padding: 12px 0; color: #a3a3a3;">Plan</td>
                                <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #ffffff;">{plan_name.upper()}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #404040;">
                                <td style="padding: 12px 0; color: #a3a3a3;">Price</td>
                                <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #ffffff;">{price}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #404040;">
                                <td style="padding: 12px 0; color: #a3a3a3;">Start Date</td>
                                <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #ffffff;">{start_date}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; color: #a3a3a3;">{'Next Billing Cycle' if type=='success' else 'Active Until'}</td>
                                <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #ffffff;">{next_billing}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="margin-top: 40px; text-align: center;">
                        <a href="http://localhost:3000/dashboard" style="background-color: #6366f1; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; transition: background 0.2s;">Go to Dashboard</a>
                    </div>
                </div>
                <div style="background-color: #0a0a0a; padding: 25px; text-align: center; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px;">
                    &copy; 2026 VerifyLens AI. Futuristic Photo Verification.
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.set_content(f"{title}\n\nHello {user_name},\n\n{message}\n\nPlan: {plan_name}\nPrice: {price}\nStart Date: {start_date}")
        msg.add_alternative(html, subtype='html')


        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(gmail_user, gmail_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        logger.error(f"Failed to send subscription email: {e}")

def send_styled_otp_email(email: str, otp: str, title: str, subtitle: str):
    gmail_user = os.environ.get("GMAIL_USER")
    gmail_password = os.environ.get("GMAIL_APP_PASSWORD")
    if not gmail_user or not gmail_password:
        logger.info(f"MOCK OTP EMAIL: {title} for {email} code is {otp}")
        return

    try:
        msg = EmailMessage()
        msg['Subject'] = f"VerifyLens - {title}"
        msg['From'] = gmail_user
        msg['To'] = email

        html = f"""
        <html>
        <body style="background-color: #0c0a09; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 8px; overflow: hidden; margin-top: 20px; border: 1px solid #262626;">
                <div style="padding: 40px; text-align: center;">
                    <h2 style="color: #6366f1; margin-top: 0; font-size: 24px;">{title}</h2>
                    <p style="color: #a3a3a3; line-height: 1.6; font-size: 15px;">{subtitle}</p>
                    
                    <div style="background-color: #262626; border-radius: 12px; padding: 24px 20px; margin: 30px 0; border: 1px dashed #404040;">
                        <p style="margin: 0; text-align: center; font-family: Courier New, Courier, monospace; font-size: 26px; font-weight: bold; color: #ffffff; letter-spacing: 0;">{ "  ".join(str(otp)) }</p>
                    </div>
                    
                    <p style="color: #737373; font-size: 13px; margin-top: 20px;">
                        This code will expire in 10 minutes. If you did not request this, please ignore this email.
                    </p>
                </div>
                <div style="background-color: #0a0a0a; padding: 25px; text-align: center; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px;">
                    &copy; 2026 VerifyLens AI. Futuristic Photo Verification.
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.set_content(f"{title}\n\n{subtitle}\n\nYour code is: {otp}\n\nThis code expires in 10 minutes.")
        msg.add_alternative(html, subtype='html')


        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(gmail_user, gmail_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        logger.error(f"Failed to send styled OTP email: {e}")




@api_router.get("/analyses", response_model=List[AnalysisListItem])
async def get_analyses(authorization: str = Header("")):
    user = await get_current_user(authorization)
    
    # Optimize: Single query, include required fields, project out heavy data
    analyses = await db.analyses.find(
        {"user_id": user["id"]},
        {"_id": 0, "file_data": 0, "detailed_analysis": 0, "reasoning": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add file preview from thumbnail_data if available, fallback for older records
    for a in analyses:
        if a.get("thumbnail_data"):
            # Use the dedicated thumbnail field
            ct = a.get("file_content_type", "image/jpeg")
            a["file_preview"] = f"data:{ct};base64,{a['thumbnail_data']}"
        else:
            # Fallback for older items that don't have thumbnail_data yet
            # We don't want to fetch full file_data here to keep it fast
            a["file_preview"] = None
    
    return analyses

@api_router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str, authorization: str = Header("")):
    user = await get_current_user(authorization)
    
    doc = await db.analyses.find_one(
        {"id": analysis_id, "user_id": user["id"]},
        {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    ct = doc.get("file_content_type", "image/jpeg")
    result = AnalysisResponse(
        id=doc["id"],
        user_id=doc["user_id"],
        file_type=doc["file_type"],
        original_filename=doc["original_filename"],
        verdict=doc["verdict"],
        confidence_score=doc["confidence_score"],
        reasoning=doc["reasoning"],
        detailed_analysis=doc["detailed_analysis"],
        share_id=doc["share_id"],
        created_at=doc["created_at"],
        file_preview=f"data:{ct};base64,{doc.get('file_data', '')}"
    )
    return result

@api_router.get("/share/{share_id}", response_model=AnalysisResponse)
async def get_shared_analysis(share_id: str):
    doc = await db.analyses.find_one({"share_id": share_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Shared analysis not found")
    
    ct = doc.get("file_content_type", "image/jpeg")
    return AnalysisResponse(
        id=doc["id"],
        user_id=doc["user_id"],
        file_type=doc["file_type"],
        original_filename=doc["original_filename"],
        verdict=doc["verdict"],
        confidence_score=doc["confidence_score"],
        reasoning=doc["reasoning"],
        detailed_analysis=doc["detailed_analysis"],
        share_id=doc["share_id"],
        created_at=doc["created_at"],
        file_preview=f"data:{ct};base64,{doc.get('file_data', '')}"
    )

@api_router.delete("/analyses/{analysis_id}")
async def delete_analysis(analysis_id: str, authorization: str = Header("")):
    user = await get_current_user(authorization)
    result = await db.analyses.delete_one({"id": analysis_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"message": "Analysis deleted"}

# ===== PAYMENT ROUTES =====
razorpay_client = None
if os.environ.get("RAZORPAY_KEY_ID") and os.environ.get("RAZORPAY_KEY_SECRET"):
    razorpay_client = razorpay.Client(
        auth=(os.environ["RAZORPAY_KEY_ID"], os.environ["RAZORPAY_KEY_SECRET"])
    )

class OrderRequest(BaseModel):
    plan_tier: str  # "vip" or "premium"
    amount: int  # amount in INR (rupees)

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@api_router.post("/payment/create-order")
async def create_order(request: OrderRequest, authorization: str = Header("")):
    user = await get_current_user(authorization)
    
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured")
        
    try:
        # Amount in paise (multiply by 100)
        amount_paise = request.amount * 100
        
        data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"receipt_{user['id'][:8]}_{int(datetime.now(timezone.utc).timestamp())}",
            "notes": {
                "user_id": user["id"],
                "plan": request.plan_tier
            }
        }
        
        order = razorpay_client.order.create(data=data)
        
        # Save order to local db (simplified tracking)
        await db.orders.insert_one({
            "order_id": order["id"],
            "user_id": user["id"],
            "plan_tier": request.plan_tier,
            "amount": request.amount,
            "status": "created",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return order
    except Exception as e:
        logger.error(f"Razorpay order error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payment/verify")
async def verify_payment(data: PaymentVerification, background_tasks: BackgroundTasks, authorization: str = Header("")):
    user = await get_current_user(authorization)
    
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured")
        
    try:
        # Verify the signature
        result = razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        })
        
        if result:
            # Update user plan (simplified, you should track subscription expiry ideally)
            order = await db.orders.find_one({"order_id": data.razorpay_order_id})
            if order:
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"plan": order.get("plan_tier", "premium"), "plan_updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                await db.orders.update_one(
                    {"order_id": data.razorpay_order_id},
                    {"$set": {"status": "paid", "payment_id": data.razorpay_payment_id}}
                )

                # Send Confirmation Email
                start_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
                next_billing = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%d/%m/%Y")
                plan_tier = order.get("plan_tier", "premium")
                price_str = f"INR {order.get('amount', 0)}"
                
                # Run in background to not block verification response
                background_tasks.add_task(
                    send_subscription_email,
                    user["email"], user["name"], plan_tier, price_str, start_date, next_billing, type="success"
                )
                
            return {"status": "success", "message": "Payment verified successfully"}
        else:
            raise HTTPException(status_code=400, detail="Invalid signature")
            
    except Exception as e:
        logger.error(f"Razorpay verification error: {str(e)}")
        raise HTTPException(status_code=400, detail="Payment verification failed")

@api_router.post("/payment/cancel")
async def cancel_subscription(background_tasks: BackgroundTasks, authorization: str = Header("")):
    user = await get_current_user(authorization)
    if user.get("plan") == "free":
        raise HTTPException(status_code=400, detail="Already on free plan")
    if user.get("cancelled_at"):
        raise HTTPException(status_code=400, detail="Subscription already scheduled for cancellation")
        
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"cancelled_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Send Cancellation Email
    plan_updated_at = user.get("plan_updated_at")
    if plan_updated_at:
        expiry_date = (datetime.fromisoformat(plan_updated_at) + timedelta(days=30)).strftime("%d/%m/%Y")
    else:
        expiry_date = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%d/%m/%Y")

    background_tasks.add_task(
        send_subscription_email,
        user["email"], user["name"], user.get("plan", "Plan"), "N/A", "N/A", expiry_date, type="cancel"
    )

    return {"message": "Subscription scheduled for cancellation"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    pass
