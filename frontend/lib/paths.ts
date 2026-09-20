export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (BASE_PATH) return `${BASE_PATH}${normalized}`;
  if (typeof window !== "undefined" && window.location.hostname.endsWith("github.io")) {
    const first = window.location.pathname.split("/").filter(Boolean)[0];
    if (first) return `/${first}${normalized}`;
  }
  return normalized;
}
