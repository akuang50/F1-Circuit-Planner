"""Constraint-aware weekend schedule search.

Returns several feasible candidates rather than a single purported optimum.
Session windows and gaps are prototype assumptions, not FIA regulations.
"""

from __future__ import annotations

from itertools import product

from analytics import exposure_for_window, weather_cost
from config import session_catalog

PREFERRED_BROADCAST_START = 15.0  # local hour, illustrative TV window


def _parse_hhmm(value: str) -> float:
    hours, minutes = value.split(":")
    return int(hours) + int(minutes) / 60.0


def _format_hhmm(value: float) -> str:
    hours = int(value) % 24
    minutes = int(round((value - int(value)) * 60)) % 60
    if minutes == 60:
        hours = (hours + 1) % 24
        minutes = 0
    return f"{hours:02d}:{minutes:02d}"


def _relative_band(value: float, values: list[float]) -> str:
    lo, hi = min(values), max(values)
    if hi - lo < 1e-9:
        return "LOW"
    t = (value - lo) / (hi - lo)
    if t <= 0.15:
        return "VERY LOW"
    if t <= 0.4:
        return "LOW"
    if t <= 0.7:
        return "MEDIUM"
    return "HIGH"


def session_defs(selected: list[str] | None = None) -> list[dict]:
    catalog = session_catalog()
    sessions = catalog["sessions"]
    if selected:
        wanted = set(selected)
        sessions = [s for s in sessions if s["id"] in wanted]
    return sessions


def candidate_starts(session: dict, step_minutes: int) -> list[float]:
    earliest = _parse_hhmm(session["earliest_start"])
    latest_end = _parse_hhmm(session["latest_end"])
    duration_h = session["duration_minutes"] / 60.0
    latest_start = latest_end - duration_h
    starts = []
    t = earliest
    step = step_minutes / 60.0
    while t <= latest_start + 1e-9:
        starts.append(round(t, 4))
        t += step
    return starts


def overlaps(a_start: float, a_dur: int, b_start: float, b_dur: int, gap_minutes: int) -> bool:
    a_end = a_start + a_dur / 60.0
    b_end = b_start + b_dur / 60.0
    gap_h = gap_minutes / 60.0
    return not (a_end + gap_h <= b_start or b_end + gap_h <= a_start)


def is_feasible(assignment: dict[str, float], sessions: list[dict], gap_minutes: int) -> bool:
    by_id = {s["id"]: s for s in sessions}
    for session in sessions:
        start = assignment[session["id"]]
        end = start + session["duration_minutes"] / 60.0
        if start < _parse_hhmm(session["earliest_start"]) - 1e-9:
            return False
        if end > _parse_hhmm(session["latest_end"]) + 1e-9:
            return False
        for dep in session["required_after"]:
            if dep not in assignment:
                continue
            other = by_id[dep]
            if other["day_offset"] == session["day_offset"]:
                dep_end = assignment[dep] + other["duration_minutes"] / 60.0
                if dep_end > start + 1e-9:
                    return False
            elif other["day_offset"] > session["day_offset"]:
                return False
    for i, a in enumerate(sessions):
        for b in sessions[i + 1 :]:
            if a["day_offset"] != b["day_offset"]:
                continue
            if overlaps(
                assignment[a["id"]],
                a["duration_minutes"],
                assignment[b["id"]],
                b["duration_minutes"],
                gap_minutes,
            ):
                return False
    return True


def enumerate_schedules(sessions: list[dict], gap_minutes: int, step_minutes: int) -> list[dict[str, float]]:
    options = [candidate_starts(s, step_minutes) for s in sessions]
    feasible = []
    ids = [s["id"] for s in sessions]
    for combo in product(*options):
        assignment = dict(zip(ids, combo))
        if is_feasible(assignment, sessions, gap_minutes):
            feasible.append(assignment)
    return feasible


def baseline_assignment(sessions: list[dict]) -> dict[str, float]:
    return {s["id"]: _parse_hhmm(s["baseline_start"]) for s in sessions}


def deviation_cost(assignment: dict[str, float], baseline: dict[str, float]) -> float:
    if not assignment:
        return 0.0
    return sum(abs(assignment[k] - baseline[k]) for k in assignment) / (len(assignment) * 6.0)


def broadcast_cost(assignment: dict[str, float], sessions: list[dict]) -> float:
    race = next((s for s in sessions if s["id"] == "race"), None)
    if race is None or "race" not in assignment:
        quali = next((s for s in sessions if s["id"] == "qualifying"), None)
        if quali is None or "qualifying" not in assignment:
            return 0.0
        return min(1.0, abs(assignment["qualifying"] - PREFERRED_BROADCAST_START) / 6.0)
    return min(1.0, abs(assignment["race"] - PREFERRED_BROADCAST_START) / 6.0)


def schedule_exposure(assignment: dict[str, float], sessions: list[dict], hourly: list[dict], month: int) -> dict:
    parts = []
    for session in sessions:
        exp = exposure_for_window(
            hourly, month, assignment[session["id"]], session["duration_minutes"]
        )
        parts.append((exp, session["duration_minutes"]))
    total_min = sum(m for _, m in parts) or 1
    merged = {
        "precipitation": 0.0,
        "strong_wind": 0.0,
        "strong_gust": 0.0,
        "low_visibility": 0.0,
        "temperature_extreme": 0.0,
        "volatility": 0.0,
        "observation_count": 0,
        "limited_sample": False,
    }
    for exp, minutes in parts:
        w = minutes / total_min
        for key in (
            "precipitation",
            "strong_wind",
            "strong_gust",
            "low_visibility",
            "temperature_extreme",
            "volatility",
        ):
            merged[key] += exp[key] * w
        merged["observation_count"] += exp["observation_count"]
    merged["limited_sample"] = merged["observation_count"] < 200
    return merged


