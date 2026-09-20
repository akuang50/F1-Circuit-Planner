import type { CandidateSchedule } from "@/types/api";
import { pct } from "@/lib/api";

export function ScheduleCard({
  schedule,
  featured = false,
}: {
  schedule: CandidateSchedule;
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        featured ? "border-f1/50 bg-f1/5" : "border-stroke bg-panel-2"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{schedule.label}</p>
          <h3 className="mt-1 text-lg">{schedule.summary}</h3>
        </div>
        <div className="text-right font-mono text-[11px] text-muted">
          <div>Weather {schedule.weather_band}</div>
          <div>Deviation {schedule.deviation_band}</div>
        </div>
      </div>
      <ol className="mt-4 space-y-2">
        {schedule.sessions.map((session) => (
          <li
            key={session.session_id}
            className="grid grid-cols-[72px_1fr_auto] items-center gap-2 border-t border-stroke/80 pt-2 text-sm"
          >
            <span className="text-muted">{session.day_name.slice(0, 3)}</span>
            <span>
              {session.name}{" "}
              <span className="font-mono text-muted">
                {session.start_time}–{session.end_time}
              </span>
            </span>
            <span className="font-mono text-xs text-muted">
              rain {pct(session.exposure.precipitation, 0)}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}
