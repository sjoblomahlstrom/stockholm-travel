import sqlite3
from pathlib import Path
from datetime import datetime, timezone

DATABASE = Path(__file__).resolve().parent / "api_quota.db"
DAILY_LIMIT = 500


def reserve_request():
    today = datetime.now(timezone.utc).date().isoformat()

    with sqlite3.connect(DATABASE, timeout=10) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS daily_usage (
                day TEXT PRIMARY KEY,
                requests INTEGER NOT NULL DEFAULT 0
            )
        """)

        db.execute("BEGIN IMMEDIATE")

        db.execute(
            "INSERT OR IGNORE INTO daily_usage VALUES (?, 0)",
            (today,)
        )

        result = db.execute("""
            UPDATE daily_usage
            SET requests = requests + 1
            WHERE day = ? AND requests < ?
        """, (today, DAILY_LIMIT))

        allowed = result.rowcount == 1
        db.commit()

        return allowed
