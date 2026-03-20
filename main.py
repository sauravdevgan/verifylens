"""
VeryfyLens — Unified Entry Point
=================================
Run with:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

This single file:
  1. Loads environment variables from app/backend/.env
  2. Imports the fully-configured FastAPI app from app/backend/server.py
     (which includes ALL API endpoints under the /api prefix)
  3. Serves the compiled React frontend (app/frontend/build/) as static files
  4. Adds a catch-all HTML route so React Router works correctly for
     client-side navigation (e.g. /dashboard, /auth, /analyze …)
"""

import sys
import os
from pathlib import Path

# ── 1. Resolve paths ──────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).parent                       # project root
BACKEND_DIR = ROOT_DIR / "app" / "backend"
FRONTEND_BUILD_DIR = ROOT_DIR / "app" / "frontend" / "build"

# ── 2. Load backend .env BEFORE importing server.py ──────────────────────────
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

# ── 3. Add backend to sys.path so relative imports inside server.py work ──────
sys.path.insert(0, str(BACKEND_DIR))

# ── 4. Import the FastAPI app (all /api/* endpoints are already registered) ───
from server import app  # noqa: E402  (must come after sys.path insert)

# ── 5. Serve compiled React static assets ─────────────────────────────────────
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import Request

if FRONTEND_BUILD_DIR.exists():
    # Mount /static to serve JS/CSS/media chunks produced by `npm run build`
    app.mount(
        "/static",
        StaticFiles(directory=str(FRONTEND_BUILD_DIR / "static")),
        name="react-static",
    )

    # ── 6. Serve index.html for every non-API route (React Router support) ────
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_app(request: Request, full_path: str):
        """
        For any path that is NOT an /api/* endpoint, return the React index.html
        so the client-side router can take over.
        """
        index_file = FRONTEND_BUILD_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"detail": "Frontend build not found. Run `npm run build` inside app/frontend/"}

    # Serve root / explicitly as well
    @app.get("/", include_in_schema=False)
    async def serve_root():
        index_file = FRONTEND_BUILD_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"detail": "Frontend not built yet."}

else:
    import logging
    logging.warning(
        "⚠️  Frontend build not found at %s\n"
        "   Run:  cd app/frontend && npm run build\n"
        "   Then restart the server.",
        FRONTEND_BUILD_DIR,
    )
