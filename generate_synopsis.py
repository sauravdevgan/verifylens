from fpdf import FPDF
import os

OUTPUT = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop", "VerifyLens_Synopsis.pdf")

class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(18, 18, 18)
        self.rect(0, 0, 210, 14, 'F')
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(200, 140, 60)
        self.set_xy(10, 4)
        self.cell(0, 6, "VerifyLens AI  |  Project Synopsis", ln=False)
        self.set_text_color(150, 150, 150)
        self.set_xy(0, 4)
        self.cell(200, 6, f"Page {self.page_no()}", align="R")
        self.ln(14)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(150, 150, 150)
        self.cell(0, 6, "Confidential  |  VerifyLens AI  |  2026", align="C")

    def cover(self):
        self.set_fill_color(12, 10, 9)
        self.rect(0, 0, 210, 297, 'F')
        self.set_fill_color(234, 88, 12)
        self.rect(0, 88, 210, 4, 'F')
        self.set_xy(0, 98)
        self.set_font("Helvetica", "B", 40)
        self.set_text_color(255, 255, 255)
        self.cell(210, 20, "VerifyLens AI", align="C")
        self.set_xy(0, 121)
        self.set_font("Helvetica", "", 16)
        self.set_text_color(200, 140, 60)
        self.cell(210, 10, "AI-Powered Media Authenticity Detection", align="C")
        self.set_xy(0, 134)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(163, 163, 163)
        self.cell(210, 8, "Project Synopsis  |  March 2026", align="C")
        self.set_draw_color(64, 64, 64)
        self.set_line_width(0.3)
        self.line(40, 150, 170, 150)
        self.set_xy(0, 157)
        self.set_font("Helvetica", "I", 12)
        self.set_text_color(120, 120, 120)
        self.multi_cell(210, 8, "Combating misinformation with cutting-edge\nGemini AI image analysis.", align="C")
        self.set_xy(0, 262)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(80, 80, 80)
        self.cell(210, 6, "Built with FastAPI  |  React  |  Gemini API  |  Razorpay", align="C")
        self.set_xy(0, 269)
        self.cell(210, 6, "Confidential Project Document", align="C")

    def section_title(self, text):
        self.ln(2)
        self.set_fill_color(234, 88, 12)
        self.rect(10, self.get_y(), 3, 7, 'F')
        self.set_x(15)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(20, 20, 20)
        self.cell(0, 7, text, ln=True)
        self.set_draw_color(220, 220, 220)
        self.set_line_width(0.2)
        self.line(10, self.get_y() + 1, 200, self.get_y() + 1)
        self.ln(4)

    def sub_title(self, text):
        self.set_x(10)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(234, 88, 12)
        self.cell(0, 7, text, ln=True)

    def body_text(self, text, indent=10):
        self.set_x(indent)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.multi_cell(190 - (indent - 10), 6, text)
        self.ln(2)

    def bullet(self, items, indent=14):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        for item in items:
            self.set_x(indent)
            self.set_fill_color(234, 88, 12)
            self.ellipse(indent - 0.5, self.get_y() + 2.0, 1.8, 1.8, 'F')
            self.set_x(indent + 4)
            self.multi_cell(190 - indent, 6, item)
        self.ln(1)

    def kv_row(self, key, value):
        self.set_x(14)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(120, 80, 30)
        self.cell(42, 6, key.upper(), ln=False)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(148, 6, value)

    def plan_box(self, name, price, features, x, y, accent):
        w, h = 56, 62
        self.set_fill_color(248, 248, 248)
        self.set_draw_color(*accent)
        self.set_line_width(0.6)
        self.rect(x, y, w, h, 'FD')
        self.set_fill_color(*accent)
        self.rect(x, y, w, 2, 'F')
        self.set_xy(x + 2, y + 5)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*accent)
        self.cell(w - 4, 6, name)
        self.set_xy(x + 2, y + 12)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(60, 60, 60)
        self.cell(w - 4, 6, price)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(80, 80, 80)
        for i, feat in enumerate(features):
            self.set_xy(x + 3, y + 21 + i * 7)
            self.cell(w - 5, 6, "- " + feat)


pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=14)
pdf.set_margins(10, 16, 10)

