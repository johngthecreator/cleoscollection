import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv(Path(__file__).with_name(".env"))
load_dotenv(Path(__file__).resolve().parents[1] / "web-app" / ".env")

DB_URL = os.getenv("DATABASE_URL") or os.getenv("DB_URL")
if not DB_URL:
    raise RuntimeError("Set DATABASE_URL (or DB_URL) before running the cron job")

# Railway's Postgres plugin hands out a plain postgresql:// URL. SQLAlchemy's
# create_engine defaults that scheme to the psycopg2 dialect, which isn't
# installed here (we use psycopg[binary], i.e. psycopg3) — force the psycopg3
# dialect explicitly instead of requiring a separately-formatted env var.
if DB_URL and DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(DB_URL)
