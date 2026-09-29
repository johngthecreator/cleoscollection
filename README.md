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

In the scraper service's Settings, set Cron Schedule to `30 18 * * 1` for
Monday at 12:30 PM Denver time during Mountain Daylight Time. Railway schedules
use UTC, so change it to `30 19 * * 1` during Mountain Standard Time to keep the
local run at 12:30 PM. Railway starts `uv run cron.py` on that schedule; the
script runs once and exits.

## Run locally

Set `DATABASE_URL` and `BRIGHTDATA_API_KEY` in `web-app/.env`, then run:

```bash
cd cron
uv sync
uv run cron.py
```
