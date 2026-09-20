#!/usr/bin/env python3
"""Build circuit-month-hour historical profiles from normalized observations."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import polars as pl

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from analytics import attach_volatility, build_hourly_profiles, build_monthly_profiles  # noqa: E402
from config import PROCESSED_DIR  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--circuit", default="silverstone")
    args = parser.parse_args()

    observations_path = PROCESSED_DIR / "observations.parquet"
    if not observations_path.exists():
        raise SystemExit("Missing observations.parquet. Run scripts/parse_isd.py first.")

    frame = pl.read_parquet(observations_path)
    rows = frame.to_dicts()
    print(f"Loaded {len(rows)} observations for {args.circuit}")
    rows = attach_volatility(rows)
    hourly = build_hourly_profiles(rows)
    monthly = build_monthly_profiles(hourly)

    hourly_frame = pl.DataFrame(hourly, infer_schema_length=None)
    monthly_frame = pl.DataFrame(monthly, infer_schema_length=None)
    hourly_path = PROCESSED_DIR / "hourly_profiles.parquet"
    monthly_path = PROCESSED_DIR / "monthly_profiles.parquet"
    hourly_frame.write_parquet(hourly_path)
    monthly_frame.write_parquet(monthly_path)
    print(f"Wrote {hourly_frame.height} hourly profiles → {hourly_path}")
    print(f"Wrote {monthly_frame.height} monthly profiles → {monthly_path}")


if __name__ == "__main__":
    main()
