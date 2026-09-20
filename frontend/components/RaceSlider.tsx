"use client";

import { hourLabel } from "@/lib/api";

export function RaceSlider({
  value,
  onChange,
  min = 12,
  max = 16,
  step = 0.25,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const ticks = [];
  for (let h = min; h <= max; h += 1) ticks.push(h);
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Race start</p>
          <p className="mt-1 font-mono text-4xl tabular-nums text-white">{hourLabel(value)}</p>
        </div>
        <p className="text-right text-xs text-muted">
          Local time
          <br />
          {hourLabel(min)}–{hourLabel(max)}
        </p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#e10600]"
        aria-label="Race start time"
      />
      <div className="flex justify-between font-mono text-[11px] tabular-nums text-muted">
        {ticks.map((tick) => (
          <span key={tick}>{hourLabel(tick)}</span>
        ))}
      </div>
    </div>
  );
}
