# CivicRelay

> **Autonomous Civic Resolution Platform & Municipal Dispatch Engine**
> *Report a civic issue once. CivicRelay classifies the hazard, identifies the exact municipal authority, files an official legal-grade complaint, actively monitors repair deadlines, and escalates when statutory service charters are breached.*

---

## The Civic Problem

Traditional city service hotlines and 311 web forms are often passive repositories: citizens submit reports into opaque queues, have no visibility into legal resolution timelines, and receive little accountability when repairs stall.

**CivicRelay shifts civic reporting from passive ticket logging to active resolution enforcement.**
When a citizen reports a pothole, water leak, broken streetlight, or illegal waste dump, CivicRelay's autonomous multi-agent pipeline immediately engages:

1. **Classifies & Verifies**: Evaluates severity and geocodes coordinates.
2. **Maps Jurisdiction**: Identifies the responsible city department and statutory Service Level Agreement (SLA) under municipal charters.
3. **Drafts & Dispatches**: Generates a formal, legal-grade complaint notice and registers an active municipal ticket.
4. **Active SLA Watchdog**: Monitors resolution progress 24/7 with real-time telemetry.
5. **Executive Escalation**: If statutory deadlines elapse without repair, an escalation notice is prepared for executive municipal oversight, keeping the citizen in the loop for final approval.

---

## Key Features

### For Citizens
- **Frictionless Reporting**: File issues in under 30 seconds using text descriptions, photo evidence (with automatic damage detection), or voice notes.
- **Pinpoint Location Accuracy**: Integrated GPS coordinates and street-level reverse geocoding.
- **Live SLA Watchdog**: Real-time countdown showing statutory response time remaining.
- **Formal Legal Notice**: Generates statutory complaint documentation citing local citizen service charters.
- **Interactive Community Map**: Explore city-wide issues grouped into privacy-preserving geographic clusters.
- **Human-in-the-Loop Escalation**: Direct review and approval of executive escalation notices if municipal response times lapse.

### For Municipal Staff & Leadership
- **Executive Command Dashboard**: Real-time KPIs covering total reports, active work orders, SLA adherence rates, and average resolution velocity.
- **Department Benchmarking**: Cross-department comparison identifying resolution bottlenecks.
- **Spatial Heatmaps**: Granular coordinate-level view of infrastructure defect density.
- **Predictive Infrastructure Telemetry**: Linear trend regression alerting engineers before recurring defects or IoT sensor thresholds breach failure limits.

---

## 5-Stage Autonomous Agent Engine

```
Citizen Report ──► [ Triage Agent ] ──► [ Research Agent ] ──► [ Action Agent ]
                        │                     │                     │
                  Severity & Type       Department & SLA     Formal Complaint & Ticket
                                                                    │
                                                                    ▼
                                                            [ Tracking Agent ] (24/7 SLA Watchdog)
                                                                    │
                                                           Deadline Breached?
                                                                    │
                                                                    ▼
                                                           [ Escalation Agent ] (Requires Citizen Approval)
```

1. **Triage Agent**: Inspects problem text and uploaded photo evidence to determine defect classification and hazard severity level. Strands structured-output classification, with a deterministic keyword fallback.
2. **Research Agent**: Cross-references city municipal boundaries to map the exact responsible authority and establishes the guaranteed resolution window. Strands agent + a real `lookup_department_sla` tool, direct-lookup fallback.
3. **Action Agent**: Drafts an official, legal-grade complaint letter and registers the case. Strands-generated complaint text, template fallback.
4. **Tracking Agent**: Runs continuous background sweeps against open tickets to detect SLA deadline breaches.
5. **Escalation Agent**: Drafts high-priority supervisory escalation notices when statutory deadlines expire without field action. Strands-generated escalation text, template fallback.

---

## Project Structure

This repo currently combines the original backend (root-level) with the frontend merged in from a teammate's repo:

