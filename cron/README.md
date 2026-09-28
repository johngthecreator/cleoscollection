# Product scraper cron

Install the Python dependencies with `python -m pip install -r cron/requirements.txt`.

Set `DATABASE_URL` and `BRIGHTDATA_API_KEY` in `web-app/.env`, then run `python cron/cron.py` from the repository root.

The cron job reflects the live PostgreSQL `sale` table when it starts, so apply
schema changes with the Drizzle migrations before running the Python job. The
Python code does not create or migrate tables. A missing `original_price` is
stored as `NULL`.
