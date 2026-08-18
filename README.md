# SentryLite

A self-hosted clone of **Sentry** (error tracking) + **Better Stack** (uptime monitoring), built with Django, Postgres, Redis, Celery, and a Next.js dashboard. Built as a portfolio project to demonstrate backend architecture, API design, background job processing, and full-stack integration.

## What it does

- **Error Tracking**: A drop-in JS SDK captures uncaught exceptions and unhandled promise rejections from any web page, sends them to a Django ingestion API, and groups duplicate errors into `Issues` using stack-trace fingerprinting.
- **Uptime Monitoring**: Celery Beat schedules periodic health checks against user-defined URLs. State transitions (up → down, down → up) trigger email alerts — not every ping, only real changes.
- **Auth & Multi-tenancy**: JWT-based auth with per-user project ownership. Each project gets its own API key (DSN) for SDK/ingestion use.
- **Dashboard**: A Next.js + TypeScript frontend for managing projects, viewing grouped issues, and monitoring uptime status.

All of this shares one underlying pipeline: **event ingestion → storage → grouping/aggregation → dashboard.**

## Tech Stack

| Layer                  | Tech                                                          |
| ---------------------- | ------------------------------------------------------------- |
| Backend                | Django + Django REST Framework                                |
| Database               | PostgreSQL                                                    |
| Async / Scheduled Jobs | Celery + Celery Beat (`django-celery-beat`)                   |
| Cache / Broker         | Redis                                                         |
| Auth                   | JWT (`djangorestframework-simplejwt`)                         |
| Package Management     | `uv`                                                          |
| Local Dev Infra        | Docker Compose (Postgres, Redis, pgAdmin, Celery worker/beat) |
| Frontend               | Next.js (App Router) + TypeScript + Tailwind CSS              |
| API Client             | Axios with JWT interceptor                                    |
| Client SDK             | Vanilla JavaScript (framework-agnostic)                       |
| DB Admin UI            | pgAdmin                                                       |

## Architecture

```
┌─────────────┐   POST /api/events/    ┌───────────────────┐
│   Browser    │ ─────────────────────▶│  Django + DRF      │
│ (SentryLite  │   X-API-Key: <DSN>    │  Ingestion API      │
│    SDK)      │                       └─────────┬──────────┘
└─────────────┘                                  │
                                                   ▼
                                    ┌──────────────────────────┐
                                    │ Fingerprint stack trace   │
                                    │ Group into Issue          │
                                    │ (create or increment)     │
                                    └────────────┬──────────────┘
                                                  ▼
                                          ┌──────────────┐
                                          │  PostgreSQL   │
                                          └──────┬───────┘
                                                  ▲
┌──────────────┐   every N sec    ┌──────────────┴───────────┐
│ Celery Beat   │ ───────────────▶│  Celery Worker             │
│ (scheduler)   │                 │  ping_monitor(url)         │
└──────────────┘                 │  → detect state change      │
                                  │  → send_alert() if changed  │
                                  └────────────────────────────┘
                                                  │
                                                  ▼
                                       Email (console backend, dev)

┌────────────────────┐   JWT-authed REST calls   ┌─────────────┐
│  Next.js Dashboard  │ ─────────────────────────▶│  Django API  │
└────────────────────┘                            └─────────────┘
```

## Core Models

- **Project** — represents an app being monitored; owns a unique `api_key` (DSN) and belongs to a `User` (`owner`).
- **Issue** — a deduplicated error group, identified by a `fingerprint` hash of the message + top stack frames. Tracks `count` and `last_seen`.
- **Event** — a single raw error occurrence, linked to its parent `Issue`.
- **Monitor** — a URL to be pinged on an interval, with expected status code and a tracked `current_status` (`up` / `down` / `unknown`).
- **Ping** — a single uptime check result (status code, latency, timestamp, error message if failed).
- **AlertChannel** — an email or webhook destination configured per project, used to notify on monitor state changes.

## How error grouping works

1. SDK catches an error via `window.onerror` or `unhandledrejection`.
2. It POSTs `{ message, stack_trace }` to `/api/events/` with the project's API key in the `X-API-Key` header.
3. The server hashes the message + first 3 stack frames into a fingerprint.
4. If an `Issue` with that fingerprint already exists for the project, its `count` is incremented and the new `Event` is linked to it. Otherwise, a new `Issue` is created.

100 identical errors show up as **one Issue with count = 100**, not 100 separate log lines.

## How uptime alerting works

1. `django-celery-beat` fires `ping_all_active_monitors` on a schedule (configured via Django admin — no hardcoded intervals).
2. That task queues a `ping_monitor` task per active `Monitor`.
3. Each ping records a `Ping` row (status code, latency, up/down).
4. If the new status differs from the monitor's stored `current_status`, `send_alert()` fires to every active `AlertChannel` on that project.
5. `current_status` is updated regardless, so the _next_ ping only alerts again if there's another real transition.

This avoids alert spam — a monitor that's been down for an hour doesn't send 60 emails, only one, at the moment it went down (and one more when it recovers).

## Local Setup

### Prerequisites

