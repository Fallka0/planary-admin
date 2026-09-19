"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart } from "@/components/ui";
import { type Figures, useAdmin } from "@/lib/api";
import { chips, pct, signed } from "@/lib/format";

interface Overview {
  days: number;
  players: { players: number; circulation: number; online: number; new_today: number; new_week: number; restricted: number };
  today: Figures;
  week: Figures;
  period: Figures;
  issued: { starter: number; bonus: number; adjustments: number; spentInShop: number };
  perGame: (Figures & { game: string; theoretical: number })[];
  daily: { day: string; handle: number; ggr: number; players: number; signups: number }[];
}

const GAME_NAME: Record<string, string> = { blackjack: "Blackjack", roulette: "Roulette" };

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "up" | "down" }) {
  return (
    <div className="card kpi">
      <dt>{label}</dt>
      <dd className={tone}>{value}</dd>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  );
}

export default function OverviewPage() {
  const [days, setDays] = useState(30);
  const { data } = useAdmin<Overview>(`/overview?days=${days}`, 60_000);
  const [metric, setMetric] = useState<"ggr" | "handle" | "players" | "signups">("ggr");

  if (!data) return <div className="card empty">Loading figures…</div>;
  const p = data.players;
  const metricLabel = { ggr: "House result", handle: "Chips wagered", players: "Players at the tables", signups: "New players" }[metric];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p>Play-money figures across Planary Casino. Days follow Zurich time.</p>
        </div>
        <div className="segmented" role="group" aria-label="Period">
          {[7, 30, 90].map((d) => (
            <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      <dl className="kpis">
        <Kpi label="Players online" value={chips(p.online)} sub={`${chips(p.players)} registered`} />
        <Kpi label="New players" value={chips(p.new_today)} sub={`${chips(p.new_week)} in 7 days`} />
        <Kpi label="Wagered today" value={chips(data.today.handle)} sub={`${chips(data.today.players)} players, ${chips(data.today.bets)} bets`} />
        <Kpi
          label="House result today"
          value={signed(data.today.ggr)}
          tone={data.today.ggr >= 0 ? "up" : "down"}
          sub={`RTP ${pct(data.today.rtp)}`}
        />
        <Kpi label="Chips in circulation" value={chips(p.circulation)} sub="All player balances" />
        <Kpi label="Restricted accounts" value={chips(p.restricted)} sub="Suspended or closed" />
      </dl>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>{metricLabel}, last {data.days} days</h2>
            <p>
              {metric === "ggr"
                ? "Chips the house kept: wagers minus payouts. Below the line, players came out ahead that day."
                : metric === "handle"
                  ? "Every chip bet at the tables."
                  : metric === "players"
                    ? "Distinct players who placed at least one bet."
                    : "Accounts that opened the casino for the first time."}
            </p>
          </div>
          <div className="segmented" role="group" aria-label="Chart">
            {(["ggr", "handle", "players", "signups"] as const).map((m) => (
              <button key={m} aria-pressed={metric === m} onClick={() => setMetric(m)}>
                {{ ggr: "Result", handle: "Wagered", players: "Players", signups: "Sign-ups" }[m]}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          <BarChart data={data.daily.map((d) => ({ day: d.day, value: d[metric] }))} label={metricLabel} />
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Games, last {data.days} days</h2>
            <Link className="btn btn-sm" href="/games">
              Details
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Game</th>
                  <th className="r">Wagered</th>
                  <th className="r">Result</th>
                  <th className="r">RTP</th>
                  <th className="r">Expected</th>
                </tr>
              </thead>
              <tbody>
                {data.perGame.map((g) => (
                  <tr key={g.game}>
                    <td>{GAME_NAME[g.game] ?? g.game}</td>
                    <td className="r">{chips(g.handle)}</td>
                    <td className={`r ${g.ggr >= 0 ? "up" : "down"}`}>{signed(g.ggr)}</td>
                    <td className="r">{pct(g.rtp)}</td>
                    <td className="r muted">{pct(g.theoretical)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="card-body small muted">
            Short-term RTP swings around the expected value; it settles as the number of bets grows.
          </p>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Chip flow, last {data.days} days</h2>
          </div>
          <div className="card-body">
            <dl className="kv">
              <dt>Welcome chips issued</dt>
              <dd>+{chips(data.issued.starter)}</dd>
              <dt>Daily bonuses issued</dt>
              <dd>+{chips(data.issued.bonus)}</dd>
              <dt>Staff adjustments</dt>
              <dd>{signed(data.issued.adjustments)}</dd>
              <dt>House result at the tables</dt>
              <dd className={data.period.ggr >= 0 ? "up" : "down"}>{signed(-data.period.ggr)} to players</dd>
              <dt>Spent in the shop</dt>
              <dd>−{chips(data.issued.spentInShop)}</dd>
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}
