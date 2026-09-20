from fastapi.responses import JSONResponse

from analytics import exposure_for_window, flexibility_window, volatility_label
from config import circuit_by_id, circuits, session_catalog, thresholds
from models import (
    CandidateSchedule,
    Circuit,
    ClimateProfileResponse,
    Flexibility,
    HourlyProfile,
    MonthlyExposure,
    OptimizeRequest,
    OptimizeResponse,
    ScenarioRequest,
    ScenarioResponse,
    StationProvenance,
    WeatherByHourResponse,
    WeatherExposure,
    WeatherProfileResponse,
)
from optimizer import optimize
from store import DataNotReady, hourly_rows, monthly_rows, provenance

from fastapi import APIRouter, HTTPException

router = APIRouter()


def _circuit(circuit_id: str) -> Circuit:
    try:
        return Circuit(**circuit_by_id(circuit_id))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


def _prov(circuit_id: str) -> StationProvenance:
    payload = provenance(circuit_id)
    payload.pop("circuit", None)
    return StationProvenance(**payload)


def _exposure(raw: dict) -> WeatherExposure:
    return WeatherExposure(**raw)


def _parse_hhmm(value: str) -> float:
    try:
        hours, minutes = value.split(":")
        hour = int(hours)
        minute = int(minutes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Times must use HH:MM") from exc
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise HTTPException(status_code=422, detail="Invalid clock time")
    return hour + minute / 60.0


@router.get("/health")
def health():
    return {"status": "ok", "mode": "historical", "forecast": False}


@router.get("/circuits")
def list_circuits():
    return {"circuits": circuits(), "mode": "historical"}


@router.get("/circuits/{circuit_id}/weather-profile", response_model=WeatherProfileResponse)
def weather_profile(circuit_id: str, month: int = 7, start_hour: int = 12, end_hour: int = 18):
    if month < 1 or month > 12:
        raise HTTPException(status_code=422, detail="month must be 1-12")
    if not (0 <= start_hour <= 23 and 0 <= end_hour <= 24 and start_hour < end_hour):
        raise HTTPException(status_code=422, detail="invalid hour window")
    circuit = _circuit(circuit_id)
    hourly = hourly_rows(month)
    duration = max(60, (end_hour - start_hour) * 60)
    exposure = exposure_for_window(hourly, month, float(start_hour), duration)
    flex = flexibility_window(hourly, month, 120, range(12, 18))
    vol = exposure["volatility"]
    return WeatherProfileResponse(
        circuit=circuit,
        month=month,
        start_hour=start_hour,
        end_hour=end_hour,
        exposure=_exposure(exposure),
        flexibility=Flexibility(**flex),
        volatility_label=volatility_label(vol),  # type: ignore[arg-type]
        provenance=_prov(circuit_id),
    )


@router.get("/circuits/{circuit_id}/weather-by-hour", response_model=WeatherByHourResponse)
def weather_by_hour(circuit_id: str, month: int = 7):
    if month < 1 or month > 12:
        raise HTTPException(status_code=422, detail="month must be 1-12")
    circuit = _circuit(circuit_id)
    hours = [HourlyProfile(**row) for row in hourly_rows(month)]
    return WeatherByHourResponse(
        circuit=circuit,
        month=month,
        hours=hours,
        provenance=_prov(circuit_id),
    )


@router.get("/circuits/{circuit_id}/climate", response_model=ClimateProfileResponse)
def climate_profile(circuit_id: str):
    circuit = _circuit(circuit_id)
    months = [MonthlyExposure(**row) for row in monthly_rows()]
    return ClimateProfileResponse(circuit=circuit, months=months, provenance=_prov(circuit_id))


@router.post("/scenario", response_model=ScenarioResponse)
def scenario(req: ScenarioRequest):
    circuit = _circuit(req.circuit)
    hourly = hourly_rows(req.month)
    original = exposure_for_window(
        hourly, req.month, _parse_hhmm(req.original_start), req.duration_minutes
    )
    alternative = exposure_for_window(
        hourly, req.month, _parse_hhmm(req.alternative_start), req.duration_minutes
    )
    keys = [
        "precipitation",
        "strong_wind",
        "strong_gust",
        "low_visibility",
        "temperature_extreme",
        "volatility",
    ]
    delta = {key: round(alternative[key] - original[key], 4) for key in keys}
    return ScenarioResponse(
        circuit=circuit,
        month=req.month,
        original_start=req.original_start,
        alternative_start=req.alternative_start,
        duration_minutes=req.duration_minutes,
        original=_exposure(original),
        alternative=_exposure(alternative),
        delta=delta,
        provenance=_prov(req.circuit),
    )


@router.post("/optimize", response_model=OptimizeResponse)
def optimize_weekend(req: OptimizeRequest):
    circuit = _circuit(req.circuit)
    hourly = hourly_rows(req.month)
    weights = req.weights.model_dump()
    baseline, candidates = optimize(hourly, req.month, weights, req.sessions)
    return OptimizeResponse(
        circuit=circuit,
        month=req.month,
        baseline=CandidateSchedule(**baseline),
        candidates=[CandidateSchedule(**c) for c in candidates],
        provenance=_prov(req.circuit),
    )


@router.get("/sessions")
def sessions():
    return session_catalog()


@router.get("/thresholds")
def get_thresholds():
    return thresholds()


def data_not_ready_response(exc: DataNotReady) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(exc)})
