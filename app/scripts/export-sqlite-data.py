import json
import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parents[1] / "prisma" / "dev.db"
output_path = Path(__file__).resolve().parent / "sqlite-export.json"

if not db_path.exists():
    raise SystemExit(f"SQLite database not found: {db_path}")

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations' ORDER BY name")

tables = [row[0] for row in cur.fetchall()]

export = {}

for table in tables:
    cur.execute(f"SELECT * FROM {table}")
    rows = cur.fetchall()
    export[table] = [{key: row[key] for key in row.keys()} for row in rows]

conn.close()

output_path.write_text(json.dumps(export, ensure_ascii=True, indent=2), encoding="utf-8")
print(f"Exported {len(tables)} tables to {output_path}")