# PAGE 1: COVER
pdf.add_page()
pdf.cover()

# PAGE 2: OVERVIEW
pdf.add_page()
pdf.section_title("1. Project Overview")
pdf.body_text(
    "VerifyLens AI is a full-stack web application designed to determine whether digital media -- "
    "photographs, screenshots, or AI-generated graphics -- has been artificially created or manipulated. "
    "As synthetic imagery becomes indistinguishable from real content, VerifyLens gives individuals, "
    "journalists, and enterprises a reliable automated authenticity verification tool."
)
pdf.body_text(
    "The platform integrates Google's Gemini 2.5 Flash multimodal AI model via REST API to perform deep "
    "visual analysis on uploaded images, returning a structured verdict, confidence score, and a "
    "detailed breakdown of detected indicators. The experience is delivered through a polished dark-themed "
    "React SPA supported by a high-performance FastAPI backend."
)
pdf.section_title("2. Problem Statement")
pdf.body_text(
    "The proliferation of AI-generated imagery -- powered by tools like Stable Diffusion, Midjourney, "
    "and DALL-E -- has created a significant misinformation risk across news, social media, and legal contexts. "
    "Without accessible detection tools, individuals rely on instinct alone. VerifyLens solves this by making "
    "professional-grade AI analysis available through an intuitive, affordable SaaS interface."
)
pdf.section_title("3. Core Objectives")
pdf.bullet([
    "Provide accurate AI vs. Real classification using state-of-the-art multimodal LLMs.",
    "Deliver a smooth, secure user experience with OTP-based two-factor authentication.",
    "Offer tiered subscription plans to serve both casual and power users.",
    "Enable analysis history tracking, result sharing, and complete account management.",
    "Maintain a clean, scalable architecture ready for cloud deployment."
])
pdf.section_title("4. Technology Stack")
pdf.kv_row("Frontend",   "React 18, React Router v6, Shadcn/UI components, Framer Motion animations")
pdf.kv_row("Backend",    "Python 3.11, FastAPI, Uvicorn ASGI server, Motor (async MongoDB driver)")
pdf.kv_row("Database",   "MongoDB with local JSON file adapter for development / portability")
pdf.kv_row("AI Engine",  "Google Gemini 2.5 Flash -- multimodal REST API for image classification")
pdf.kv_row("Auth",       "JWT (HS256, 7-day expiry), bcrypt password hashing, in-memory OTP store")
pdf.kv_row("Payments",   "Razorpay gateway with HMAC-SHA256 server-side signature verification")
pdf.kv_row("Email",      "Gmail SMTP (SSL, port 465) for OTP delivery and subscription emails")
pdf.kv_row("Design",     "Sunset theme -- warm orange (#f97316) accent on dark (#0c0a09) background")

# PAGE 3: FEATURES
pdf.add_page()
pdf.section_title("5. Key Features")
pdf.sub_title("5.1  Authentication & Security")
pdf.bullet([
    "Two-step login: email + password -> OTP email verification.",
    "Registration: fill details -> receive OTP -> verify -> account created -> auto-login.",
    "Forgot Password: enter email -> receive OTP -> set new password -> automatic login.",
    "Resend OTP button with 60-second cooldown on all OTP entry screens.",
    "JWT tokens (7-day expiry) stored in localStorage; validated on every protected API call.",
    "Password visibility toggle and email-enumeration protection on reset flow."
])
pdf.sub_title("5.2  AI Analysis Engine")
pdf.bullet([
    "Users upload an image (JPEG, PNG, WebP) via the dedicated Analyze page.",
    "Backend base64-encodes image and sends to Gemini 2.5 Flash via direct REST call.",
    "Gemini returns: verdict (AI-Generated / Real / Uncertain), confidence score (0-100%), reasoning, and detailed indicators array.",
    "Results are persisted with a unique share_id for public sharing.",
    "Daily analysis limits enforced per plan; count persists even after deletion."
])
pdf.sub_title("5.3  History & Sharing")
pdf.bullet([
    "History page lists past analyses with thumbnail previews, verdict badges, and timestamps.",
    "Each result has a public share URL (/share/:shareId) -- accessible without login.",
    "A stylized composite scorecard image can be saved or shared to social media.",
    "Analyses can be deleted; deletion does NOT decrement the daily usage counter."
])
pdf.sub_title("5.4  Account & Subscription Management")
pdf.bullet([
    "Account page: profile info, plan badge, next billing date, daily usage progress bar.",
    "Email change requires OTP verification on both old and new email addresses.",
    "Account deletion guarded by OTP confirmation before permanent data removal.",
    "Subscription cancellation schedules end-of-cycle downgrade; plan active for 30 more days.",
    "Plan expiry auto-detected server-side and user downgraded to Free automatically."
])

