from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from isd import (  # noqa: E402
    haversine_km,
    localize,
    parse_gust,
    parse_precip_aa1,
    parse_timestamp_utc,
    parse_tmp,
    parse_vis,
    parse_wnd,
    weather_code_precip,
)


def test_parse_temperature():
    assert parse_tmp("+0075,1") == 7.5
    assert parse_tmp("-0012,1") == -1.2
    assert parse_tmp("+9999,9") is None
    assert parse_tmp("+1500,1") is None  # physically impossible


def test_parse_wind():
    direction, speed = parse_wnd("250,1,N,0051,1")
    assert direction == 250
    assert speed == pytest.approx(5.1)
    assert parse_wnd("999,9,9,9999,9") == (None, None)


def test_parse_visibility():
    assert parse_vis("055000,1,9,9") == 55000
    assert parse_vis("999999,9,9,9") is None


def test_parse_precipitation_one_hour_only():
    assert parse_precip_aa1("01,0000,9,1") == 0.0
    assert parse_precip_aa1("01,0012,9,1") == pytest.approx(1.2)
    assert parse_precip_aa1("06,0012,9,1") is None
    assert parse_precip_aa1("01,9999,9,1") is None


def test_parse_gust_prefers_oc1():
    assert parse_gust("0120,1", "4,99,0103,1,999") == pytest.approx(12.0)
    assert parse_gust("", "4,99,0103,1,999") == pytest.approx(10.3)


def test_weather_code_precip():
    assert weather_code_precip("61,1") is True
    assert weather_code_precip("00,1") is False
    assert weather_code_precip(None) is None


def test_local_timezone_handles_bst():
    utc = parse_timestamp_utc("2024-07-07T14:00:00")
    local = localize(utc, "Europe/London")
    assert local.tzinfo == ZoneInfo("Europe/London")
    assert local.hour == 15  # BST is UTC+1
    assert utc.tzinfo == timezone.utc


def test_winter_gmt():
    utc = parse_timestamp_utc("2024-01-01T14:00:00")
    local = localize(utc, "Europe/London")
    assert local.hour == 14


def test_haversine_church_lawford_to_silverstone():
    km = haversine_km(52.0736, -1.0169, 52.3666666, -1.3333333)
    assert 38 < km < 41