```
Civic-Relay/
├── app/                           # FastAPI application package
│   ├── agents/                    # Autonomous agents (Triage, Research, Action, Tracking, Escalation, ...)
│   ├── routers/                   # API endpoints (users, issues, tickets, uploads, analytics, iot, whatsapp, dev)
│   ├── models.py                  # SQLAlchemy database schema
│   ├── schemas.py                 # Pydantic request/response models
│   ├── deps.py                    # Auth & staff-verification guards
│   ├── main.py                    # FastAPI app entry, CORS, router registration, scheduler startup
│   ├── logging_config.py          # Structured JSON/text logging setup
│   ├── middleware.py              # Request ID + access logging middleware
│   ├── db.py                      # SQLAlchemy engine/session
│   └── storage.py                 # S3 client (falls back to local ./uploads)
├── alembic/                       # Database schema migrations
├── scripts/                       # simulate_iot_sensors.py and other utility scripts
├── tests/                         # Pytest suite (53 tests)
├── frontend/                      # React + TypeScript frontend (merged from teammate's repo)
│   ├── public/                    # Static assets (favicon, robots.txt, sitemap)
│   ├── src/
│   │   ├── api/                   # Typed backend client & data adapters (real + mock)
│   │   ├── components/            # UI components (agents, tickets, analytics, map, layout, ui)
│   │   ├── context/                # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/                  # Home, Login, Signup, ReportIssue, IssueDetails, MyIssues,
│   │   │                            CommunityMap, StaffDashboard, Processing, NotFound, ...
│   │   ├── types/                  # TypeScript interfaces
│   │   ├── hooks/                  # usePolling, useSLA
│   │   └── utils/                  # formatters, date, statusMapper, analytics helpers
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── Dockerfile                     # Backend production container definition
├── docker-compose.yml             # Multi-container orchestration (backend + Postgres)
├── .env.example                   # Backend environment variables template
├── alembic.ini
├── pytest.ini
├── requirements.txt
├── requirements-dev.txt
└── README.md
```

> **Note:** unlike the frontend author's original repo (which nested everything under `backend/` and `frontend/`), this repo keeps the backend at the project root — the frontend was merged in as a sibling `frontend/` folder. Any instructions below that say "from the project root" mean the root of *this* repo, not a `backend/` subfolder.

---

## Quick Start

### Prerequisites
- **Python**: 3.10 or newer (tested with Python 3.13)
- **Node.js**: 18.0 or newer (with `npm`)

### Step 1: Set Up & Start the Backend

From the project root:

```bash
# 1. (Optional) Create and activate a virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# 2. Install backend dependencies
pip install -r requirements.txt

# 3. Initialize database schema
alembic upgrade head

# 4. Start the FastAPI backend server
uvicorn app.main:app --reload
```

- **Backend API**: `http://localhost:8000`
- **Interactive API docs (Swagger)**: `http://localhost:8000/docs`
- **Health check**: `http://localhost:8000/health`

By default it uses a local SQLite file (`civicrelay.db`) — zero setup needed. To use Postgres instead, set `DATABASE_URL` (e.g. in a `.env` file):

```
DATABASE_URL=postgresql://user:password@localhost:5432/civicrelay
```

### Step 2: Set Up & Start the Frontend

Open a second terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

- **Web application**: `http://localhost:3000`

Copy `frontend/.env.example` to `frontend/.env` and confirm it points at your backend:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_DEMO_MODE=false
VITE_USE_MOCK_API=false
```

If the browser console shows CORS errors, add `http://localhost:3000` to the backend's `ALLOWED_ORIGINS`.

### Demo / Test Accounts

Two ways to get a working login, depending on which is wired up in your local setup — **verify which applies before a live demo**:

- `POST /dev/reset` (backend dev route, on by default) wipes all data and reseeds one demo user: `demo@civicrelay.io` / `demo1234`, returning its id and a ready-to-use access token. Also returns a staff token for `/analytics/*`.
- The frontend's `/login` screen may additionally reference its own pre-seeded citizen/staff accounts (e.g. from the original frontend repo) — confirm these exist in *this* backend's database before relying on them, since they may not be seeded automatically here.

---

## Running with Docker (production-like local setup)

```bash
cp .env.example .env    # fill in JWT_SECRET_KEY at minimum
docker compose up --build
```

This builds the app image and starts it alongside a real Postgres 16 container (not SQLite) — `docker-compose.yml` runs `alembic upgrade head` automatically on container start before the server boots. The app is at `http://localhost:8000`, healthcheck-gated so Postgres is confirmed ready before the app container is considered healthy.

**Verified:** the app boots correctly against SQLite, and the Postgres driver/URL layer resolves to `psycopg2` and attempts a real TCP connection. **Not verified:** an actual `docker build` + `docker compose up` boot end-to-end — run the two commands above yourselves as a first real test before relying on this for a demo.

---

## Verification & Testing

### Backend unit tests

```bash
pip install -r requirements-dev.txt
pytest
```

Tests run against an isolated in-memory SQLite database and don't need AWS credentials — they exercise the deterministic fallback paths (keyword classifier, lookup table, templates), which is exactly what runs locally without Bedrock configured. 53 tests cover auth, the full report → ticket → escalation → approval → resolve lifecycle, ownership checks, community clustering (including persistence behavior), rate limiting, the municipal API client, health checks, and the triage classifier.

### Frontend production build

```bash
cd frontend
npm run build
```

Compiles TypeScript types and builds optimized production bundles with Vite.

---

## API Contract (for frontend)

Every endpoint except signup and login requires an `Authorization: Bearer <token>` header. Get a token from `/users/login` (or `/dev/reset` for a fast demo token) and attach it to every subsequent request.

