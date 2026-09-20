export const CIRCUIT_SELECT_EVENT = "f1-select-circuit";

export function selectCircuit(id: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CIRCUIT_SELECT_EVENT, { detail: { id } }));
}

export function layoutHref(circuitId: string): string {
  return `/?circuit=${circuitId}#layout`;
}
