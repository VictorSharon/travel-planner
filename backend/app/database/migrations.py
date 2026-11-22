from sqlalchemy import text
from sqlalchemy.engine import Engine

# Idempotent changes to existing tables. Base.metadata.create_all() only creates missing tables, so new columns
# on existing tables go here. Replace with Alembic once the schema changes more often.
MIGRATIONS = [
    "ALTER TABLE trips ADD COLUMN IF NOT EXISTS origin VARCHAR NOT NULL DEFAULT ''",
]


def run_migrations(engine: Engine) -> None:
    with engine.begin() as conn:
        for statement in MIGRATIONS:
            conn.execute(text(statement))
