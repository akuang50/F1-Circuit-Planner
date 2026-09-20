"""Shared paths and NOAA ISD configuration."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
METADATA_DIR = DATA_DIR / "metadata"

ISD_REGISTRY = "https://registry.opendata.aws/noaa-isd/"
ISD_CSV_BUCKET = "noaa-global-hourly-pds"
ISD_ORIGINAL_BUCKET = "noaa-isd-pds"
ISD_CSV_BASE = "https://noaa-global-hourly-pds.s3.amazonaws.com"
ISD_ORIGINAL_BASE = "https://noaa-isd-pds.s3.amazonaws.com"
ISD_HISTORY_URL = f"{ISD_ORIGINAL_BASE}/isd-history.csv"

VALID_QC = frozenset({"0", "1", "4", "5", "9"})


def load_json(path: Path) -> dict:
    return json.loads(path.read_text())


def circuits() -> list[dict]:
    return load_json(METADATA_DIR / "circuits.json")["circuits"]


def circuit_by_id(circuit_id: str) -> dict:
    for circuit in circuits():
        if circuit["id"] == circuit_id:
            return circuit
    raise KeyError(f"Unknown circuit: {circuit_id}")


def station_mapping(circuit_id: str) -> dict:
    payload = load_json(METADATA_DIR / "stations.json")
    for mapping in payload["mappings"]:
        if mapping["circuit_id"] == circuit_id:
            return mapping
    raise KeyError(f"No station mapping for circuit: {circuit_id}")


def thresholds() -> dict:
    return load_json(METADATA_DIR / "thresholds.json")


def session_catalog() -> dict:
    return load_json(METADATA_DIR / "sessions.json")
