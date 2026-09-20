# Design notes — F1 Weather Resilience

Hackathon MVP. Product principles live in the original briefing; this file records implementation choices.

## What this is

A **historical scenario and scheduling analysis** tool. It never claims a correct race time and does not mix forecasts into ISD climatology. Extra public datasets (ERA5, Jolpica, OpenF1) are baked into `extras.json` so GitHub Pages can say more about race-day climate without API keys.

## Data

- Registry: https://registry.opendata.aws/noaa-isd/
- Original archive: `s3://noaa-isd-pds` (gzipped ISD, station history)
- CSV used by the pipeline: `s3://noaa-global-hourly-pds/{year}/{station}.csv`
- Circuit: Silverstone (`Europe/London`)
- Pinned station: Church Lawford `03544099999` (Met Office synoptic, 2010–2025). Cranfield is closer but not used; see `data/metadata/stations.json`.

### Parsing

Global-hourly CSV fields:

| Field | Meaning |
| --- | --- |
| `TMP` / `DEW` | Tenths of °C |
| `WND` | Direction and speed, speed in tenths of m/s |
| `VIS` | Visibility metres |
| `AA1` | Precipitation; **1-hour totals only** so hourly rates are not mixed with 6-hour accumulations |
| `OC1` / `OD1` | Gust / supplementary wind |
| `AW1` | Present weather; used when 1-hour precip is missing |

Invalid sentinels (`9999`, `+9999`, …), bad quality flags and physically impossible values are dropped and counted in `data/processed/qc_stats.json`. Duplicates are not silently merged without a counter.

Local hour uses `zoneinfo` (`Europe/London`), including BST.

### Thresholds

Configurable in `data/metadata/thresholds.json`. UI copy describes them as historical frequencies, never “unsafe”.

Rain probability is the share of observations **with a precipitation or present-weather field** that meet the rain rule. Hours with neither field are excluded from that ratio (they still count in `n` for the window).

## Extra public datasets

Baked by `scripts/ingest_extras.py` into `frontend/public/data/extras.json` (no API keys):

- Open-Meteo Archive ERA5 daily (2010–2026) at each circuit lat/lon → monthly rain-day climate, typical sunrise/sunset, mean temperature
- Jolpica/Ergast race dates and winners, joined to ERA5 so the UI can say “of N GPs since 2010, ERA5 shows ≥1 mm on race day for M”
- OpenF1 session weather from 2023 (track/air temperature, humidity, rainfall flag). Numeric fields only; F1 media URLs are not copied into the repo

ERA5 is reanalysis at the venue that day, not a lap-by-lap race log. When NOAA ISD precipitation is missing or stuck at 0/1, tyre advice leans on ERA5 rain-day fraction instead of the ISD percentage.

## Architecture

```
NOAA ISD AWS → download_isd.py → parse_isd.py → observations.parquet
       → build_features.py → hourly_profiles.parquet + monthly_profiles.parquet
       → DuckDB views → FastAPI → Next.js
```

The API is mostly lookups plus a bounded grid search for weekend candidates.

## Optimizer

Hard constraints: no overlap, duration, allowed windows, `required_after`, minimum gap. Soft costs: weighted weather exposure, deviation from the illustrative British GP template, distance from a 15:00 broadcast preference. Output is **multiple candidates**, never a single optimum.

Session times are prototype assumptions, not FIA regulations (`data/metadata/sessions.json`).

## API

- `GET /api/circuits`
- `GET /api/circuits/{id}/weather-profile`
- `GET /api/circuits/{id}/weather-by-hour`
- `GET /api/circuits/{id}/climate`
- `POST /api/scenario`
- `POST /api/optimize`

The static Pages app also has `/safety`: public F1 safety history (Bianchi 2014, VSC, halo). It is context, not race control.

## Out of scope

Forecasts, FIA race control, full 24-circuit calendars, ticket sales, telemetry, autonomous decisions.
