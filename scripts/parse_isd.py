#!/usr/bin/env python3
"""Parse NOAA ISD CSV year files into a normalized observations parquet."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

import polars as pl

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from config import PROCESSED_DIR, RAW_DIR, circuit_by_id, station_mapping  # noqa: E402
from isd import parse_csv_file  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--circuit", default="silverstone")
    args = parser.parse_args()

    circuit = circuit_by_id(args.circuit)
    mapping = station_mapping(args.circuit)
    station_id = mapping["station_id"]
    year_dir = RAW_DIR / "isd-csv" / station_id
    files = sorted(year_dir.glob("*.csv"))
    if not files:
        raise SystemExit(f"No CSV files in {year_dir}. Run scripts/download_isd.py first.")

    all_rows: list[dict] = []
    stats = Counter()
    for path in files:
        print(f"parse {path.name}")
        rows, file_stats = parse_csv_file(
            path,
            timezone_name=circuit["timezone"],
            station_id=station_id,
        )
        stats.update(file_stats)
        all_rows.extend(rows)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    frame = pl.DataFrame(all_rows, infer_schema_length=None)
    out = PROCESSED_DIR / "observations.parquet"
    frame.write_parquet(out)
    qc = {
        **dict(stats),
        "circuit_id": args.circuit,
        "station_id": station_id,
        "timezone": circuit["timezone"],
        "files": [p.name for p in files],
        "row_count": frame.height,
    }
    (PROCESSED_DIR / "qc_stats.json").write_text(json.dumps(qc, indent=2))
    print(f"Wrote {frame.height} observations → {out}")
    print(json.dumps(qc, indent=2))


if __name__ == "__main__":
    main()
