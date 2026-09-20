# F1 Weather Resilience

Historical weather scenario analysis for Formula 1 race-weekend planning.

This is **not a forecast**. It turns NOAA Integrated Surface Database (ISD) observations into counterfactual schedule questions:

> If the British Grand Prix moved from 16:00 to 13:00, how would historical precipitation, gust and visibility exposure change?

Data: [NOAA ISD on AWS Open Data](https://registry.opendata.aws/noaa-isd/).

## GitHub Pages

The planner is a static Next.js export. NOAA hourly/monthly profiles ship as `frontend/public/data/app.json`. The weekend optimizer runs in the browser, so GitHub Pages does not need FastAPI.

Live URL after Pages is enabled: `https://<user>.github.io/<repo>/`

1. Merge this branch (or push to `main`).
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. The workflow `.github/workflows/pages.yml` builds `frontend/` with `NEXT_PUBLIC_BASE_PATH=/<repo>` and deploys `frontend/out`.

Local preview of the same static export:

```bash
cd frontend
npm install
npm run build
npx --yes serve out
```

To mimic a project-pages URL (`/f1-circuit-planner/`):

```bash
cd frontend
NEXT_PUBLIC_BASE_PATH=/f1-circuit-planner npm run build
mkdir -p /tmp/pages-preview/f1-circuit-planner
cp -R out/. /tmp/pages-preview/f1-circuit-planner/
npx --yes serve /tmp/pages-preview
# open http://localhost:3000/f1-circuit-planner/
```

Refresh `app.json` after regenerating parquet profiles:

```bash
python3 scripts/export_static_data.py
```

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
- **Static app:** Next.js export, TypeScript optimizer, Tailwind, Leaflet
- **Optional pipeline:** Python, FastAPI, Polars, DuckDB (download/parse NOAA ISD and rebuild JSON)

## Local development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Profiles load from `/data/app.json`; no API process is required.

Optional Python API (rebuilds features / serves the same analytics over HTTP):

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/python scripts/seed_demo_data.py   # downloads NOAA ISD if missing
python3 scripts/export_static_data.py
cd backend && ../backend/.venv/bin/uvicorn main:app --reload --port 8000
```

Processed hourly/monthly profiles are stored in `data/processed/`. Raw yearly CSV files stay in `data/raw/` and are gitignored.

## Tests

```bash
backend/.venv/bin/python -m pytest tests -q
```

## Important language

Metrics are **historical frequencies above configurable thresholds**, not safety ratings.

Example: “27% of qualifying historical observations in the selected period recorded measurable precipitation” — not “rain risk = 27%”.
