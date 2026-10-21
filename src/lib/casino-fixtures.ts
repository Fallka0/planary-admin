// The casino API answered from the handoff's sample data (C-Casino), for NEXT_PUBLIC_CONSOLE_DATA=fixtures only.
import { CONSOLE_FIXTURES as F } from "./console-fixtures";

const n = (s: string) => Number(s.replace(/[’'+%\s]/g, "")) || 0;

export function casinoFixture(path: string): unknown {
  if (path === "/me") return { id: "u_mykyta", name: "Mykyta Pantelei", email: "mykyta@planary.ch", role: "owner", permissions: ["view", "note", "moderate", "restrict", "chips", "games", "economy", "announce", "audit", "staff", "reset"] };
  if (path.startsWith("/overview")) {
    const days = Number(new URL(path, "https://x").searchParams.get("days")) || 30;
    const start = Date.parse("2026-09-21T12:00:00Z");
    const bars = [...F.casinoBars, ...F.casinoBars, ...F.casinoBars].slice(-days);
    const fig = (handle: number, ggr: number, players: number, bets: number) => ({ handle, payouts: handle - ggr, ggr, rtp: handle ? (handle - ggr) / handle : null, bets, players });
    return {
      days,
      players: { players: 5204, circulation: 48_210_400, online: 214, new_today: 38, new_week: 212, restricted: 14 },
      today: fig(1_482_300, 61_940, 642, 18_240),
      week: fig(9_120_000, 402_000, 1980, 120_400),
      period: fig(36_400_000, 1_620_000, 4100, 482_000),
      issued: { starter: 421_000, bonus: 1_204_500, adjustments: 18_000, spentInShop: 612_300 },
      perGame: F.games.map((g) => {
        const handle = n(g.w);
        const ggr = n(g.r);
        return { game: g.g, ...fig(handle, ggr, 0, 0), rtp: g.rtp === "rake" ? null : n(g.rtp) / 100, theoretical: g.exp === "rake" ? null : n(g.exp) / 100 };
      }),
      daily: bars.map((v, i) => ({ day: new Date(start + (i + 30 - days) * 86_400_000).toISOString().slice(0, 10), handle: v * 20_000, ggr: v * 1000, players: 300 + v, signups: Math.round(v / 3) })),
    };
  }
  throw Object.assign(new Error("Not in the fixtures."), { status: 404 });
}