**Sign up**
```
POST /users
{ "name": "Sai", "email": "sai@civicrelay.io", "password": "at least something" }
→ 200 { "id": "...", "name": "...", "email": "..." }
→ 409 if that email is already registered
```

**Log in**
```
POST /users/login
{ "email": "sai@civicrelay.io", "password": "..." }
→ 200 { "access_token": "...", "token_type": "bearer" }
→ 401 on wrong email/password
```

**Who am I**
```
GET /users/me   (auth required)
→ 200 UserOut
```

**Upload an issue photo** (optional — call first, pass the returned `image_url` into `POST /issues`)
```
POST /uploads/image   (multipart/form-data, field name "file", auth required)
→ 200 { "image_url": "/uploads/<file>.jpg", "vision_analysis"?: {...} }
```
`vision_analysis` is only present when Bedrock is configured with a vision-capable model.

**Report by voice** (optional — transcribes speech, auto-detects language)
```
POST /uploads/audio   (multipart/form-data, field name "file", auth required)
→ 200 { "transcript": "...", "detected_language": "es-US", "confidence": 0.97 }
→ 503 if voice reporting isn't configured (needs S3_BUCKET + AWS creds)
→ 502 if transcription failed or timed out — fall back to letting them type
```

**Report an issue** — runs Triage → Research → Action synchronously and returns the created ticket.
```
POST /issues   (auth required)
{
  "description": "There is a large pothole near this location.",
  "latitude": 12.34,
  "longitude": 56.78,
  "image_url": "/uploads/....jpg",   // optional
  "language": "es-US",               // optional
  "urgency_hint": "high"             // optional: normal/high/emergency
}
→ 200 IssueOut (includes nested ticket + agent logs, see app/schemas.py)
```

**Dashboard list**
```
GET /issues   (auth required)
→ 200 [IssueOut, ...]
```

**Issue detail (Agent Timeline view)** — 403 if it's not your issue
```
GET /issues/{issue_id}   (auth required)
→ 200 IssueOut  (logs array has agent_name, action, timestamp)
```

**SLA / escalation flow** — all auth required, all 403 if the ticket isn't yours
```
GET  /tickets/{ticket_id}/sla-status
POST /tickets/{ticket_id}/simulate-sla-expiry      (demo button — fast-forwards SLA)
POST /tickets/{ticket_id}/escalate                 (manual override; usually not needed)
POST /tickets/{ticket_id}/approve-escalation        (human approves → status "escalated")
POST /tickets/{ticket_id}/resolve
```

Ticket status flow: `waiting_for_authority` → (SLA exceeded) → `awaiting_approval` → (human approves) → `escalated`. A background job (Tracking Agent) sweeps open tickets every `TRACKING_INTERVAL_SECONDS` (default 30s; lower it for a live demo, e.g. `5`) and drafts an escalation automatically once SLA is exceeded.

**Community issue clustering**
```
GET /issues/clusters → 200 [{ category, center_lat, center_lng, report_count, severity, first_reported, latest_reported, issue_ids }, ...]
```
Only clusters of 2+ reports are returned. Clustering radius is 300m, same category required — tune `CLUSTER_RADIUS_METERS` in `app/agents/clustering.py`.

**Municipal analytics** (staff-only)
```
GET /analytics/overview      → totals, open/resolved/escalated, avg resolution time, SLA compliance %, breakdowns
GET /analytics/trends?days=N → daily issue-report counts, zero-filled gaps
GET /analytics/by-authority  → per-department load and average resolution time
GET /analytics/map           → every individual issue with coordinates (staff view)
```

**Predictive maintenance** (real linear regression + recurrence counting, not a trained ML model)
```
GET /analytics/predictions/sensors?horizon_days=14
GET /analytics/predictions/recurrence?lookback_days=180
```

**Dev tools** (rehearsing the demo without stale data)
```
POST /dev/reset → wipes all users/issues/tickets/logs, reseeds one demo user
  (email demo@civicrelay.io / password demo1234), returns its id AND a ready-to-use access_token
```
On by default; set `ENABLE_DEV_ROUTES=0` to disable before a real deployment.

**WhatsApp webhook** (Meta calls this, not the frontend)
```
GET  /webhooks/whatsapp   - one-time verification handshake
POST /webhooks/whatsapp   - incoming messages, HMAC-signature verified, no JWT
```

---

## Configuration Reference

### Backend (`.env`, project root)

