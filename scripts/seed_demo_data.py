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
    run("ingest_all.py")
    print("\nDemo data ready. Export static JSON with:")
    print("  python3 scripts/export_static_data.py")


if __name__ == "__main__":
    main()
