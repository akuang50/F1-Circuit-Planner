# F1 Weather Resilience

Historical weather scenario analysis for Formula 1 race-weekend planning.

This is **not a forecast**. It turns NOAA Integrated Surface Database (ISD) observations into counterfactual schedule questions:

> If the British Grand Prix moved from 16:00 to 13:00, how would historical precipitation, gust and visibility exposure change?

Data: [NOAA ISD on AWS Open Data](https://registry.opendata.aws/noaa-isd/).

## Demo loop

1. Open the app on Silverstone / July.
2. Read the historical hourly profile.
3. Move the race slider `16:00 → 13:00`.
4. Compare exposure deltas.
5. Generate several feasible weekend templates.
6. Read the NOAA station, years and observation count in the footer.

## Stack

- **Data:** NOAA ISD global-hourly CSV from `s3://noaa-global-hourly-pds` (same dataset as `s3://noaa-isd-pds`)
- **Station:** Church Lawford `03544099999`, ~39 km from Silverstone, 2010–2025
- **Backend:** Python, FastAPI, Polars, DuckDB
- **Frontend:** Next.js, TypeScript, Tailwind, Recharts, Leaflet

## Quick start

```bash
# Python API
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/python scripts/seed_demo_data.py   # downloads NOAA ISD if missing
cd backend && ../backend/.venv/bin/uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

Processed hourly/monthly profiles are stored in `data/processed/`. Raw yearly CSV files stay in `data/raw/` and are gitignored.

## Tests

```bash
backend/.venv/bin/python -m pytest tests -q
```

## Important language

Metrics are **historical frequencies above configurable thresholds**, not safety ratings.

Example: “27% of qualifying historical observations in the selected period recorded measurable precipitation” — not “rain risk = 27%”.
