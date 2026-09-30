# Cleo's Collection

This repository contains two parts of the application:

- `web-app/` — the Next.js app, TypeScript scrapers, and app database schema.
- `cron/` — the Python scraper job and its parser package.

## Run the web app

```bash
cd web-app
npm ci
npm run dev
```

## Similar item searches

The **Find similar items** link opens `/similar/[id]`. That page calls
`POST /api/find-similar/[id]`, which starts the `find-similar-items` Trigger.dev
task and returns a run-scoped public token. The page uses Trigger.dev Realtime
to show the task's progress and results.

Set `TRIGGER_SECRET_KEY` in the web app's `.env` for the API route. The Trigger.dev
task also needs `DATABASE_URL`, `OPENAI_API_KEY`, and `BETTER_AUTH_URL` in its
environment. `BETTER_AUTH_URL` must point to an app URL reachable from the
Trigger worker because the task fetches the reference image through
`/api/sale-images/[id]`. The web app still needs its MinIO settings for that
image route. Run `npx trigger.dev dev` alongside
`npm run dev` locally, or deploy the task with Trigger.dev for production.

## Run the Python scraper

Set `DATABASE_URL` and `BRIGHTDATA_API_KEY` in `web-app/.env`, then from the repository root:

```bash
python -m pip install -r cron/requirements.txt
python cron/cron.py
```
