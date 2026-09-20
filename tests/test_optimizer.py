from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from optimizer import (  # noqa: E402
    baseline_assignment,
    enumerate_schedules,
    is_feasible,
    optimize,
    session_defs,
)


def _hourly_flat() -> list[dict]:
    rows = []
    for month in range(1, 13):
        for hour in range(24):
            rain = 0.1 + hour * 0.02
            rows.append(
                {
                    "month": month,
                    "hour": hour,
                    "observation_count": 400,
                    "rain_probability": rain,
                    "strong_wind_probability": 0.05,
                    "strong_gust_probability": 0.08,
                    "low_visibility_probability": 0.03,
                    "high_temperature_probability": 0.02,
                    "mean_temperature": 18.0,
                    "p10_temperature": 12.0,
                    "p50_temperature": 18.0,
                    "p90_temperature": 24.0,
                    "mean_wind": 5.0,
                    "p50_wind": 4.5,
                    "p90_wind": 8.0,
                    "mean_gust": 8.0,
                    "p50_gust": 7.0,
                    "p90_gust": 12.0,
                    "median_visibility": 20000.0,
                    "p10_visibility": 8000.0,
                    "weather_change_frequency": 0.1,
                    "volatility_index": 0.15,
                    "volatility_label": "MEDIUM",
                }
            )
    return rows


def test_no_overlap_and_dependencies():
    sessions = session_defs()
    gap = 120
    assignment = {
        "fp1": 9.0,
        "fp2": 13.0,
        "fp3": 10.0,
        "qualifying": 13.0,
        "race": 15.0,
    }
    assert is_feasible(assignment, sessions, gap)
    overlapping = dict(assignment)
    overlapping["fp2"] = 10.0
    assert not is_feasible(overlapping, sessions, gap)
    race_before_quali_same_logic = dict(assignment)
    # Qualifying required before race is cross-day; swapping days would fail.
    race_before_quali_same_logic["qualifying"] = 11.0  # before FP3 end on Saturday
    assert not is_feasible(race_before_quali_same_logic, sessions, gap)


def test_valid_durations_and_windows():
    sessions = session_defs()
    feasible = enumerate_schedules(sessions, gap_minutes=120, step_minutes=30)
    assert feasible
    by_id = {s["id"]: s for s in sessions}
    for assignment in feasible[:50]:
        for session in sessions:
            start = assignment[session["id"]]
            end = start + session["duration_minutes"] / 60.0
            earliest = int(session["earliest_start"].split(":")[0]) + int(session["earliest_start"].split(":")[1]) / 60
            latest = int(session["latest_end"].split(":")[0]) + int(session["latest_end"].split(":")[1]) / 60
            assert start >= earliest - 1e-9
            assert end <= latest + 1e-9
            for dep in session["required_after"]:
                other = by_id[dep]
                if other["day_offset"] == session["day_offset"]:
                    assert assignment[dep] + other["duration_minutes"] / 60.0 <= start + 1e-9


def test_deterministic_candidates():
    hourly = _hourly_flat()
    weights = {
        "precipitation": 1.0,
        "wind": 0.5,
        "gust": 0.8,
        "visibility": 0.7,
        "temperature": 0.3,
        "volatility": 0.5,
        "schedule_deviation": 0.6,
        "broadcast": 0.4,
    }
    baseline_a, cands_a = optimize(hourly, 7, weights)
    baseline_b, cands_b = optimize(hourly, 7, weights)
    assert baseline_a["sessions"] == baseline_b["sessions"]
    assert [c["id"] for c in cands_a] == [c["id"] for c in cands_b]
    assert [c["sessions"] for c in cands_a] == [c["sessions"] for c in cands_b]
    assert len(cands_a) >= 3


def test_baseline_assignment_uses_template():
    sessions = session_defs()
    baseline = baseline_assignment(sessions)
    assert baseline["race"] == 15.0
    assert baseline["qualifying"] == 15.0
    assert baseline["fp1"] == 12.5