# PAGE 4: PLANS & ROUTES
pdf.add_page()
pdf.section_title("6. Subscription Plans")
pdf.body_text("VerifyLens operates on a freemium SaaS model with three tiers:")
pdf.ln(3)
y0 = pdf.get_y()
pdf.plan_box("Free",    "Rs. 0 / month",
             ["3 analyses/day", "Standard accuracy", "Standard speed"],
             12, y0, (100, 100, 100))
pdf.plan_box("VIP",     "Rs. 500 / month",
             ["20 analyses/day", "Higher accuracy", "Faster speed", "Priority support"],
             75, y0, (16, 185, 129))
pdf.plan_box("Premium", "Rs. 1000/month",
             ["50 analyses/day", "Max accuracy", "Lightning speed", "24/7 support", "Custom models"],
             138, y0, (139, 92, 246))
pdf.set_y(y0 + 70)
pdf.body_text(
    "Coupon codes reduce the first-month price (e.g. FIRSTTIME saves Rs.200-400). Payments "
    "are processed securely via Razorpay. Subscription confirmation and cancellation emails "
    "are dispatched automatically via Gmail SMTP."
)

pdf.section_title("7. Application Pages")
routes = [
    ("/ (Landing)",       "Marketing hero, feature cards, Sunset theme, CTA."),
    ("/auth",             "Sign In / Sign Up tabs. Forgot Password. OTP verify."),
    ("/dashboard",        "Welcome overview, usage summary, quick-action cards."),
    ("/analyze",          "File upload, validation, Gemini AI analysis submit."),
    ("/result/:id",       "Verdict, confidence gauge, breakdown, share scorecard."),
    ("/history",          "Paginated analyses list with thumbnails and badges."),
    ("/pricing",          "Plan comparison cards with coupon codes and CTAs."),
    ("/checkout/:plan",   "Coupon input, order summary, Razorpay payment."),
    ("/account",          "Profile edit, subscription control, usage meter."),
    ("/share/:shareId",   "Public read-only result page (no login required)."),
]
pdf.set_font("Helvetica", "B", 9)
pdf.set_fill_color(235, 235, 235)
pdf.set_x(10)
pdf.cell(48, 7, "Route", border=1, fill=True)
pdf.cell(142, 7, "Description", border=1, fill=True, ln=True)
pdf.set_font("Helvetica", "", 9)
alt = True
for route, desc in routes:
    pdf.set_fill_color(252, 252, 252) if alt else pdf.set_fill_color(244, 244, 244)
    alt = not alt
    pdf.set_x(10)
    pdf.cell(48, 6, route, border=1, fill=True)
    pdf.cell(142, 6, desc, border=1, fill=True, ln=True)
pdf.ln(3)
pdf.section_title("8. Security Design")
pdf.bullet([
    "Passwords hashed with bcrypt; salts auto-managed.",
    "JWT tokens signed HS256, expire 7 days; validated on every protected request.",
    "OTPs are 6-digit, single-use, expire in 10 minutes, stored in server RAM only.",
    "Forgot-password returns same response to prevent email enumeration.",
    "Razorpay payment signatures verified server-side (HMAC-SHA256) before plan upgrade.",
    "CORS configured to restrict cross-origin access."
])

