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

## Run the Python scraper

Set `DATABASE_URL` and `BRIGHTDATA_API_KEY` in `web-app/.env`, then from the repository root:

```bash
python -m pip install -r cron/requirements.txt
python cron/cron.py
```
