import { MONTHS, pct } from "@/lib/api";
import type { CircuitGuide } from "@/lib/circuitGuides";
import type { WeatherExposure } from "@/types/api";

export type CompoundId = 1 | 2 | 3 | 4 | 5;
export type RainTyre = "slicks" | "intermediates" | "wets" | "crossover";

export type TireAdvice = {
  slicks: [CompoundId, CompoundId];
  rainTyre: RainTyre;
  wetScore: number;
  precipUsable: boolean;
  headline: string;
  detail: string;
  reasons: string[];
};

const CLIMATE_WET: Record<CircuitGuide["wetTendency"], number> = {
  rare: 0.05,
  occasional: 0.18,
  frequent: 0.38,
  "seasonal-storms": 0.32,
};

function clampCompound(value: number): CompoundId {
  return Math.min(5, Math.max(1, Math.round(value))) as CompoundId;
}

export function precipIsUsable(rain: number | null | undefined): boolean {
  if (rain == null || Number.isNaN(rain)) return false;
  return rain > 0.02 && rain < 0.97;
}

export function adviseTires(
  guide: CircuitGuide,
  exposure: WeatherExposure,
  month: number,
): TireAdvice {
  const climate =
    guide.wetTendency === "seasonal-storms" && !guide.stormMonths.includes(month)
      ? CLIMATE_WET["occasional"]
      : CLIMATE_WET[guide.wetTendency];
  const precipUsable = precipIsUsable(exposure.precipitation);
  const wetScore = precipUsable ? climate * 0.35 + exposure.precipitation * 0.65 : climate;
  const heat = exposure.temperature_extreme;
  const vis = exposure.low_visibility;
  const vol = exposure.volatility;

  let [lo, hi] = guide.typicalSlicks;
  if (heat > 0.45) {
    lo = Math.max(1, lo - 1);
    hi = Math.max(lo, hi - 1);
  } else if (heat < 0.07 && wetScore < 0.22 && guide.energy !== "high") {
    lo = Math.min(5, lo + 1);
    hi = Math.min(5, hi + 1);
  }
  const slicks: [CompoundId, CompoundId] = [clampCompound(lo), clampCompound(Math.max(lo, hi))];

  let rainTyre: RainTyre = "slicks";
  if (wetScore >= 0.52 || vis > 0.18) rainTyre = "wets";
  else if (wetScore >= 0.28) rainTyre = "crossover";
  else if (wetScore >= 0.16) rainTyre = "intermediates";

  const monthName = MONTHS[month - 1];
  const slickLabel =
    slicks[0] === slicks[1] ? `C${slicks[0]}` : `C${slicks[0]}–C${slicks[1]}`;
  const rainLabel =
    rainTyre === "wets"
      ? "full wets in play"
      : rainTyre === "crossover"
        ? "intermediates, with a slick crossover if a sector dries"
        : rainTyre === "intermediates"
          ? "keep intermediates ready"
          : "dry allocation; rain tyres as contingency";

  const reasons: string[] = [];
  reasons.push(
    precipUsable
      ? `NOAA ISD rain in the ${monthName} afternoon window: ${pct(exposure.precipitation)} of hours.`
      : `ISD precipitation for this pin is missing or stuck, so the wet call leans on ${guide.climateFamily} climatology, not a rain percentage.`,
  );
  if (heat > 0.2) {
    reasons.push(
      `High-temperature hours: ${pct(heat)}. Harder slicks (${slickLabel}) to survive thermal degradation.`,
    );
  } else if (heat < 0.08) {
    reasons.push(
      `Hot-threshold hours are rare (${pct(heat)}). The dry set shifts softer so the tyre can reach temperature.`,
    );
  } else {
    reasons.push(`Temperature extremes are moderate (${pct(heat)}). Typical dry set for this layout: ${slickLabel}.`);
  }
  if (guide.altitudeM >= 1500) {
    reasons.push(
      `Altitude ${guide.altitudeM.toLocaleString()} m: less air to cool the belt. Overheating and graining beat “which C compound” as the real failure mode.`,
    );
  }
  if (guide.energy === "high" && wetScore < 0.25) {
    reasons.push("High-energy corners (lateral + braking) keep the dry set on the hard side even if the air is mild.");
  }
  if (guide.surface === "abrasive") {
    reasons.push("Abrasive asphalt wears the softer dry tyres even when the sky is clear.");
  } else if (guide.surface === "smooth-street") {
    reasons.push("Polished street paint is low-energy when dry and ice when damp — the compound jump is larger than on a permanent circuit.");
  }
  if (vol > 0.22) {
    reasons.push(
      `Hour-to-hour volatility is ${pct(vol)}. That is a mixed-tyre weekend, not a single nomination.`,
    );
  }
  if (vis > 0.08) {
    reasons.push(`Low-visibility hours ${pct(vis)}: spray and mist, not just a damp racing line.`);
  }

  const headline = `${monthName}: ${slickLabel} dry, ${rainLabel}`;
  const detail = `${guide.tireCopy} This is a climate reading, not Pirelli’s allocation and not a race-day call.`;

  return { slicks, rainTyre, wetScore, precipUsable, headline, detail, reasons };
}

export const COMPOUND_LABELS: Record<CompoundId, { name: string; hint: string; color: string }> = {
  1: { name: "C1", hint: "Hardest dry", color: "#d4d4d8" },
  2: { name: "C2", hint: "Hard dry", color: "#f5f5f4" },
  3: { name: "C3", hint: "Medium dry", color: "#f2b90d" },
  4: { name: "C4", hint: "Soft dry", color: "#e10600" },
  5: { name: "C5", hint: "Softest dry", color: "#fb7185" },
};
