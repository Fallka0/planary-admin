"use client";

import { useState } from "react";
import { Alert, Button, Card, Description, Input, Label, Skeleton, Table, TextField } from "@heroui/react";
import { useStaff } from "@/components/Shell";
import { ActionModal, BarChart, Empty, Segmented, useRun } from "@/components/ui";
import { useAdmin } from "@/lib/api";
import { chips, dateTime, signed } from "@/lib/format";

interface Flows {
  wagered: number;
  paid: number;
  shop: number;
  deposits: number;
  withdrawals: number;
  net: number;
}

interface Bank {
  days: number;
  balance: number;
  today: Flows;
  period: Flows;
  lifetime: Flows;
  sources: { source: string; chips_in: number; chips_out: number }[];
  daily: { day: string; net: number; balance: number }[];
  moves: { id: number; amount: number; reason: string; staff_name: string; created_at: number }[];
}

const SOURCE: Record<string, string> = {
  blackjack: "Blackjack",
  roulette: "Roulette",
  slots: "Slots",
  shop: "Shop",
  staff: "Staff moves",
  unknown: "Unlabelled game",
};
const CHART = {
  balance: { label: "Bank balance", help: "What the bank held at the close of each day." },
  net: { label: "Daily change", help: "Chips the bank gained or lost each day. Below the line, it paid out more than it took in." },
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

const tone = (n: number) => (n >= 0 ? "up" : "down");

function MoveDialog({ balance, onClose }: { balance: number; onClose: () => void }) {
  const [direction, setDirection] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const { run, error, busy } = useRun(onClose);
  const value = Number(amount) || 0;

  return (
    <ActionModal
      title="Move chips"
      onClose={onClose}
      error={error}
      action={
        <Button
          isPending={busy}
          isDisabled={!value || reason.trim().length < 3}
          onPress={() => void run("/bank/move", { amount: direction === "deposit" ? value : -value, reason }, direction === "deposit" ? "Deposited" : "Withdrawn")}
        >
          {direction === "deposit" ? `Deposit ${chips(value)}` : `Withdraw ${chips(value)}`}
        </Button>
      }
    >
      <p className="text-default-500">
        The bank holds {chips(balance)} chips. The move is kept with its reason on this page and in the audit log.
      </p>
      <Segmented
        label="Direction"
        value={direction}
        onChange={setDirection}
        options={[
          ["deposit", "Deposit"],
          ["withdraw", "Withdraw"],
        ]}
      />
      <TextField value={amount} onChange={(v) => setAmount(v.replace(/\D/g, ""))} inputMode="numeric">
        <Label>Chips</Label>
        <Input placeholder="e.g. 1000000" />
        {direction === "withdraw" ? <Description>Up to what the bank holds.</Description> : null}
      </TextField>
      <TextField value={reason} onChange={setReason} maxLength={200}>
        <Label>Reason</Label>
        <Input placeholder="e.g. Float for the high-limit tables" />
      </TextField>
    </ActionModal>
  );
}

export default function BankPage() {
  const staff = useStaff();
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const [chart, setChart] = useState<keyof typeof CHART>("balance");
  const [moving, setMoving] = useState(false);
  const { data } = useAdmin<Bank>(`/bank?days=${days}`, 60_000);

  if (!data) {
    return (
      <div className="grid gap-5">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const c = CHART[chart];
  const p = data.period;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank</h1>
          <p className="text-default-500">
            The house&apos;s account. Bets at the house games and shop spend go in, winnings come out. Poker pots pass between players and never touch it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Period"
            value={days}
            onChange={setDays}
            options={[
              ["7", "7 days"],
              ["30", "30 days"],
              ["90", "90 days"],
            ]}
          />
          {staff.can("economy") ? <Button onPress={() => setMoving(true)}>Move chips</Button> : null}
        </div>
      </header>

      {data.balance < 0 ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>The bank is {chips(-data.balance)} chips short</Alert.Title>
            <Alert.Description>Winnings are still paid in full. Deposit chips to bring it back above zero.</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key figures">
        <Kpi label="Bank balance" value={chips(data.balance)} tone={tone(data.balance)} sub="Everything the house holds" />
        <Kpi label="Today" value={signed(data.today.net)} tone={tone(data.today.net)} sub={`${chips(data.today.wagered)} taken, ${chips(data.today.paid)} paid`} />
        <Kpi label={`Last ${data.days} days`} value={signed(p.net)} tone={tone(p.net)} sub={`${chips(p.wagered)} taken, ${chips(p.paid)} paid`} />
        <Kpi label="Since launch" value={signed(data.lifetime.wagered - data.lifetime.paid)} tone={tone(data.lifetime.wagered - data.lifetime.paid)} sub="House result at the tables" />
      </section>

      <Card>
        <Card.Header>
          <div className="flex w-full flex-wrap items-start justify-between gap-3">
            <div>
              <Card.Title>
                {c.label}, last {data.days} days
              </Card.Title>
              <Card.Description>{c.help}</Card.Description>
            </div>
            <Segmented
              label="Chart"
              value={chart}
              onChange={setChart}
              options={[
                ["balance", "Balance"],
                ["net", "Change"],
              ]}
            />
          </div>
        </Card.Header>
        <Card.Content>
          <BarChart data={data.daily.map((d) => ({ day: d.day, value: d[chart] }))} label={c.label} />
        </Card.Content>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Where it came from, last {data.days} days</Card.Title>
          </Card.Header>
          <Card.Content className="w-full px-0">
            {data.sources.length ? (
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Bank flows by source">
                    <Table.Header>
                      <Table.Column isRowHeader>Source</Table.Column>
                      <Table.Column>In</Table.Column>
                      <Table.Column>Out</Table.Column>
                      <Table.Column>Net</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {data.sources.map((s) => {
                        const net = s.chips_in - s.chips_out;
                        return (
                          <Table.Row key={s.source}>
                            <Table.Cell>{SOURCE[s.source] ?? s.source}</Table.Cell>
                            <Table.Cell className="num">{chips(s.chips_in)}</Table.Cell>
                            <Table.Cell className="num">{chips(s.chips_out)}</Table.Cell>
                            <Table.Cell className={`num ${net >= 0 ? "text-success" : "text-danger"}`}>{signed(net)}</Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            ) : (
              <Empty>Nothing moved through the bank in this period.</Empty>
            )}
          </Card.Content>
          <Card.Footer>
            <p className="text-default-500 text-xs">
              For a game, in is bets taken and out is winnings paid. Shop spend only comes in; staff moves are deposits in and withdrawals out.
            </p>
          </Card.Footer>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Staff moves</Card.Title>
            <Card.Description>
              {chips(data.lifetime.deposits)} deposited and {chips(data.lifetime.withdrawals)} withdrawn since the bank opened.
            </Card.Description>
          </Card.Header>
          <Card.Content className="w-full px-0">
            {data.moves.length ? (
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Staff moves">
                    <Table.Header>
                      <Table.Column isRowHeader>When</Table.Column>
                      <Table.Column>Chips</Table.Column>
                      <Table.Column>Reason</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {data.moves.map((m) => (
                        <Table.Row key={m.id}>
                          <Table.Cell className="num whitespace-nowrap">{dateTime(m.created_at)}</Table.Cell>
                          <Table.Cell className={`num ${m.amount >= 0 ? "text-success" : "text-danger"}`}>{signed(m.amount)}</Table.Cell>
                          <Table.Cell>
                            <div>{m.reason}</div>
                            <div className="text-default-500 text-xs">{m.staff_name}</div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            ) : (
              <Empty>No deposits or withdrawals yet.</Empty>
            )}
          </Card.Content>
        </Card>
      </div>

      {moving ? <MoveDialog balance={data.balance} onClose={() => setMoving(false)} /> : null}
    </>
  );
}
