from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from ingest_extras import (  # noqa: E402
    is_fog_code,
    is_rain_day,
    is_storm_code,
    join_race_days,
    map_jolpica_circuit,
    map_openf1_meeting,
    monthly_climate,
    session_label,
    summarize_race_days,
    summarize_weather_rows,
)


def test_jolpica_circuit_map():
    assert map_jolpica_circuit("silverstone") == "silverstone"
    assert map_jolpica_circuit("villeneuve") == "montreal"
    assert map_jolpica_circuit("americas") == "cota"
    assert map_jolpica_circuit("rodriguez") == "mexico"
    assert map_jolpica_circuit("losail") == "lusail"
    assert map_jolpica_circuit("vegas") == "las-vegas"
    assert map_jolpica_circuit("madring") == "madring"
    assert map_jolpica_circuit("nurburgring") is None


def test_openf1_location_map():
    assert map_openf1_meeting("Silverstone") == "silverstone"
    assert map_openf1_meeting("Spa-Francorchamps") == "spa"
    assert map_openf1_meeting("São Paulo") == "interlagos"
    assert map_openf1_meeting("Yas Island", "Yas Marina") == "yas-marina"
    assert map_openf1_meeting(meeting_name="FORMULA 1 QATAR AIRWAYS BRITISH GRAND PRIX 2024") == "silverstone"
    assert map_openf1_meeting(meeting_name="FORMULA 1 SPANISH GRAND PRIX 2024") == "barcelona"
    assert map_openf1_meeting("Madrid", meeting_name="Spanish Grand Prix") == "madring"
    assert map_openf1_meeting("Unknownville") is None


def test_rain_and_weather_codes():
    assert is_rain_day(1.0)
    assert is_rain_day(0.9) is False
    assert is_rain_day(None) is False
    assert is_storm_code(95)
    assert is_storm_code(3) is False
    assert is_fog_code(45)
    assert is_fog_code(61) is False


def test_monthly_climate_aggregates_rain_days_and_daylight():
    days = [
        {
            "date": "2024-07-01",
            "precip_mm": 4.2,
            "temp_mean_c": 16.0,
            "temp_max_c": 20.0,
            "temp_min_c": 12.0,
            "wind_max_kmh": 22.0,
            "gust_max_kmh": 40.0,
            "precip_hours": 6.0,
            "daylight_hours": 16.5,
            "sunrise_min": 5 * 60,
            "sunset_min": 21 * 60 + 20,
            "weather_code": 61,
        },
        {
            "date": "2024-07-02",
            "precip_mm": 0.2,
            "temp_mean_c": 18.0,
            "temp_max_c": 22.0,
            "temp_min_c": 13.0,
            "wind_max_kmh": 18.0,
            "gust_max_kmh": 30.0,
            "precip_hours": 0.0,
            "daylight_hours": 16.4,
            "sunrise_min": 5 * 60 + 2,
            "sunset_min": 21 * 60 + 18,
            "weather_code": 1,
        },
    ]
    rows = monthly_climate(days)
    july = next(row for row in rows if row["month"] == 7)
    assert july["days"] == 2
    assert july["rain_days"] == 1
    assert july["rain_day_fraction"] == 0.5
    assert july["median_sunrise"] == "05:01"
    assert july["daylight_hours"] == 16.4


def test_join_race_days_marks_wet_from_era5():
    races = [
        {"season": 2021, "round": 10, "date": "2021-07-18", "event": "British Grand Prix", "winner": "Lewis Hamilton"},
        {"season": 2022, "round": 10, "date": "2022-07-03", "event": "British Grand Prix", "winner": "Carlos Sainz"},
    ]
    daily = {
        "2021-07-18": {"precip_mm": 8.4, "temp_mean_c": 15.1, "weather_code": 81},
        "2022-07-03": {"precip_mm": 0.0, "temp_mean_c": 19.2, "weather_code": 1},
    }
    joined = join_race_days(races, daily)
    assert joined[0]["wet"] is True
    assert joined[1]["wet"] is False
    missing = join_race_days(
        [{"season": 2026, "round": 9, "date": "2026-07-05", "event": "British Grand Prix"}],
        {},
    )
    assert missing[0]["wet"] is None
    summary = summarize_race_days(joined + missing)
    assert summary["races"] == 2
    assert summary["wet_races"] == 1
    assert summary["wet_fraction"] == 0.5


def test_openf1_weather_summary_and_session_labels():
    rows = [
        {"rainfall": 1, "track_temperature": 22.0, "air_temperature": 16.0, "humidity": 80, "wind_speed": 4.0},
        {"rainfall": 0, "track_temperature": 28.0, "air_temperature": 18.0, "humidity": 70, "wind_speed": 2.0},
    ]
    summary = summarize_weather_rows(rows)
    assert summary is not None
    assert summary["samples"] == 2
    assert summary["rainfall_fraction"] == 0.5
    assert summary["mean_track_temp_c"] == 25.0
    assert session_label("Race", "Race") == "Race"
    assert session_label("Practice 1", None) == "FP1"
    assert summarize_weather_rows([]) is None