# PAGE 5: ARCHITECTURE & FUTURE
pdf.add_page()
pdf.section_title("9. System Architecture")
pdf.body_text(
    "VerifyLens follows a clean client-server separation. The React SPA communicates "
    "exclusively over HTTP/JSON with the FastAPI backend. Auth state is managed via "
    "React Context (AuthContext) which hydrates from localStorage on boot."
)
pdf.set_font("Courier", "", 8.5)
pdf.set_text_color(40, 40, 40)
arch_lines = [
    "  +--------------------------------------------------+",
    "  |          USER'S BROWSER  (React SPA)            |",
    "  |  AuthContext | React Router | Axios API client  |",
    "  |  Pages: Landing, Auth, Dashboard, Analyze ...   |",
    "  +--------------------+-----------------------------+",
    "                       |  HTTP/JSON  (port 8000)      ",
    "  +--------------------v-----------------------------+",
    "  |       FastAPI Backend  (Uvicorn ASGI)           |",
    "  |  /api/auth/*  /api/analyses/*  /api/payment/*  |",
    "  |  JWT+bcrypt | Gemini REST | Razorpay SDK        |",
    "  |  Gmail SMTP | local_db (MongoDB adapter)        |",
    "  +--------------------------------------------------+",
]
for line in arch_lines:
    pdf.set_x(12)
    pdf.cell(186, 5.5, line, ln=True)
pdf.ln(4)
pdf.set_font("Helvetica", "", 10)
pdf.set_text_color(50, 50, 50)

pdf.section_title("10. API Endpoint Reference")
endpoints = [
    ("POST",   "/api/auth/send-otp",               "Send registration OTP to email"),
    ("POST",   "/api/auth/register",               "Create account (OTP verified)"),
    ("POST",   "/api/auth/login",                  "Validate credentials, send login OTP"),
    ("POST",   "/api/auth/login/verify",           "Verify OTP, return JWT token"),
    ("POST",   "/api/auth/forgot-password",        "Send password-reset OTP"),
    ("POST",   "/api/auth/forgot-password/verify", "Verify reset OTP"),
    ("POST",   "/api/auth/forgot-password/reset",  "Reset password, auto-login"),
    ("POST",   "/api/auth/resend-otp",             "Resend OTP (login or reset flow)"),
    ("GET",    "/api/auth/me",                     "Return authenticated user profile"),
    ("POST",   "/api/analyses",                    "Upload image, run Gemini analysis"),
    ("GET",    "/api/analyses",                    "List user's analysis history"),
    ("GET",    "/api/analyses/:id",                "Get single analysis detail"),
    ("DELETE", "/api/analyses/:id",                "Delete an analysis record"),
    ("GET",    "/api/share/:shareId",              "Public shared analysis (no auth)"),
    ("POST",   "/api/payment/create-order",        "Create Razorpay order"),
    ("POST",   "/api/payment/verify",              "Verify payment, upgrade user plan"),
    ("POST",   "/api/payment/cancel",              "Schedule subscription cancellation"),
]
pdf.set_font("Helvetica", "B", 8)
pdf.set_fill_color(235, 235, 235)
pdf.set_x(10)
pdf.cell(18, 6.5, "Method", border=1, fill=True)
pdf.cell(80, 6.5, "Endpoint", border=1, fill=True)
pdf.cell(92, 6.5, "Description", border=1, fill=True, ln=True)
method_colors = {"POST": (254,215,170), "GET": (187,247,208), "DELETE": (254,202,202)}
pdf.set_font("Helvetica", "", 8)
for method, ep, desc in endpoints:
    r, g, b = method_colors.get(method, (240,240,240))
    pdf.set_fill_color(r, g, b)
    pdf.set_x(10)
    pdf.cell(18, 5.5, method, border=1, fill=True)
    pdf.set_fill_color(255, 255, 255)
    pdf.cell(80, 5.5, ep, border=1, fill=True)
    pdf.cell(92, 5.5, desc, border=1, fill=True, ln=True)

pdf.ln(4)
pdf.section_title("11. Future Enhancements")
pdf.bullet([
    "Video deepfake detection via sampled-frame analysis.",
    "Browser extension for real-time social media feed verification.",
    "Team / organization accounts with shared analysis quotas.",
    "Webhook API for automated verification pipelines.",
    "Mobile app (React Native) for on-device uploads.",
    "Admin analytics dashboard for platform-wide usage monitoring.",
    "Multi-language UI and RTL layout support."
])

pdf.output(OUTPUT)
print(f"PDF saved to: {OUTPUT}")
