#!/usr/bin/env python3
"""Download NOAA ISD for Silverstone, parse, and precompute historical profiles."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(script: str) -> None:
    cmd = [sys.executable, str(ROOT / "scripts" / script)]
    print(f"\n$ {' '.join(cmd)}")
    subprocess.check_call(cmd)


def main() -> None:
    run("download_isd.py")
    run("parse_isd.py")
    run("build_features.py")
    print("\nDemo data ready. Start the API with:")
    print("  cd backend && .venv/bin/uvicorn main:app --reload --port 8000")


if __name__ == "__main__":
    main()
