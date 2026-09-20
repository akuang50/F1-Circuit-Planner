"use client";

import { MONTHS, pct } from "@/lib/api";
import { climateForMonth, degC, extrasFor, latestMeeting, mm } from "@/lib/extras";
import type { CircuitExtras, ExtrasDataset } from "@/types/api";

export function RaceClimatePanel({
  circuitId,
  month,
  extras,
}: {
  circuitId: string;
  month: number;
  extras: ExtrasDataset | CircuitExtras | null;
}) {
  const circuit = extras && "circuits" in extras ? extrasFor(extras, circuitId) : extras;
  const sources = extras && "circuits" in extras ? extras.sources : [];
  const rainDayMm = extras && "circuits" in extras ? extras.rain_day_mm : 1;
  const period = extras && "circuits" in extras ? extras.period : null;
  if (!circuit) return null;

  const climate = climateForMonth(circuit, month);
  const summary = circuit.race_day_summary;
  const recent = [...circuit.race_days].slice(-12).reverse();
  const meeting = latestMeeting(circuit);
  const monthName = MONTHS[month - 1];

  return (
    <section id="datasets" className="scroll-mt-24 rounded-3xl border border-stroke bg-panel p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">ERA5 · race Sundays · OpenF1</p>
          <h2 className="mt-1 text-2xl">What extra public datasets add</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            NOAA ISD is still the hourly scheduler. Open-Meteo ERA5 fills rain-day climate when the station precip field
            is stuck, Jolpica supplies actual GP dates, and OpenF1 adds 2023+ track temperature. None of this is a
            forecast.
          </p>
        </div>
        {period ? (
          <p className="font-mono text-xs text-muted">
            ERA5 {period.start.slice(0, 4)}–{period.end.slice(0, 4)} · rain day ≥ {rainDayMm} mm
          </p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-stroke bg-black/30 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">{monthName} ERA5 climate</p>
          {climate ? (
            <>
              <p className="mt-2 text-3xl font-medium">{pct(climate.rain_day_fraction)}</p>
              <p className="text-sm text-muted">
                of days at the circuit saw ≥{rainDayMm} mm ({climate.rain_days} of {climate.days})
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <Stat label="Mean daily rain" value={mm(climate.mean_precip_mm)} />
                <Stat label="Mean temp" value={degC(climate.mean_temp_c)} />
                <Stat label="Typical max" value={degC(climate.max_temp_c)} />
                <Stat label="Wind max" value={climate.mean_wind_kmh != null ? `${climate.mean_wind_kmh.toFixed(0)} km/h` : "—"} />
                <Stat
                  label="Sunrise / sunset"
                  value={
                    climate.median_sunrise && climate.median_sunset
                      ? `${climate.median_sunrise}–${climate.median_sunset}`
                      : "—"
                  }
                />
                <Stat
                  label="Daylight"
                  value={climate.daylight_hours != null ? `${climate.daylight_hours.toFixed(1)} h` : "—"}
                />
              </dl>
              {climate.storm_day_fraction != null && climate.storm_day_fraction >= 0.03 ? (
                <p className="mt-3 text-xs text-amber">
                  Thunderstorm codes on {pct(climate.storm_day_fraction)} of {monthName} days.
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">No ERA5 month row for this circuit yet.</p>
          )}
        </article>

        <article className="rounded-2xl border border-stroke bg-black/30 p-4 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Race-day ERA5 (Jolpica dates)</p>
          {summary.races ? (
            <>
              <p className="mt-2 text-3xl font-medium">{pct(summary.wet_fraction)}</p>
              <p className="text-sm text-muted">
                of {summary.races} Grands Prix since {summary.first_season} had ≥{rainDayMm} mm on Sunday
                {summary.mean_temp_c != null ? ` · mean race-day air ${degC(summary.mean_temp_c)}` : ""}
              </p>
              <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                {recent.map((race) => (
                  <li
                    key={`${race.season}-${race.round}`}
                    className="flex items-baseline justify-between gap-3 rounded-xl border border-stroke px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-mono text-xs text-muted">{race.season}</span>{" "}
                      {race.wet === true ? "Wet climate day" : race.wet === false ? "Dry climate day" : "ERA5 not yet in"}
                      {race.winner ? <span className="text-muted"> · {race.winner}</span> : null}
                    </span>
                    <span className={`font-mono text-xs ${race.wet ? "text-teal" : "text-muted"}`}>
                      {mm(race.precip_mm, 1)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              No World Championship races at this venue in the Jolpica 2010– window.
            </p>
          )}
        </article>
      </div>

      {meeting ? (
        <article className="mt-6 rounded-2xl border border-stroke bg-black/30 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">OpenF1 session weather</p>
          <h3 className="mt-1 text-lg">
            {meeting.year} {meeting.meeting_name ?? "Grand Prix"}
          </h3>
          <p className="mt-1 text-sm text-muted">
            Track {degC(meeting.mean_track_temp_c)} · air {degC(meeting.mean_air_temp_c)} · humidity{" "}
            {meeting.mean_humidity != null ? `${meeting.mean_humidity.toFixed(0)}%` : "—"} · rain flag{" "}
            {pct(meeting.rainfall_fraction)} of {meeting.samples.toLocaleString()} samples
          </p>
          {meeting.sessions?.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.16em] text-muted">
                  <tr>
                    <th className="pb-2">Session</th>
                    <th className="pb-2">Track</th>
                    <th className="pb-2">Air</th>
                    <th className="pb-2">Rain flag</th>
                    <th className="pb-2">n</th>
                  </tr>
                </thead>
                <tbody>
                  {meeting.sessions.map((session) => (
                    <tr key={session.name} className="border-t border-stroke">
                      <td className="py-2">{session.name}</td>
                      <td className="py-2 font-mono">{degC(session.mean_track_temp_c)}</td>
                      <td className="py-2 font-mono">{degC(session.mean_air_temp_c)}</td>
                      <td className="py-2 font-mono">{pct(session.rainfall_fraction)}</td>
                      <td className="py-2 font-mono text-muted">{session.samples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      ) : (
        <p className="mt-6 text-sm text-muted">OpenF1 coverage starts in 2023; this venue has no session-weather rows yet.</p>
      )}

      {sources.length ? (
        <ul className="mt-5 space-y-1 text-xs leading-5 text-muted">
          {sources.map((source) => (
            <li key={source.id}>
              <a className="text-teal underline-offset-2 hover:underline" href={source.url}>
                {source.name}
              </a>
              {" — "}
              {source.note}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="font-mono text-sm text-foreground">{value}</dd>
    </div>
  );
}