```env
# Database (defaults to local SQLite if omitted)
DATABASE_URL=sqlite:///./civicrelay.db

# Authentication
JWT_SECRET_KEY=your-secret-key-string
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Tracking Agent sweep interval (seconds)
TRACKING_INTERVAL_SECONDS=30

# Staff signup gate (optional)
STAFF_SIGNUP_CODE=any-random-string-you-choose

# IoT ingestion (optional)
IOT_INGEST_API_KEY=any-random-string-you-choose

# WhatsApp reporting (optional — see "WhatsApp reporting setup" below)
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_APP_SECRET=...
WHATSAPP_VERIFY_TOKEN=any-random-string-you-choose

# Municipal Open311 submission (optional — off by default)
MUNICIPAL_API_BASE_URL=https://api.some-city.gov/open311/v2
MUNICIPAL_API_KEY=...
MUNICIPAL_JURISDICTION_ID=somecity.gov

# Real Bedrock/Strands agents (optional — deterministic fallback otherwise)
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Real S3 image storage (optional — local ./uploads otherwise)
S3_BUCKET=civicrelay-issue-images

# Logging
LOG_FORMAT=text   # or json, for CloudWatch/Datadog/ELK
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_DEMO_MODE=false
VITE_USE_MOCK_API=false
```

---

## Rate Limiting

Signup (5/min), login (10/min), issue reporting (10/min), and image upload (10/min) are rate-limited — per authenticated user where possible, per IP for unauthenticated routes. Hitting the limit returns `429 Too Many Requests`. Adjust in the relevant router's `@limiter.limit(...)` decorator if too strict/loose for a demo.

---

## IoT Sensor Monitoring

**Honest limitation:** there's no real civic-infrastructure sensor network to connect to — what's real is the ingestion pipeline itself. `POST /iot/telemetry` is the real webhook a genuine AWS IoT Core rule would call; `scripts/simulate_iot_sensors.py` generates telemetry in the same shape a real device would send.

```bash
export IOT_INGEST_API_KEY=demo-key-12345   # same value on server and simulator
python scripts/simulate_iot_sensors.py
```

Readings are evaluated against deterministic thresholds (`app/agents/sensor_agent.py`), not LLM agents. A breach auto-creates a real Issue + Ticket through the Research → Action pipeline, skipping only Triage. Known sensor types: `pothole_depth_cm`, `streetlight_power_draw_watts`, `water_pipe_pressure_psi`, `waste_bin_fill_percent`.

---

## WhatsApp Reporting Setup

Requires a Meta Developer App with the WhatsApp product added:

1. Create a free app at [developers.facebook.com](https://developers.facebook.com) (type: Business)
2. Add the **WhatsApp** product — Meta gives you a free test phone number automatically
3. Under WhatsApp → API Setup, copy the temporary access token (24h) and the Phone Number ID
4. Expose `/webhooks/whatsapp` over HTTPS somewhere Meta can reach — `localhost` won't work; use [ngrok](https://ngrok.com) for local testing
5. Register that URL as your webhook, along with a Verify Token you make up yourself
6. Add your own phone number (and teammates') as an approved test recipient
7. Get the App Secret from App Settings → Basic (for HMAC signature verification)

Once configured, message the test number and it flows through the same Triage → Research → Action pipeline as a web report. Only text messages currently create a report (audio/image via WhatsApp aren't wired up yet).

---

## What's Real vs Simulated (MVP)

**Real when `BEDROCK_MODEL_ID` + AWS creds are set:** LLM classification via Strands structured output, department/SLA reasoning via a real Strands tool call, complaint generation, escalation drafting, and photo analysis — all through the actual Strands Agents SDK, not a raw API call.

**Real when `S3_BUCKET` + AWS creds are set:** speech-to-text via genuine Amazon Transcribe with automatic language identification.

Every agent falls back automatically (and logs it) to deterministic logic if the call fails or credentials aren't configured — text agents fall back to keyword/template logic; Vision and Voice Agents simply omit their result from the response. Local dev and live demos never hard-crash on a throttle or missing key.

**Always real regardless of AWS config:** authentication (bcrypt + JWT), orchestration, DB storage, escalation drafting → human-approval gate, SLA tracking, community clustering.

**Simulated by default, real if configured:** municipal ticket submission. The Open311 client (`app/agents/municipal_api.py`) is a genuine GeoReport v2 implementation — point `MUNICIPAL_API_BASE_URL` at any real Open311-compliant city and it submits for real.

---

## Production Checklist

Before deploying for real (not needed for the hackathon demo):

- Set `DATABASE_URL` to a real Postgres instance (SQLite is dev-only)
- Set `JWT_SECRET_KEY` to a real random secret (the default is public, in this repo)
- Set `ALLOWED_ORIGINS` to your actual frontend domain(s) (not `*`)
- Set `ENABLE_DEV_ROUTES=0` (`/dev/reset` wipes all data — never expose it live)
- If running more than one app process/replica, set `RUN_BACKGROUND_SCHEDULER=0` on all but one (see comment in `app/main.py`)
- Set `LOG_FORMAT=json` and ship stdout to your log aggregator of choice

---

## License

CivicRelay is released under the MIT License.
