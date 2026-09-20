export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function pct(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function pp(delta: number, digits = 0): string {
  const value = (delta * 100).toFixed(digits);
  const n = Number(value);
  if (n === 0) return `${digits ? (0).toFixed(digits) : "0"} pp`;
  return `${n > 0 ? "+" : ""}${value} pp`;
}

export function hourLabel(hour: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseHour(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h + m / 60;
}
