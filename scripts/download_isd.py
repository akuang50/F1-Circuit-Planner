#!/usr/bin/env python3
"""Download NOAA ISD global-hourly CSV files from AWS Open Data.

Uses the public HTTPS endpoint for s3://noaa-global-hourly-pds
https://registry.opendata.aws/noaa-isd/
"""

from __future__ import annotations

import argparse
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from config import ISD_CSV_BASE, ISD_HISTORY_URL, RAW_DIR, station_mapping  # noqa: E402


def download(url: str, dest: Path, timeout: int = 120) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(url, timeout=timeout) as response:
        data = response.read()
    dest.write_bytes(data)


def download_history() -> Path:
    dest = RAW_DIR / "isd-history.csv"
    print(f"Downloading ISD station history → {dest}")
    download(ISD_HISTORY_URL, dest)
    return dest


def year_url(station_id: str, year: int) -> str:
    return f"{ISD_CSV_BASE}/{year}/{station_id}.csv"


def download_year(station_id: str, year: int) -> Path:
    dest = RAW_DIR / "isd-csv" / station_id / f"{year}.csv"
    if dest.exists() and dest.stat().st_size > 0:
        print(f"skip  {year} (cached)")
        return dest
    url = year_url(station_id, year)
    print(f"get   {url}")
    try:
        download(url, dest)
    except HTTPError as exc:
        if exc.code == 404:
            print(f"miss  {year} (HTTP 404)")
            return dest
        raise
    print(f"ok    {year} ({dest.stat().st_size} bytes)")
    return dest


def main() -> None:
    parser = argparse.ArgumentParser(description="Download NOAA ISD CSV years from AWS Open Data")
    parser.add_argument("--circuit", default="silverstone")
    parser.add_argument("--start-year", type=int, default=None)
    parser.add_argument("--end-year", type=int, default=None)
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()

    mapping = station_mapping(args.circuit)
    start = args.start_year or mapping["start_year"]
    end = args.end_year or mapping["end_year"]
    station_id = mapping["station_id"]
    years = list(range(start, end + 1))

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    download_history()

    print(
        f"Station {station_id} {mapping['station_name']} "
        f"for {args.circuit}: {start}–{end}"
    )
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(download_year, station_id, year) for year in years]
        for future in as_completed(futures):
            future.result()
    print("Download complete.")


if __name__ == "__main__":
    main()
