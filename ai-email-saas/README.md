# AI Email Automation SaaS (OpsMail)

Production-oriented, **cron-triggered** email pipeline: IMAP ingest (short-lived connection) → dedupe → in-request sequential queue → **Groq** (`llama3-70b-8192`) classification → routing → ticket match → attachment storage → **Brevo** sends → DB audit logs → React review UI.

**No** `while(true)` workers, **no** persistent IMAP, **no** background daemons. Each run is a single HTTP request (ideal for Railway / serverless-style hosts + external cron).

## Repository layout

- `prisma/` — Neon PostgreSQL schema + migrations
- `src/` — Express API + services
- `frontend/` — Vite + React + Tailwind dashboard
- `docs/` — saved attachments at runtime (`docs/{npi}/`)

## Prerequisites

- Node.js 20+
- [Neon](https://neon.tech) PostgreSQL connection string
- [Groq](https://console.groq.com) API key
- [Brevo](https://www.brevo.com) API key + verified sender (`EMAIL_FROM`)
- IMAP mailbox (Gmail: use an [app password](https://support.google.com/accounts/answer/185833), `IMAP_HOST=imap.gmail.com`)

## Environment

Copy `.env.example` to `.env` and fill values:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL URL |
| `GROQ_API_KEY` | Groq Cloud |
| `GROQ_MODEL` | Optional; default `llama3-70b-8192` (see [Groq deprecations](https://console.groq.com/docs/deprecations)) |
| `BREVO_API_KEY` | Brevo REST |
| `EMAIL_USER` / `EMAIL_PASS` | IMAP credentials |
| `IMAP_HOST` | e.g. `imap.gmail.com` |
| `EMAIL_FROM` | Verified sender email in Brevo |
| `PORT` | API port (default `3001`) |
| `FRONTEND_ORIGIN` | CORS origin (e.g. `http://localhost:5173` or your Railway URL) |

Optional frontend: `frontend/.env` with `VITE_API_URL=https://your-api.host` when UI is not served from the same origin.

## Database

From the project root:

```bash
npx prisma migrate deploy
```

For a quick dev sync without migration history:

```bash
npx prisma db push
```

## Backend

```bash
npm install
node src/server.js
```

Endpoints (same origin when UI is built into `frontend/dist`):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/process` | **Full pipeline once** (for cron-job.org, etc.) |
| GET | `/emails` | List + `?q=&status=&limit=` |
| GET | `/review` | `review` + `manual` queue |
| POST | `/approve/:id` | Human approve → Brevo (up to 3 attempts) |
| POST | `/reject/:id` | Mark rejected |
| GET | `/logs` | Audit log |
| GET | `/stats` | Dashboard counters |

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxies API routes to `http://localhost:3001` (override with `VITE_PROXY_TARGET`).

Production UI is served by Express after:

```bash
cd frontend && npm run build
```

Then open the API origin in a browser (static `index.html` + client routing).

## Routing rules

- Confidence **≥ 80** → `auto` (if `actionable`, auto-reply via Brevo with up to **3** tries in the same request)
- **60–79** → `review` (human queue)
- **&lt; 60** → `manual` (human queue)

Ticket match: **NPI** exact, else **provider name** case-insensitive equality.

## Cron (Railway / external)

Configure [cron-job.org](https://cron-job.org) (or similar) to call:

`GET https://<your-app>/process` every 1–5 minutes.

Use a secret URL token at the edge (Railway path rules, middleware, or reverse proxy) if the endpoint must stay private—this template exposes it intentionally for simplicity.

## Railway notes

1. Set all env vars in the service.
2. Build command example:  
   `npm install && cd frontend && npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
3. Start command: `node src/server.js`
4. Set `FRONTEND_ORIGIN` to your public web URL for CORS when the UI runs on a different hostname.

## Extra dependencies

- **`cors`** — browser calls from Vite dev server
- **`mailparser`** — MIME parsing (body + attachments) from IMAP `source`

These are required for a real mailbox pipeline beyond the minimal list in the brief.

## Sample tickets

Insert rows into `tickets` (`provider_name`, `npi`) to exercise matching:

```sql
INSERT INTO tickets (id, provider_name, npi)
VALUES ('ticket_demo_1', 'Acme Health', '1234567890');
```

## License

MIT (template project).
