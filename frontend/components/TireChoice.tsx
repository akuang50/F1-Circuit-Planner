import { COMPOUND_LABELS, type TireAdvice } from "@/lib/tireAdvice";

export function TireChoice({ advice }: { advice: TireAdvice }) {
  const [lo, hi] = advice.slicks;
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-muted">Tyre call from climate + layout</p>
      <h3 className="mt-1 text-lg leading-snug">{advice.headline}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {([1, 2, 3, 4, 5] as const).map((id) => {
          const active = id >= lo && id <= hi;
          const meta = COMPOUND_LABELS[id];
          return (
            <div
              key={id}
              className={`min-w-[3.4rem] rounded-xl border px-2 py-2 text-center ${
                active ? "border-white/40 bg-white/10" : "border-stroke opacity-40"
              }`}
            >
              <div className="mx-auto h-2 w-8 rounded-full" style={{ background: meta.color }} />
              <p className="mt-1 font-mono text-sm">{meta.name}</p>
              <p className="text-[10px] text-muted">{meta.hint}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <RainChip
          label="Intermediate"
          hint="Damp film, no lakes"
          active={advice.rainTyre === "intermediates" || advice.rainTyre === "crossover"}
          color="#22c55e"
        />
        <RainChip
          label="Wet"
          hint="Standing water"
          active={advice.rainTyre === "wets" || advice.rainTyre === "crossover"}
          color="#3b82f6"
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{advice.detail}</p>
      <ul className="mt-3 space-y-1.5 text-sm leading-6 text-muted">
        {advice.reasons.map((reason) => (
          <li key={reason} className="border-l-2 border-stroke pl-3">
            {reason}
          </li>
        ))}
      </ul>
      {!advice.precipUsable ? (
        <p className="mt-3 text-xs text-amber">
          {advice.era5Used
            ? "ISD precipitation at this station is limited. The wet/dry split uses Open-Meteo ERA5 rain-day climate at the circuit, not a stuck rain percentage."
            : "ISD precipitation at this station is limited. The wet/dry split uses the circuit’s climate family instead of a rain percentage."}
        </p>
      ) : null}
    </div>
  );
}

function RainChip({
  label,
  hint,
  active,
  color,
}: {
  label: string;
  hint: string;
  active: boolean;
  color: string;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${active ? "border-white/40 bg-white/10" : "border-stroke opacity-40"}`}
    >
      <p className="flex items-center gap-2 text-sm">
        <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {label}
      </p>
      <p className="text-[10px] text-muted">{hint}</p>
    </div>
  );
}
