# CivicRelay Backend

FastAPI backend + multi-agent pipeline (Triage → Research → Action → Tracking → Escalation).

## Setup

```bash
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs on `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

By default it uses a local SQLite file (`civicrelay.db`) - zero setup needed.
To use Postgres instead, set `DATABASE_URL` (e.g. in a `.env` file):

```
DATABASE_URL=postgresql://user:password@localhost:5432/civicrelay
```

To control how often the background Tracking Agent sweep runs (default 30s):

```
TRACKING_INTERVAL_SECONDS=30
```

To sign auth tokens with your own secret instead of the (insecure) built-in
dev default - required before any real deployment, optional for local dev:

```
JWT_SECRET_KEY=some-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

To enable citizens reporting directly via WhatsApp instead of the web app -
optional, requires a Meta Developer App with the WhatsApp product added
(see "WhatsApp reporting setup" below for how to get these):

```
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_APP_SECRET=...
WHATSAPP_VERIFY_TOKEN=any-random-string-you-choose
```

To enable IoT sensor auto-reporting - optional, and note there's no real
sensor hardware to connect to (see "IoT sensor monitoring" below):

```
IOT_INGEST_API_KEY=any-random-string-you-choose
```

To let a signup grant municipal staff access (unlocks `/analytics/*`) -
optional, and required for `STAFF_SIGNUP_CODE`-gated signup to work at all:

```
STAFF_SIGNUP_CODE=any-random-string-you-choose
```

To submit real service requests to a municipal Open311 (GeoReport v2) API
instead of a locally generated reference - optional, and off by default:

```
MUNICIPAL_API_BASE_URL=https://api.some-city.gov/open311/v2
MUNICIPAL_API_KEY=...                    # if the jurisdiction requires one
MUNICIPAL_JURISDICTION_ID=somecity.gov   # only needed for multi-jurisdiction endpoints
```
Open311 is a real, standardized API many cities implement (SF, Chicago, DC,
Toronto, and others), but there's no single universal endpoint - each city
runs its own, often behind its own API key, and `service_code` values are
defined per-city. Fetch a target city's real codes from its own
`/services.json` and set `SERVICE_CODE_ROAD` / `SERVICE_CODE_WASTE` /
`SERVICE_CODE_WATER` / `SERVICE_CODE_ELECTRICAL` / `SERVICE_CODE_OTHER`
accordingly (see `app/agents/municipal_api.py`). Without this configured,
behavior is unchanged from before: a locally generated `CIV-XXXX` reference.

## Rate limiting

Signup (5/min), login (10/min), issue reporting (10/min), and image upload
(10/min) are all rate-limited - per authenticated user where possible
(decoded from the token), per IP for unauthenticated routes like signup and
login. Hitting the limit returns `429 Too Many Responses`. No setup needed;
adjust the numbers in the relevant router file's `@limiter.limit(...)`
decorator if they're too strict/loose for the demo.

## Running the tests

```bash
pip install -r requirements-dev.txt
pytest
```

Tests run against an isolated in-memory SQLite database (not your real
`civicrelay.db`) and don't need AWS credentials - they exercise the
deterministic fallback paths (keyword classifier, lookup table, templates),
which is exactly what runs locally without Bedrock configured anyway. 53
tests cover auth, the full report → ticket → escalation → approval →
resolve lifecycle, ownership checks, community clustering (including
persistence behavior), rate limiting, the municipal API client, health
checks, and the triage classifier (including two real bugs this suite would
have caught: the "streetlight on main road" miscategorization and the
"hole" keyword gap).

## Running with Docker (production-like local setup)

```bash
cp .env.example .env    # fill in JWT_SECRET_KEY at minimum
docker compose up --build
```

This builds the app image and starts it alongside a real Postgres 16
container (not SQLite) - `docker-compose.yml` runs `alembic upgrade head`
automatically on container start before the server boots. The app is at
`http://localhost:8000`, healthcheck-gated so Postgres is confirmed ready
before the app container is considered healthy.

**What I could verify without Docker installed in my own environment:**
the app boots correctly with all this session's changes (structured
logging, request middleware, health check) against SQLite, and the
Postgres driver/URL layer itself is correct - `DATABASE_URL=postgresql://...`
resolves to `psycopg2` and attempts a real TCP connection (verified failing
only with "connection refused" when no server is present, not a
driver/config error). **What I could not verify myself:** an actual
`docker build` + `docker compose up` boot, since Docker isn't available in
my execution environment. Please run the two commands above yourselves as
a first real test before relying on this for the demo.

## Logging

`LOG_FORMAT=json` (recommended for any real deployment - parseable by
CloudWatch/Datadog/ELK) or `LOG_FORMAT=text` (default, human-readable for
local dev). Every request gets an 8-character request ID, returned as an
`X-Request-ID` response header and attached to every log line emitted while
that request is being handled - useful for tracing one report's full path
through Triage → Research → Action in the logs.

## Production checklist

Before deploying for real (not needed for the hackathon demo):
- Set `DATABASE_URL` to a real Postgres instance (SQLite is dev-only)
- Set `JWT_SECRET_KEY` to a real random secret (the default is public, in this repo)
- Set `ALLOWED_ORIGINS` to your actual frontend domain(s) (not `*`)
- Set `ENABLE_DEV_ROUTES=0` (`/dev/reset` wipes all data - never expose it live)
- If running more than one app process/replica, set `RUN_BACKGROUND_SCHEDULER=0`
  on all but one of them (see comment in `app/main.py`) - otherwise every
  replica runs its own independent Tracking Agent sweep, each drafting
  escalations for the same tickets redundantly
- Set `LOG_FORMAT=json` and ship stdout to your log aggregator of choice

## WhatsApp reporting setup

Requires a Meta Developer App with the WhatsApp product added - this needs
a one-time account setup on Meta's side that only you (not this codebase)
can do:

1. Create a free app at [developers.facebook.com](https://developers.facebook.com) (type: Business)
2. Add the **WhatsApp** product - Meta gives you a free test phone number automatically
3. Under WhatsApp → API Setup, copy the temporary access token (24h, fine for testing) and the Phone Number ID
4. Expose this app's `/webhooks/whatsapp` endpoint over HTTPS somewhere Meta can reach it - `localhost` won't work; use [ngrok](https://ngrok.com) for local testing or a real deployment
5. In the app dashboard, register that URL as your webhook, along with a Verify Token you make up yourself (any string) - this triggers the one-time GET verification handshake this app handles automatically
6. Under WhatsApp → API Setup, add your own phone number (and teammates') as an approved test recipient - required before Meta will deliver messages to it in test mode
7. Get the App Secret from App Settings → Basic - used to verify that incoming webhooks genuinely came from Meta (HMAC signature check)

Once configured (the 4 env vars above), message the test number and it
flows through the exact same Triage → Research → Action pipeline as a web
report, then replies with the category, severity, and ticket reference.
Location messages get a reply asking for a text description too - only text
messages currently create a report (audio/image via WhatsApp aren't wired
up yet, though the architecture supports adding them - see
`app/agents/whatsapp_client.py`).

## IoT sensor monitoring

**Honest limitation up front:** there is no real civic-infrastructure
sensor network for this project to connect to - no real pothole-depth or
water-pressure sensors exist for a hackathon project to receive data from.
What's real is the ingestion pipeline itself, built the way an actual
system would work: `POST /iot/telemetry` is the real webhook a genuine AWS
IoT Core rule (device → MQTT → IoT Core → IoT Rule → Lambda/HTTP action)
would call. `scripts/simulate_iot_sensors.py` generates telemetry in the
same shape a real device would send, standing in for hardware that doesn't
exist.

```bash
export IOT_INGEST_API_KEY=demo-key-12345   # same value on server and simulator
python scripts/simulate_iot_sensors.py
```

Sensor readings are evaluated against deterministic thresholds (see
`app/agents/sensor_agent.py`) - not the LLM/Strands agents, since a water
pressure reading crossing 20 psi is a fact, not a judgment call. A reading
past its threshold auto-creates a real Issue + Ticket through the same
Research → Action pipeline as a citizen report, skipping only the Triage
step (category/severity are already known from the sensor type). Repeated
breaches from the same sensor don't spam duplicate issues - they're logged
against the existing open case instead.

Known sensor types: `pothole_depth_cm`, `streetlight_power_draw_watts`,
`water_pipe_pressure_psi`, `waste_bin_fill_percent` - add more in
`SENSOR_TYPE_RULES`.

## Municipal analytics dashboards

Unlike everything else in this list, this needs no external service or
account - it's pure aggregation over data CivicRelay already has. Staff-only
(citizens are correctly 403'd - see `STAFF_SIGNUP_CODE` above to create a
staff account, or use `/dev/reset`'s `staff_access_token` for testing):

```
GET /analytics/overview      → totals, open/resolved/escalated, avg resolution time,
                                 SLA compliance %, breakdowns by category/severity/source
GET /analytics/trends?days=N → daily issue-report counts, continuous series (zero-filled gaps)
GET /analytics/by-authority  → per-department load and average resolution time
GET /analytics/map           → every individual issue with coordinates (granular staff
                                 view - contrast with the public /issues/clusters, which
                                 only shows grouped clusters of 2+ reports, no per-issue detail)
```

`by_source` in the overview ties directly into IoT monitoring above -
citizen reports and sensor-detected issues show up side by side, so a city
can see how much of its issue volume is self-reported by sensors versus
citizens.

## Predictive maintenance

**Honest framing up front:** this is real statistics on real stored data
(ordinary least-squares linear regression + recurrence counting) - not a
trained ML model. Worth saying plainly rather than letting "predictive"
imply more sophistication than is actually here.

```
GET /analytics/predictions/sensors?horizon_days=14   → sensors whose reading history trend
                                                          is projected to cross their failure
                                                          threshold soon, sorted most-urgent-first
GET /analytics/predictions/recurrence?lookback_days=180 → locations where a resolved issue
                                                            recurred afterward - a signal the
                                                            underlying infrastructure, not just
                                                            the symptom, needs attention
```

Every sensor telemetry reading is now persisted (`sensor_readings` table,
not just the latest value) - `/iot/telemetry` writes one on every call
regardless of whether that particular reading crosses a threshold, since
the "normal" readings are exactly what a trend is built from. Trend
prediction requires at least 5 stored readings spread over at least an
hour of real time (see `MIN_READINGS_FOR_TREND` in
`app/agents/predictive_agent.py`) - below that, a "trend" is statistical
noise, not a signal, and the endpoint correctly returns nothing rather than
guessing. Verified live: fed 6 real readings through the actual
`/iot/telemetry` endpoint (a pothole deepening from 1.0cm to 4.0cm, never
crossing the 5cm issue threshold - zero active issues existed), and the
prediction endpoint correctly forecast a breach in ~3.3 days from the real
linear trend, catching it before any citizen report or threshold-crossing
alert would have.



Then apply the schema with Alembic (works the same for SQLite or Postgres):

```bash
alembic upgrade head
```

Whenever you change a model in `app/models.py`, generate a new migration
instead of relying on auto-create:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

To enable real Bedrock calls through the Strands Agents SDK (optional -
without this the app runs on deterministic fallback logic: keyword
classification, a lookup table, and templates - see "What's real vs
simulated" below):

```
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

To enable real S3 image storage (optional - without this, uploaded images
are saved locally to `./uploads` and served from `/uploads/<file>`, so the
app works fully offline):

```
S3_BUCKET=civicrelay-issue-images
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## API contract (for frontend)

**WhatsApp webhook** (Meta calls this, not your frontend) - not part of the
frontend contract, but worth knowing it exists:
```
GET  /webhooks/whatsapp   - Meta's one-time verification handshake
POST /webhooks/whatsapp   - incoming messages, HMAC-signature verified, no JWT
```

Every endpoint except signup and login requires an `Authorization: Bearer <token>`
header. Get a token from `/users/login` (or `/dev/reset` for a fast demo token)
and attach it to every subsequent request.

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
Store the token (e.g. localStorage) and send it as `Authorization: Bearer <token>`
on every request below.

**Who am I**
```
GET /users/me   (auth required)
→ 200 UserOut
```

**Upload an issue photo** (optional - call this first, then pass the returned
`image_url` into `POST /issues`)
```
POST /uploads/image   (multipart/form-data, field name "file", auth required)
→ 200 { "image_url": "/uploads/<file>.jpg", "vision_analysis"?: { shows_genuine_issue, visible_description, assessed_severity } }
```
`vision_analysis` is only present when Bedrock is configured with a
vision-capable model - a real Strands vision call looks at the photo itself.
Omitted (not null) otherwise, so just check for the key.

**Report by voice** (optional - transcribes speech in any of ~12 candidate
languages, auto-detecting which one; call this first, then pass the
returned `transcript` as `description` and `detected_language` as
`language` into `POST /issues`)
```
POST /uploads/audio   (multipart/form-data, field name "file", auth required)
→ 200 { "transcript": "...", "detected_language": "es-US", "confidence": 0.97 }
→ 503 if voice reporting isn't configured on this deployment (needs S3_BUCKET + AWS creds)
→ 502 if transcription failed or timed out - fall back to letting them type
```
Real Amazon Transcribe under the hood - this can take 10-30+ seconds to
respond (a real async job, polled to completion), so show a "transcribing…"
state, not a normal-request spinner. The downstream agents (Triage,
Research, Action) understand non-English text natively via Claude/Strands -
no separate translation step needed for classification. The Action Agent
always writes the final complaint in English regardless of the citizen's
language, since that's what the receiving municipal authority expects.
**Honest limitation:** without Bedrock/Strands configured (the fallback
path), the keyword classifier is English-only - genuine multilingual
understanding requires AWS to be configured, same as every other
Strands-backed feature in this app.

**Report an issue** — runs Triage → Research → Action synchronously and returns the created ticket. The issue is attached to whoever the token belongs to - there's no `user_id` in the body anymore.
```
POST /issues   (auth required)
{
  "description": "There is a large pothole near this location.",
  "latitude": 12.34,
  "longitude": 56.78,
  "image_url": "/uploads/....jpg",   // optional, from the upload step above
  "language": "es-US",               // optional, set automatically if reported via /uploads/audio
  "urgency_hint": "high"             // optional: normal/high/emergency
}
→ 200 IssueOut (includes nested ticket + agent logs, see app/schemas.py)
```

**Dashboard list** (the authenticated user's own issues)
```
GET /issues   (auth required)
→ 200 [IssueOut, ...]
```

**Issue detail (for the Agent Timeline view)** - 403 if it's not your issue
```
GET /issues/{issue_id}   (auth required)
→ 200 IssueOut  (logs array has agent_name, action, timestamp - render as the timeline)
```

**SLA / escalation flow** - all auth required, all 403 if the ticket isn't yours
```
GET  /tickets/{ticket_id}/sla-status              → { sla_exceeded, sla_deadline }
POST /tickets/{ticket_id}/simulate-sla-expiry      (demo button - fast-forwards SLA)
POST /tickets/{ticket_id}/escalate                 → manual override; normally not needed (see below)
POST /tickets/{ticket_id}/approve-escalation        (human approves → status becomes "escalated")
POST /tickets/{ticket_id}/resolve                   (mark case resolved)
```

**Automatic tracking** - a background job (Tracking Agent) sweeps all open
tickets every `TRACKING_INTERVAL_SECONDS` (default 30s; set lower for a live
demo, e.g. `TRACKING_INTERVAL_SECONDS=5`) and drafts an escalation on its own
the moment a ticket's SLA is exceeded - you don't need to call `/escalate`
yourself. Ticket status flow: `waiting_for_authority` → (SLA exceeded) →
`awaiting_approval` → (human approves) → `escalated`. Poll `GET /issues/{id}`
or `GET /issues?user_id=` and watch `ticket.status` / `logs` to reflect this
live in the Agent Timeline and Dashboard.

**Community issue clustering** - groups nearby same-category reports (e.g.
3 pothole reports on the same street) into one community issue
```
GET /issues/clusters → 200 [{ category, center_lat, center_lng, report_count, severity, first_reported, latest_reported, issue_ids }, ...]
```
Only clusters of 2+ reports are returned. Clustering radius is 300m,
same category required - tune `CLUSTER_RADIUS_METERS` in
`app/agents/clustering.py` if needed. Persisted (an `issue_clusters` table,
with `Issue.cluster_id` as a real foreign key), assigned incrementally when
each issue is reported - `GET /issues/clusters` is a plain read, not a
recomputation of every issue's position against every other issue.

**Dev tools** (rehearsing the demo without stale data)
```
POST /dev/reset → wipes all users/issues/tickets/logs, reseeds one demo user
  (email demo@civicrelay.io / password demo1234), returns its id AND a ready-to-use access_token
```
On by default; set `ENABLE_DEV_ROUTES=0` to disable (e.g. before a real deployment).

## Structure

```
app/
  main.py          FastAPI app, CORS, router registration, health check, scheduler startup
  logging_config.py  structured JSON/text logging setup
  middleware.py       request ID + access logging middleware
  db.py            SQLAlchemy engine/session
  models.py        User (now with password_hash), Issue, Ticket, AgentLog
  schemas.py       Pydantic request/response models
  auth.py            password hashing (bcrypt) + JWT create/decode
  deps.py             get_current_user - FastAPI dependency that protects a route
  routers/
    users.py         signup / login / me
    issues.py      report/list/get issue (all scoped to the authenticated user), /issues/clusters (public)
    tickets.py      SLA status, escalation, resolve (ownership-checked)
    uploads.py       image upload (local disk or S3) + vision analysis
    dev.py            /dev/reset - wipe + reseed demo data, returns citizen AND staff tokens
    whatsapp.py         WhatsApp webhook (verification handshake + incoming message handling)
    iot.py               IoT telemetry ingestion (POST /iot/telemetry, API-key authenticated)
    analytics.py         municipal analytics (staff-only, see get_current_staff_user)
  storage.py         S3 client (falls back to local ./uploads for dev)
  rate_limit.py       slowapi Limiter keyed by user (or IP if unauthenticated)
  agents/
    strands_client.py    builds a real strands.Agent on Bedrock (BEDROCK_MODEL_ID + AWS creds)
    triage_agent.py      Strands structured-output classification, keyword fallback
    research_agent.py    Strands agent + a real lookup_department_sla tool, direct-lookup fallback
    sla_data.py            category → authority → SLA hours (Gagan fills this in)
    action_agent.py       Strands-generated complaint text, template fallback
    escalation_agent.py   Strands-generated escalation text, template fallback
    escalation_service.py  shared logic: draft + log + set status (used by sweep and manual endpoint)
    tracking_agent.py     SLA-exceeded check (used by the background sweep)
    tracking_scheduler.py  background job: sweeps open tickets, drafts escalations automatically
    vision_agent.py         real Strands vision call analyzing an uploaded photo
    voice_agent.py          real Amazon Transcribe speech-to-text with language identification
    whatsapp_client.py       real WhatsApp Cloud API client - webhook verification, message parsing, sending
    sensor_agent.py           deterministic threshold rules for IoT telemetry (not LLM-based)
    municipal_api.py        real Open311/GeoReport v2 client - submits to a configured city, local ref otherwise
    clustering.py          persisted, incrementally-updated community clusters (issue_clusters table)
    analytics.py            city-wide aggregation queries - overview, trends, by-authority, map
    predictive_agent.py      real linear-regression trend forecasting + recurrence risk (not ML)
    orchestrator.py       runs Triage → Research → Action, writes AgentLog
alembic/               migrations (run `alembic upgrade head` after cloning)
scripts/                simulate_iot_sensors.py - fake sensor fleet, see "IoT sensor monitoring" below
tests/                 pytest suite - run with `pytest` after `pip install -r requirements-dev.txt`
```

## What's real vs simulated (MVP)

Real when `BEDROCK_MODEL_ID` + AWS creds are set: LLM classification via
Strands structured output, department/SLA reasoning via a real Strands tool
call, complaint generation, escalation drafting, and photo analysis (vision
model on uploaded images) - all through the actual Strands Agents SDK
(`strands.Agent`), not a raw API call. Real when `S3_BUCKET` + AWS creds are
set: speech-to-text via genuine Amazon Transcribe, with automatic language
identification across a configurable candidate list of languages. Every
agent falls back automatically (and logs it) to deterministic logic if the
call fails or credentials aren't configured - text agents fall back to
keyword/template logic; the Vision and Voice Agents simply omit their
result from the response, since there's no meaningful non-LLM way to
"analyze a photo" or "transcribe audio." Local dev and live demos never
hard-crash on a throttle or missing key.

Always real regardless of AWS config: authentication (bcrypt + JWT),
orchestration, DB storage, escalation drafting → human-approval gate, SLA
tracking, community clustering.

Simulated by default, real if configured: municipal ticket submission. The
Open311 client (`app/agents/municipal_api.py`) is a genuine implementation
of the real, standardized GeoReport v2 spec - point `MUNICIPAL_API_BASE_URL`
at any real Open311-compliant city and it submits for real. Nothing is
faked about the client; what's "simulated" by default is simply that no
specific city endpoint is configured out of the box, since Open311 has no
single universal endpoint - every city runs its own.
