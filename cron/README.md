# Product scraper cron

Install and lock the Python dependencies with `uv sync` from the `cron/` directory.

Set `DATABASE_URL` and `BRIGHTDATA_API_KEY` in `web-app/.env`, then run `uv run cron.py` from the `cron/` directory.

The cron job reflects the live PostgreSQL `sale` table when it starts, so apply
schema changes with the Drizzle migrations before running the Python job. The
Python code does not create or migrate tables. A missing `original_price` is
stored as `NULL`.