- Python 3.12+, [`uv`](https://github.com/astral-sh/uv), Node.js 18+, Docker + Docker Compose

### Two ways to run the backend

**Mode A — Infra in Docker, Django local (recommended for active development):**

```bash
cd backend
make up                                    # starts db, redis, pgadmin, celery_worker, celery_beat
uv run python manage.py runserver          # Django runs locally, using .env
```

**Mode B — Everything in Docker:**

```bash
cd backend
make up-full                               # starts all services including Django, using .env.docker
```

### Environment files

`backend/.env` (for local Django + local tooling):

```
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=sentry_db
DB_USER=aryan
DB_PASSWORD=sentry1234
DB_HOST=localhost
DB_PORT=5432
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

`backend/.env.docker` (for containerized services — same values, but pointed at Docker service names):

```
DB_HOST=db
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

### First-time setup

```bash
uv run python manage.py migrate
uv run python manage.py createsuperuser
```

Visit `http://localhost:8000/admin` to manage Projects, Issues, Events, Monitors, and scheduled tasks.

### pgAdmin

`http://localhost:5050` (default: `admin@admin.com` / `admin`). Register a server with host `db`, port `5432`.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

```bash
npm run dev
```

Visit `http://localhost:3000` — redirects to `/login`. Register, log in, create a project, and view its Issues/Monitors pages.

### Makefile shortcuts (run from `backend/`)

```bash
make up                # infra + celery only
make up-full           # everything in docker
make down               # stop everything
make migrate            # run migrations (in docker mode)
make superuser           # create admin user (in docker mode)
make logs                # tail all container logs
make logs-s SERVICE=celery_worker    # tail one service
make restart SERVICE=celery_worker   # restart one service (needed after editing tasks.py)
make dbshell              # psql shell into the database
```

## Using the SDK

```html
<script src="sentry-lite.js"></script>
<script>
  SentryLite.init({
    dsn: "YOUR_PROJECT_API_KEY",
    endpoint: "http://localhost:8000/api/events/",
  });
</script>
```

Automatically captures uncaught runtime errors and unhandled promise rejections. Manual capture is also available:

```js
try {
  riskyOperation();
} catch (e) {
  SentryLite.captureException(e);
}
```

## API Reference

### Auth

- `POST /api/auth/register/` — create a user
- `POST /api/auth/login/` — returns JWT `access`/`refresh` pair
- `POST /api/auth/refresh/` — refresh an access token

### Projects

- `GET /api/projects/` — list your projects _(auth required)_
- `POST /api/projects/` — create a project, returns its `api_key` _(auth required)_

### Ingestion

- `POST /api/events/` — ingest an error event
  ```
  Headers: X-API-Key: <project_api_key>
  Body: { "message": "...", "stack_trace": ["..."] }
  ```

### Issues & Monitors _(planned endpoints — see Roadmap)_

- `GET /api/projects/<id>/issues/` — list grouped issues for a project
- `GET /api/projects/<id>/monitors/` — list monitors + current status for a project

## Roadmap

- [x] Project + API key authentication
- [x] Event ingestion API + stack-trace fingerprinting
- [x] JS SDK for automatic browser error capture
- [x] CORS-safe cross-origin ingestion
- [x] JWT auth with per-user project ownership
- [x] Uptime Monitors + Celery Beat scheduled pinging
- [x] Downtime/recovery email alerting (state-change based, not per-ping)
- [x] Docker Compose (dual-mode: infra-only vs full stack) + Makefile
- [x] Next.js + TypeScript dashboard (login, register, projects, issues, monitors UI)
- [ ] Wire dashboard Issues/Monitors pages to real backend data (currently mock data)
- [ ] Backend list endpoints for Issues and Monitors per project
- [ ] Webhook alerts (Slack/Discord)
- [ ] Public status page
- [ ] Production deployment (hosted demo, real SMTP, HTTPS + `httpOnly` auth cookies)

## Notable Design Decisions & Trade-offs

- **Django over Node**: built-in admin panel enabled fast iteration without building a dashboard first; DRF gave a clean API surface; first-class Celery integration made scheduled/async work straightforward.
- **Fingerprinting**: intentionally simple (hash of message + first 3 stack frames) to stay fast at ingestion time. Could be made smarter later (e.g. normalizing dynamic values in error messages).
- **Alert-on-transition, not alert-on-every-ping**: `Monitor.current_status` is compared against each new ping result; alerts only fire on an actual state change. This mirrors how real tools like Better Stack avoid notification spam during extended outages.
- **CORS header allowlisting**: `django-cors-headers` requires explicitly listing custom request headers (like `X-API-Key`) via `CORS_ALLOW_HEADERS` — allowing all origins via `CORS_ALLOW_ALL_ORIGINS` is necessary but not sufficient on its own.
- **Celery workers don't hot-reload**: unlike Django's dev server, code changes to `tasks.py` require a manual worker restart (`make restart SERVICE=celery_worker`) to take effect.
- **Dual Docker Compose modes**: running Django locally (Mode A) gives a faster dev loop and easier debugging, while infra (Postgres/Redis/Celery) stays consistent in containers. Mode B (fully Dockerized) is closer to how it would actually deploy.
- **Auth token storage**: currently stored in a JS-readable cookie via `js-cookie`, chosen for SSR-friendliness over `localStorage`. Not meaningfully more secure against XSS than `localStorage` — a production-grade version would have Django set an `httpOnly` cookie directly rather than returning the token in the JSON response body.

## What This Project Demonstrates

- Designing and debugging a real REST API (DRF, JWT auth, permission-scoped querysets)
- Background job processing with Celery (scheduled tasks, task chaining, state tracking across async workers)
- Cross-origin request handling and the specific header-allowlisting behavior of CORS in practice
- Docker Compose multi-service orchestration, including the `localhost` vs. service-name networking distinction between host and container contexts
- Full-stack integration: a typed frontend (Next.js + TypeScript) consuming a Python backend over a documented REST API
- Systematic debugging under real, messy conditions — file permission corruption from Docker volume mounts, stale environment variables, foreign-key deletion ordering, and multi-file environment configuration
