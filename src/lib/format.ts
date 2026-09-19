/** 12'345 — Swiss grouping, the way the casino shows chips. */
export function chips(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  const sign = n < 0 ? "−" : "";
  return sign + Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

export function signed(n: number) {
  return n > 0 ? `+${chips(n)}` : chips(n);
}

export function pct(n: number | null | undefined, digits = 1) {
  return n === null || n === undefined ? "—" : `${(n * 100).toFixed(digits)}%`;
}

export function dateTime(ms: number | null | undefined) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function date(ms: number | null | undefined) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ago(ms: number | null | undefined, now: number) {
  if (!ms) return "never";
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 90) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const KIND_LABEL: Record<string, string> = {
  starter: "Welcome chips",
  bonus: "Daily bonus",
  game: "Game",
  transfer_in: "Transfer in",
  transfer_out: "Transfer out",
  shop: "Shop",
  adjustment: "Adjustment",
};
