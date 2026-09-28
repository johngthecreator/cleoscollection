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
   `python cron.py`.

In the scraper service's Variables, set `DATABASE_URL` and
`BRIGHTDATA_API_KEY`. Set the web app's variables separately in its Railway
service. Do not commit either local `.env` file; the repo-level `.gitignore`
excludes them.

In the scraper service's Settings, set its Cron Schedule to the desired
five-field UTC expression. Railway starts `python cron.py` on that schedule;
the script runs once and exits. Keep the interval longer than the longest
scrape run so Railway does not skip an overlapping execution.

## Run locally

Set `DATABASE_URL` and `BRIGHTDATA_API_KEY` in `web-app/.env`, then from the
repository root:

```bash
python -m pip install -r cron/requirements.txt
python cron/cron.py
```