def score_assignment(
    assignment: dict[str, float],
    sessions: list[dict],
    hourly: list[dict],
    month: int,
    weights: dict,
    baseline: dict[str, float],
) -> dict:
    exposure = schedule_exposure(assignment, sessions, hourly, month)
    w_cost = weather_cost(exposure, weights)
    d_cost = deviation_cost(assignment, baseline)
    b_cost = broadcast_cost(assignment, sessions)
    total = (
        w_cost
        + weights.get("schedule_deviation", 0.6) * d_cost
        + weights.get("broadcast", 0.4) * b_cost
    )
    return {
        "assignment": assignment,
        "exposure": exposure,
        "weather_cost": w_cost,
        "deviation_cost": d_cost,
        "broadcast_cost": b_cost,
        "total_cost": total,
    }


def _session_payload(assignment: dict[str, float], sessions: list[dict], hourly: list[dict], month: int) -> list[dict]:
    payload = []
    for session in sessions:
        start = assignment[session["id"]]
        end = start + session["duration_minutes"] / 60.0
        payload.append(
            {
                "session_id": session["id"],
                "name": session["name"],
                "day_name": session["day_name"],
                "start_time": _format_hhmm(start),
                "end_time": _format_hhmm(end),
                "duration_minutes": session["duration_minutes"],
                "exposure": exposure_for_window(
                    hourly, month, start, session["duration_minutes"]
                ),
            }
        )
    return payload


def _candidate_dict(score: dict, sessions: list[dict], hourly: list[dict], month: int, cid: str, label: str, summary: str) -> dict:
    return {
        "id": cid,
        "label": label,
        "summary": summary,
        "weather_cost": round(score["weather_cost"], 4),
        "deviation_cost": round(score["deviation_cost"], 4),
        "broadcast_cost": round(score["broadcast_cost"], 4),
        "total_cost": round(score["total_cost"], 4),
        "weather_band": "MEDIUM",
        "deviation_band": "MEDIUM",
        "sessions": _session_payload(score["assignment"], sessions, hourly, month),
        "exposure": score["exposure"],
    }


def _apply_relative_bands(payloads: list[dict]) -> None:
    weather_vals = [p["weather_cost"] for p in payloads]
    deviation_vals = [p["deviation_cost"] for p in payloads]
    for payload in payloads:
        payload["weather_band"] = _relative_band(payload["weather_cost"], weather_vals)
        payload["deviation_band"] = _relative_band(payload["deviation_cost"], deviation_vals)


def optimize(
    hourly: list[dict],
    month: int,
    weights: dict,
    selected_sessions: list[str] | None = None,
    limit: int = 5,
) -> tuple[dict, list[dict]]:
    catalog = session_catalog()
    sessions = session_defs(selected_sessions)
    gap = catalog["min_gap_minutes"]
    step = catalog["step_minutes"]
    baseline = baseline_assignment(sessions)
    if not is_feasible(baseline, sessions, gap):
        # Still expose the documented baseline; search remains among feasible grids.
        pass

    feasible = enumerate_schedules(sessions, gap, step)
    if not feasible:
        feasible = [baseline]

    scored = [
        score_assignment(a, sessions, hourly, month, weights, baseline) for a in feasible
    ]
    baseline_score = score_assignment(baseline, sessions, hourly, month, weights, baseline)

    weather_best = min(scored, key=lambda s: s["weather_cost"])
    deviation_best = min(scored, key=lambda s: s["deviation_cost"])
    balanced = min(scored, key=lambda s: s["total_cost"])
    rain_best = min(scored, key=lambda s: s["exposure"]["precipitation"])
    morning = min(
        scored,
        key=lambda s: s["assignment"].get("race", s["assignment"].get("qualifying", 24)),
    )
    late_race = max(
        scored,
        key=lambda s: s["assignment"].get("race", s["assignment"].get("qualifying", 0)),
    )

    picks = [
        (weather_best, "Lowest historical weather exposure"),
        (balanced, "Balanced weather vs schedule change"),
        (deviation_best, "Closest to the current weekend template"),
        (rain_best, "Lowest historical precipitation exposure"),
        (morning, "Earliest race/qualifying window among feasible options"),
        (late_race, "Latest feasible race window — useful broadcast comparison"),
    ]
    for score in sorted(scored, key=lambda s: s["total_cost"]):
        picks.append((score, "Another feasible trade-off on the cost surface"))

    unique = []
    seen = set()
    letters = "ABCDEFGH"
    for score, summary in picks:
        key = tuple(sorted(score["assignment"].items()))
        if key in seen:
            continue
        seen.add(key)
        letter = letters[len(unique)]
        unique.append(
            _candidate_dict(
                score,
                sessions,
                hourly,
                month,
                f"candidate-{letter.lower()}",
                f"Candidate {letter}",
                summary,
            )
        )
        if len(unique) >= limit:
            break

    baseline_payload = _candidate_dict(
        baseline_score,
        sessions,
        hourly,
        month,
        "baseline",
        "Current template",
        "Illustrative British GP weekend structure used as the reference schedule.",
    )
    _apply_relative_bands([baseline_payload, *unique])
    return baseline_payload, unique
