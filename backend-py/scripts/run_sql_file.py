"""Runs a T-SQL script (batches separated by `GO` lines, like sqlcmd/SSMS) against
the database the backend is configured for — for environments with no `sqlcmd`,
notably the backend Docker container (it has the ODBC driver and this app's own
connection settings, but no SQL client tools).

    python scripts/run_sql_file.py scripts/soft_delete_and_ai_providers_migration.sql

Runs with the same environment variables as the backend itself. Prints any
rows a batch returns (e.g. the migration's verification SELECT). Stops at
the first failing batch.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# Plain `python scripts/run_sql_file.py` puts the SCRIPT's own directory
# (.../scripts) on sys.path[0] — never the backend root — regardless of the
# current working directory it's invoked from. Locally this is masked by the
# dev venv's editable `pip install -e .` already making `app` importable
# from anywhere; the Docker image has no such editable install (the app
# package only ever exists on disk under /app/app), so this same invocation
# fails there with "No module named 'app'" every time. Inserting the backend
# root (this file's parent's parent) explicitly fixes it everywhere.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text

from app.db import get_engine

GO_LINE = re.compile(r"^\s*GO\s*$", re.IGNORECASE | re.MULTILINE)


def main(path: str) -> int:
    script = Path(path).read_text(encoding="utf-8-sig")
    batches = [b.strip() for b in GO_LINE.split(script) if b.strip()]
    engine = get_engine()
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        for number, batch in enumerate(batches, start=1):
            try:
                result = conn.execute(text(batch))
                if result.returns_rows:
                    rows = result.fetchall()
                    print(f"-- batch {number}: {len(rows)} row(s)")
                    for row in rows:
                        print("   ", tuple(row))
            except Exception as exc:
                print(f"FAILED in batch {number}:\n{batch}\n\n{exc}", file=sys.stderr)
                return 1
    print(f"OK — ran {len(batches)} batch(es) from {path}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
