# SentryLite

A lightweight, self-hosted clone of **Sentry** (error tracking) + **Better Stack** (uptime monitoring), built with Django, Postgres, Redis, and Celery. Built as a portfolio project to demonstrate backend architecture, API design, and real-world debugging (CORS, auth, async processing).

## What it does

- **Error Tracking**: A drop-in JS SDK captures uncaught exceptions and unhandled promise rejections from any web page, sends them to a Django ingestion API, and groups duplicate errors into `Issues` using stack-trace fingerprinting.
- **Uptime Monitoring** *(planned)*: Periodic health checks against user-defined URLs, with alerting on downtime and a public status page.

Both features share the same underlying pipeline: **event ingestion → storage → grouping/aggregation → dashboard.**

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Django + Django REST Framework |
| Database | PostgreSQL |
| Async / Scheduled Jobs | Celery + Celery Beat |
| Cache / Broker | Redis |
| Package Management | `uv` |
| Local Dev Infra | Docker Compose (Postgres, Redis, pgAdmin) |
| Client SDK | Vanilla JavaScript (framework-agnostic) |
| Auth | JWT (`djangorestframework-simplejwt`) |
| DB Admin UI | pgAdmin |

## Architecture

```
┌─────────────┐      POST /api/events/       ┌──────────────────┐
│   Browser    │ ─────────────────────────▶  │  Django + DRF     │
│ (SentryLite  │      X-API-Key: <DSN>        │  Ingestion API    │
│    SDK)      │                              └────────┬─────────┘
└─────────────┘                                        │
                                                         ▼
                                          ┌──────────────────────────┐
                                          │ Fingerprint stack trace   │
                                          │ Group into Issue          │
                                          │ (create or increment)     │
                                          └────────────┬──────────────┘
                                                        ▼
                                              ┌──────────────────┐
                                              │   PostgreSQL      │
                                              │  Project / Issue /  │
                                              │  Event tables      │
                                              └──────────────────┘
```

## Core Models

- **Project** — represents an app being monitored; owns a unique `api_key` (DSN) used for authenticating SDK requests.
- **Issue** — a deduplicated error group, identified by a `fingerprint` hash of the message + top stack frames. Tracks `count` and `last_seen`.
- **Event** — a single raw error occurrence, linked to its parent `Issue`.
- **Monitor** *(planned)* — a URL to be pinged on an interval, with expected status code.
- **Ping** *(planned)* — a single uptime check result (status, latency, timestamp).

## How error grouping works

1. SDK catches an error via `window.onerror` or `unhandledrejection`.
2. It POSTs `{ message, stack_trace }` to `/api/events/` with the project's API key in the `X-API-Key` header.
3. The server hashes the message + first 3 stack frames into a fingerprint.
4. If an `Issue` with that fingerprint already exists for the project, its `count` is incremented and the new `Event` is linked to it. Otherwise, a new `Issue` is created.

This means 100 identical errors show up as **one Issue with count = 100**, not 100 separate log lines — the core feature that makes this feel like a real error tracker instead of a flat log table.

## Local Setup

### 1. Prerequisites
- Python 3.12+
- [`uv`](https://github.com/astral-sh/uv)
- Docker + Docker Compose

### 2. Clone and install dependencies
```bash
cd backend
uv add django djangorestframework celery redis psycopg2-binary python-dotenv django-cors-headers djangorestframework-simplejwt
```

### 3. Start infrastructure (Postgres, Redis, pgAdmin)
```bash
docker compose up -d
```

### 4. Configure environment
Create a `.env` file in `backend/`:
```
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=sentrylite
DB_USER=sentrylite
DB_PASSWORD=sentrylite
DB_HOST=localhost
DB_PORT=5432
```

### 5. Run migrations and create an admin user
```bash
uv run python manage.py migrate
uv run python manage.py createsuperuser
```

### 6. Start the server
```bash
uv run python manage.py runserver
```

Visit `http://localhost:8000/admin` to manage Projects, Issues, and Events.

### 7. (Optional) pgAdmin
Visit `http://localhost:5050` (default login: `admin@admin.com` / `admin`) to browse the raw database. Register a server with host `db`, port `5432`, and the credentials from your `.env`.

## Using the SDK

Include the SDK on any page and initialize it with your project's API key:

```html
<script src="sentry-lite.js"></script>
<script>
  SentryLite.init({
    dsn: "YOUR_PROJECT_API_KEY",
    endpoint: "http://localhost:8000/api/events/" // optional override
  });
</script>
```

The SDK automatically captures:
- Uncaught runtime errors (`window.onerror`)
- Unhandled promise rejections (`unhandledrejection`)

You can also capture errors manually:
```js
try {
  riskyOperation();
} catch (e) {
  SentryLite.captureException(e);
}
```

## API Reference

### `POST /api/events/`
Ingests a new error event.

**Headers:**
```
X-API-Key: <project_api_key>
Content-Type: application/json
```

**Body:**
```json
{
  "message": "TypeError: cannot read property of undefined",
  "stack_trace": ["at foo.js:10", "at bar.js:22"]
}
```

**Response:**
```json
{ "status": "ok", "issue_id": 3 }
```

### `POST /api/auth/register/`
Registers a new user.

### `POST /api/auth/login/`
Returns a JWT `access`/`refresh` token pair.

## Roadmap

- [x] Project + API key authentication
- [x] Event ingestion API
- [x] Stack-trace fingerprinting and Issue grouping
- [x] JS SDK for automatic browser error capture
- [x] CORS-safe cross-origin ingestion
- [ ] User accounts with per-user Project ownership
- [ ] Uptime Monitors + Celery Beat scheduled pinging
- [ ] Alerting (email/webhook on downtime or new issue)
- [ ] Public status page
- [ ] React/Next.js dashboard
- [ ] Deployment (Docker image, hosted demo)

## Notes on Design Decisions

- **Django over Node**: chosen for the built-in admin panel (fast iteration without building a dashboard first), Django REST Framework for clean API design, and first-class Celery integration for scheduled/async work.
- **Fingerprinting**: kept intentionally simple (hash of message + first 3 stack frames) to stay fast at ingestion time; can be made smarter later (e.g. normalizing dynamic values in messages).
- **CORS**: `django-cors-headers` requires explicitly allow-listing custom request headers (like `X-API-Key`) — allowing all origins is not sufficient on its own.
