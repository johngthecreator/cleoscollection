# Cleo's Collection

This monorepo contains two Railway services:

- `web-app/` — the Next.js site.
- `cron/` — the Python retailer scraper.

## Deploy on Railway

Push this repository to GitHub, then create two Railway services from that
repository:

1. **Web app:** set the service Root Directory to `/web-app`. Railway can use
   the app's `package.json` to build and start Next.js.
2. **Scraper:** set Root Directory to `/cron` and Start Command to
   `uv run cron.py`.

In the scraper service's Variables, set `DATABASE_URL` and
`BRIGHTDATA_API_KEY`. Set the web app's variables separately in its Railway
service. Do not commit either local `.env` file; the repo-level `.gitignore`
excludes them.

In the scraper service's Settings, set Cron Schedule to `*/20 * * * *` to run
every 20 minutes (UTC). Railway starts `uv run cron.py` on that schedule; the
script runs once and exits. Keep each run under 20 minutes so Railway does not
skip an overlapping execution.

## Run locally

Set `DATABASE_URL` and `BRIGHTDATA_API_KEY` in `web-app/.env`, then run:

```bash
cd cron
uv sync
uv run cron.py
```
