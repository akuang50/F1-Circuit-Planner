"""FastAPI application for F1 weather-resilience planning."""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api import data_not_ready_response, router
from store import DataNotReady

app = FastAPI(
    title="F1 Weather Resilience",
    description=(
        "Historical NOAA ISD scenario analysis for Formula 1 race-weekend scheduling. "
        "This is not a weather forecast."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.exception_handler(DataNotReady)
async def not_ready(_: Request, exc: DataNotReady):
    return data_not_ready_response(exc)
