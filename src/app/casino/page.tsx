"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Skeleton, Table } from "@heroui/react";
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
const METRICS = {
  ggr: { label: "House result", help: "Chips the house kept: wagers minus payouts. Below the line, players came out ahead that day." },
  handle: { label: "Chips wagered", help: "Every chip bet at the tables." },
  players: { label: "Players at the tables", help: "Distinct players who placed at least one bet." },
  signups: { label: "New players", help: "Accounts that opened the casino for the first time." },
} as const;

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "up" | "down" }) {
  return (
    <Card variant="default">
      <Card.Content className="grid w-full gap-1 p-4">
        <span className="text-default-500 text-xs font-medium">{label}</span>
        <span className={`num text-2xl font-bold tracking-tight ${tone === "up" ? "text-success" : tone === "down" ? "text-danger" : ""}`}>{value}</span>
        {sub ? <span className="text-default-500 num text-xs">{sub}</span> : null}
      </Card.Content>
    </Card>
  );
}

function Toggle<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: [T, string][]; label: string }) {
  return (
    <div role="group" aria-label={label} className="bg-default-100 flex gap-0.5 rounded-lg p-0.5">
      {options.map(([key, text]) => (
        <Button key={key} size="sm" variant={value === key ? "secondary" : "ghost"} aria-pressed={value === key} onPress={() => onChange(key)}>
          {text}
        </Button>
      ))}
    </div>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const [metric, setMetric] = useState<keyof typeof METRICS>("ggr");
  const { data } = useAdmin<Overview>(`/overview?days=${days}`, 60_000);

  if (!data) {
    return (
      <div className="grid gap-5">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const p = data.players;
  const m = METRICS[metric];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-default-500">Play-money figures across Planary Casino. Days follow Zurich time.</p>
        </div>
        <Toggle
          label="Period"
          value={days}
          onChange={setDays}
          options={[
            ["7", "7 days"],
            ["30", "30 days"],
            ["90", "90 days"],
          ]}
        />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Key figures">
        <Kpi label="Players online" value={chips(p.online)} sub={`${chips(p.players)} registered`} />
        <Kpi label="New players" value={chips(p.new_today)} sub={`${chips(p.new_week)} in 7 days`} />
        <Kpi label="Wagered today" value={chips(data.today.handle)} sub={`${chips(data.today.players)} players, ${chips(data.today.bets)} bets`} />
        <Kpi label="House result today" value={signed(data.today.ggr)} tone={data.today.ggr >= 0 ? "up" : "down"} sub={`RTP ${pct(data.today.rtp)}`} />
        <Kpi label="Chips in circulation" value={chips(p.circulation)} sub="All player balances" />
        <Kpi label="Restricted accounts" value={chips(p.restricted)} sub="Suspended or closed" />
      </section>

      <Card>
        <Card.Header>
          <div className="flex w-full flex-wrap items-start justify-between gap-3">
          <div>
            <Card.Title>
              {m.label}, last {data.days} days
            </Card.Title>
            <Card.Description>{m.help}</Card.Description>
          </div>
          <Toggle
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
        </Card.Header>
        <Card.Content>
          <BarChart data={data.daily.map((d) => ({ day: d.day, value: d[metric] }))} label={m.label} />
        </Card.Content>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <div className="flex w-full items-center justify-between gap-3">
              <Card.Title>Games, last {data.days} days</Card.Title>
              <Button size="sm" variant="secondary" onPress={() => router.push("/casino/games")}>
                Details
              </Button>
            </div>
          </Card.Header>
          <Card.Content className="w-full px-0">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Games">
                  <Table.Header>
                    <Table.Column isRowHeader>Game</Table.Column>
                    <Table.Column>Wagered</Table.Column>
                    <Table.Column>Result</Table.Column>
                    <Table.Column>RTP</Table.Column>
                    <Table.Column>Expected</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {data.perGame.map((g) => (
                      <Table.Row key={g.game}>
                        <Table.Cell>{GAME_NAME[g.game] ?? g.game}</Table.Cell>
                        <Table.Cell className="num">{chips(g.handle)}</Table.Cell>
                        <Table.Cell className={`num ${g.ggr >= 0 ? "text-success" : "text-danger"}`}>{signed(g.ggr)}</Table.Cell>
                        <Table.Cell className="num">{pct(g.rtp)}</Table.Cell>
                        <Table.Cell className="num text-default-500">{pct(g.theoretical)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
          <Card.Footer>
            <p className="text-default-500 text-xs">Short-term RTP swings around the expected value; it settles as the number of bets grows.</p>
          </Card.Footer>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Chip flow, last {data.days} days</Card.Title>
          </Card.Header>
          <Card.Content className="w-full">
            <dl className="divide-default-200 divide-y">
              {[
                ["Welcome chips issued", `+${chips(data.issued.starter)}`, ""],
                ["Daily bonuses issued", `+${chips(data.issued.bonus)}`, ""],
                ["Staff adjustments", signed(data.issued.adjustments), ""],
                ["House result at the tables", `${signed(-data.period.ggr)} to players`, data.period.ggr >= 0 ? "text-danger" : "text-success"],
                ["Spent in the shop", `−${chips(data.issued.spentInShop)}`, ""],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-default-600">{label}</dt>
                  <dd className={`num font-semibold ${tone}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </Card.Content>
        </Card>
      </div>
    </>
  );
}
