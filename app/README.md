# VeryfyLens — AI Media Detection App

A full-stack application that detects whether an image or video is AI-generated or real, powered by **Gemini 2.5 Flash** Vision and a local JSON database — no MongoDB required.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔍 **AI Detection** | Gemini 2.5 Flash analyses texture, lighting, faces, edges & more |
| 🛡️ **2-Factor Auth** | Email OTP on every login & registration |
| 📊 **Analysis History** | Browse & delete past results with thumbnail previews |
| 🔗 **Share Results** | Public share links via unique IDs |
| 💳 **Subscription Plans** | Free / VIP / Premium via Razorpay |
| 📧 **Transactional Email** | Styled OTP & subscription emails via Gmail SMTP |
| 🗄️ **Local JSON Database** | Zero external DB dependency — data lives in `app/backend/database.json` |

---

## 🚀 Quick Start (Single Command)

Everything — backend API **and** frontend — runs from one Uvicorn server.

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** & **npm**
- A **Gemini API Key** → [Get one free at Google AI Studio](https://aistudio.google.com/)

---

### Step 1 — Install Python dependencies

```bash
cd app/backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

---

### Step 2 — Configure environment variables

The `.env` file is already located at `app/backend/.env`. Edit the values as needed:

```env
JWT_SECRET=your_super_secret_jwt_key

# Gemini Vision API (required for AI detection)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — Gmail SMTP for real OTP emails (if omitted, OTPs are printed to console)
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Optional — Razorpay for payment flow
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

> **No email/Razorpay keys?** That's fine — the app runs in **mock mode**: OTPs are returned in the API response and shown in the console.

---

### Step 3 — Build the React frontend

```bash
cd app/frontend
npm install --legacy-peer-deps
npm run build
```

This generates `app/frontend/build/` with the compiled static files.

---

### Step 4 — Run the unified server

From the **project root** (`VeryfyLens/`):

```bash
# Make sure your venv is still active
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Open **http://localhost:8000** — the full app (frontend + backend) is live. 🎉

---

## 📁 Project Structure

```
VeryfyLens/
├── main.py                   ← Unified entry point (run this with uvicorn)
└── app/
    ├── backend/
    │   ├── server.py         ← FastAPI app with all /api/* endpoints
    │   ├── local_db.py       ← Lightweight JSON-based database driver
    │   ├── database.json     ← Persistent data store (auto-created)
    │   ├── requirements.txt  ← Python dependencies
    │   └── .env              ← Environment variables (API keys etc.)
    └── frontend/
        ├── src/              ← React source (pages, components, contexts)
        ├── build/            ← Compiled output served by main.py
        └── package.json
```

---

## 🌐 API Endpoints

All endpoints are prefixed with `/api`. Interactive docs available at:

**http://localhost:8000/docs** (Swagger UI)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Send registration OTP |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login (sends OTP) |
| `POST` | `/api/auth/login/verify` | Verify login OTP → JWT |
| `POST` | `/api/auth/forgot-password` | Send password reset OTP |
| `POST` | `/api/auth/forgot-password/verify` | Verify reset OTP |
| `POST` | `/api/auth/forgot-password/reset` | Set new password |
| `POST` | `/api/auth/resend-otp` | Resend OTP |
| `GET` | `/api/auth/usage` | Daily usage stats |
| `PUT` | `/api/auth/profile` | Update name/email |
| `PUT` | `/api/auth/password` | Change password |
| `POST` | `/api/auth/delete-request` | Request account deletion OTP |
| `DELETE` | `/api/auth/delete-confirm` | Confirm account deletion |
| `POST` | `/api/analyze` | Upload & analyse image/video |
| `GET` | `/api/analyses` | List user's analyses |
| `GET` | `/api/analyses/{id}` | Get single analysis |
| `DELETE` | `/api/analyses/{id}` | Delete an analysis |
| `GET` | `/api/share/{share_id}` | Public shared result |
| `POST` | `/api/payment/create-order` | Create Razorpay order |
| `POST` | `/api/payment/verify` | Verify payment & upgrade plan |
| `POST` | `/api/payment/cancel` | Cancel subscription |

---

## 🛠 Troubleshooting

| Issue | Fix |
|---|---|
| **Frontend not loading** | Run `npm run build` inside `app/frontend/` |
| **OTP not arriving** | Check `GMAIL_USER` / `GMAIL_APP_PASSWORD` in `.env`; in mock mode the OTP is in the API response |
| **Gemini errors / low accuracy** | Verify `GEMINI_API_KEY` is valid and has quota |
| **Port in use** | Change `--port 8000` to another port in the uvicorn command |

---

## 🧪 Testing

Backend test scripts (run inside `app/backend/` with venv active):

```bash
python test_full.py          # Full end-to-end: register → login → upload
python test_gemini.py        # Gemini API integration only
python test_auth.py          # Auth flow only
```

---

*© 2026 VeryfyLens AI — Futuristic Photo Verification*
