"use client";

import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { CasinoHeadSlot } from "@/components/CasinoStaff";
import { useBusy } from "@/components/console/Shell";
import { Bars, Seg, Sk, Table, Td } from "@/components/console/ui";
import { type Figures, useAdmin } from "@/lib/api";
import { dayMonth, num, signedNum } from "@/lib/fmt";

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

const GAME_NAME: Record<string, string> = { blackjack: "Blackjack", roulette: "Roulette", slots: "Slots" };
const METRICS = {
  ggr: { label: "House result", unit: "chips", help: "Chips the house kept: wagers minus payouts." },
  handle: { label: "Wagered", unit: "chips", help: "Every chip bet at the tables." },
  players: { label: "Players", unit: "players", help: "Distinct players who placed at least one bet." },
  signups: { label: "New players", unit: "new players", help: "Accounts that opened the casino for the first time." },
} as const;
type Metric = keyof typeof METRICS;

const pct = (n: number | null) => (n === null ? "–" : `${(n * 100).toFixed(1)}%`);

/** The period toggle sits in the Casino heading (the layout's slot). */
function HeadSlot({ children }: { children: React.ReactNode }) {
  const el = useContext(CasinoHeadSlot);
  return el ? createPortal(children, el) : null;
}

export default function CasinoOverviewPage() {
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const [metric, setMetric] = useState<Metric>("ggr");
  const { data } = useAdmin<Overview>(`/overview?days=${days}`, 60_000);
  useBusy(!data);

  const toggle = (
    <HeadSlot>
      <Seg
        label="Period"
        value={days}
        onChange={setDays}
        options={[
          ["7", "7 days"],
          ["30", "30 days"],
          ["90", "90 days"],
        ]}
      />
    </HeadSlot>
  );

  if (!data) {
    return (
      <>
        {toggle}
        <div className="kpis" aria-hidden="true">
          <Sk h={96} />
          <Sk h={96} />
          <Sk h={96} />
          <Sk h={96} />
        </div>
        <div className="cols" aria-hidden="true">
          <Sk h={300} />
          <Sk h={220} />
        </div>
      </>
    );
  }

  const p = data.players;
  const m = METRICS[metric];
  const values = data.daily.map((d) => d[metric]);
  const labels = data.daily.map((d) => dayMonth(Date.parse(`${d.day}T12:00:00Z`)));

  return (
    <>
      {toggle}
      <section className="kpis" aria-label="Casino figures">
        <div className="kpi">
          <span className="kpi-l">Players online</span>
          <span className="kpi-v">{num(p.online)}</span>
          <span className="kpi-s">{num(p.players)} registered</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">New players</span>
          <span className="kpi-v">{num(p.new_today)}</span>
          <span className="kpi-s">{num(p.new_week)} in 7 days</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Wagered today</span>
          <span className="kpi-v">{num(data.today.handle)}</span>
          <span className="kpi-s">
            {num(data.today.players)} players, {num(data.today.bets)} bets
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-l">House result today</span>
          <span className="kpi-v">{signedNum(data.today.ggr)}</span>
          <span className="kpi-s">RTP {pct(data.today.rtp)}</span>
        </div>
      </section>

      <div className="cols">
        <section className="box" aria-labelledby="cw-h">
          <div className="chart-h">
            <div>
              <h2 id="cw-h" className="box-t">
                {m.label}, last {data.days} days
              </h2>
              <p className="box-s" style={{ marginTop: 4 }}>
                {m.help}
              </p>
            </div>
            <Seg
              label="Chart"
              value={metric}
              onChange={setMetric}
              options={[
                ["ggr", "Result"],
                ["handle", "Wagered"],
                ["players", "Players"],
                ["signups", "Sign-ups"],
              ]}
            />
          </div>
          <Bars values={values} label={`${m.label} per day, last ${data.days} days`} titles={values.map((v, i) => `${labels[i]}: ${metric === "ggr" ? signedNum(v) : num(v)} ${m.unit}`)} />
          <div className="axis">
            <span>{labels[0]}</span>
            <span>{labels[Math.floor((labels.length - 1) / 2)]}</span>
            <span>Today</span>
          </div>
        </section>
        <section className="box" aria-labelledby="ci-h">
          <div className="box-h">
            <h2 id="ci-h" className="box-t">
              Chips issued, {data.days} days
            </h2>
          </div>
          <dl className="kv">
            <dt>Starter chips</dt>
            <dd className="num">{num(data.issued.starter)}</dd>
            <dt>Daily bonus</dt>
            <dd className="num">{num(data.issued.bonus)}</dd>
            <dt>Staff adjustments</dt>
            <dd className="num">{signedNum(data.issued.adjustments)}</dd>
            <dt>Spent in the shop</dt>
            <dd className="num">−{num(data.issued.spentInShop)}</dd>
            <dt>House result</dt>
            <dd className="num">{signedNum(data.period.ggr)}</dd>
            <dt>In circulation</dt>
            <dd className="num">{num(p.circulation)}</dd>
            <dt>Restricted accounts</dt>
            <dd className="num">{num(p.restricted)}</dd>
          </dl>
        </section>
      </div>

      <section className="box" aria-labelledby="pg-h">
        <div className="box-h">
          <h2 id="pg-h" className="box-t">
            Per game
          </h2>
          <span className="box-s">RTP against the theoretical value</span>
        </div>
        <Table
          cols="minmax(0,1.4fr) 1fr 1fr 80px 80px"
          colsS="minmax(0,1fr) auto auto 52px"
          head={[{ h: "Game" }, { h: "Wagered", r: true }, { h: "House result", r: true }, { h: "RTP", r: true }, { h: "Expected", r: true, hide: true }]}
        >
          {data.perGame.map((g) => (
            <tr className="dt-r" key={g.game}>
              <Td>
                <b>{GAME_NAME[g.game] ?? g.game}</b>
              </Td>
              <Td r>{num(g.handle)}</Td>
              <Td r>{signedNum(g.ggr)}</Td>
              <Td r>{pct(g.rtp)}</Td>
              <Td r hide>
                {pct(g.theoretical)}
              </Td>
            </tr>
          ))}
        </Table>
      </section>
    </>
  );
}
