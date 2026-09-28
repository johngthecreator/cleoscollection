"""Reflect the live database schema and map its sale table."""

from sqlalchemy.ext.automap import automap_base

from db import engine

Base = automap_base()
Base.prepare(autoload_with=engine)

try:
    Sale = Base.classes.sale
except AttributeError as exc:
    raise RuntimeError(
        "The database does not contain a 'sale' table. Apply the Drizzle migrations first."
    ) from exc
