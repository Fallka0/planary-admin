// Swiss formats for the Console's new pages: 12’480, CHF 228.00, 20.10.2026, 24-hour times.
// (The Casino pages keep their own helpers in format.ts.)

const ZONE = "Europe/Zurich";

export function num(n: number | null | undefined) {
  if (n === null || n === undefined) return "–";
  const sign = n < 0 ? "−" : "";
  return sign + Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
}

export function signedNum(n: number) {
  return n > 0 ? `+${num(n)}` : num(n);
}

/** Rappen → "CHF 228.00" */
export function chf(rappen: number) {
  const francs = Math.floor(Math.abs(rappen) / 100);
  const cents = String(Math.abs(rappen) % 100).padStart(2, "0");
  return `${rappen < 0 ? "−" : ""}CHF ${num(francs)}.${cents}`;
}

/** Rappen → "228" (whole francs, for tables). */
export function francs(rappen: number) {
  return num(Math.round(rappen / 100));
}

/** Bytes → "4.2 GB", "820 MB" (powers of 1024, as Vault's quotas are). */
export function bytes(n: number | null | undefined) {
  if (n === null || n === undefined) return "–";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${i === 0 || v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function pct(share: number | null | undefined, digits = 2) {
  if (share === null || share === undefined) return "–";
  const v = share * 100;
  // 100% and 99.98%: drop trailing zeros the way the status page shows uptime.
  return `${Number(v.toFixed(digits))}%`;
}

function parts(ms: number) {
  const f = new Intl.DateTimeFormat("de-CH", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { y: p.year, m: p.month, d: p.day, h: p.hour, min: p.minute };
}

/** 20:02 */
export function time(ms: number) {
  const p = parts(ms);
  return `${p.h}:${p.min}`;
}

/** 21.09. */
export function dayMonth(ms: number) {
  const p = parts(ms);
  return `${p.d}.${p.m}.`;
}

/** 03.02.2026 */
export function date(ms: number | null | undefined) {
  if (!ms) return "–";
  const p = parts(ms);
  return `${p.d}.${p.m}.${p.y}`;
}

/** 20.10. 20:09 */
export function dayTime(ms: number) {
  return `${dayMonth(ms)} ${time(ms)}`;
}

function sameDay(a: number, b: number) {
  const x = parts(a);
  const y = parts(b);
  return x.y === y.y && x.m === y.m && x.d === y.d;
}

/** "20:02" today, "yesterday", else "18.10." */
export function shortWhen(ms: number, now: number) {
  if (sameDay(ms, now)) return time(ms);
  if (sameDay(ms, now - 86_400_000)) return "yesterday";
  return dayMonth(ms);
}

/** "now", "5 min ago", "2 h ago", "yesterday", "18.10." */
export function ago(ms: number | null | undefined, now: number) {
  if (!ms) return "never";
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 90) return "now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  if (sameDay(ms, now)) return `${Math.round(m / 60)} h ago`;
  if (sameDay(ms, now - 86_400_000)) return "yesterday";
  return dayMonth(ms);
}

/** "today", "yesterday" or "12.10." (member lists) */
export function lastSeen(ms: number | null | undefined, now: number) {
  if (!ms) return "never";
  if (sameDay(ms, now)) return "today";
  if (sameDay(ms, now - 86_400_000)) return "yesterday";
  return dayMonth(ms);
}

/** 12 min, 1 h 12 min */
export function duration(ms: number) {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Mykyta Pantelei → Mykyta P. */
export function shortName(name: string) {
  const [first, ...rest] = name.split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
}

export const PLAN_NAME = { gratis: "Gratis", plus: "Plus" } as const;
export const ROLE_NAME = { owner: "Owner", manager: "Manager", support: "Support", viewer: "Viewer" } as const;
