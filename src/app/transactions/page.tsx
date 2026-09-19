"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Input, Label, ListBox, Select, Skeleton, Table } from "@heroui/react";
import { Download } from "lucide-react";
import { Empty } from "@/components/ui";
import { type LedgerRow, useAdmin } from "@/lib/api";
import { chips, dateTime, KIND_LABEL, signed } from "@/lib/format";

const dayStart = (value: string) => (value ? new Date(`${value}T00:00:00`).getTime() : 0);

function toCsv(rows: LedgerRow[]) {
  const head = ["id", "time", "player_id", "player", "kind", "game", "amount", "reference", "counterparty"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    head.join(","),
    ...rows.map((r) =>
      [r.id, new Date(r.created_at).toISOString(), r.user_id, r.name, r.kind, r.game, r.amount, r.ref, r.counterparty_name].map(esc).join(","),
    ),
  ].join("\n");
}

function Picker({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <Select className="w-44" value={value} onChange={(v) => onChange(String(v))}>
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map(([id, text]) => (
            <ListBox.Item key={id} id={id} textValue={text}>
              {text}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export default function TransactionsPage() {
  const [kind, setKind] = useState("all");
  const [game, setGame] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("");
  const [stack, setStack] = useState<number[]>([]);
  const cursor = stack[stack.length - 1] ?? 0;

  const query = new URLSearchParams({
    ...(kind !== "all" ? { kind } : {}),
    ...(game !== "all" ? { game } : {}),
    ...(from ? { from: String(dayStart(from)) } : {}),
    ...(to ? { to: String(dayStart(to) + 86_400_000) } : {}),
    ...(min ? { min } : {}),
    ...(cursor ? { before: String(cursor) } : {}),
  });
  const { data } = useAdmin<{ entries: LedgerRow[]; more: boolean }>(`/ledger?${query}`);
  const reset = () => setStack([]);

  function exportCsv() {
    if (!data) return;
    const blob = new Blob([toCsv(data.entries)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `planary-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-default-500">Every chip movement, newest first. Nothing here can be edited; corrections are new adjustments.</p>
        </div>
        <Button variant="secondary" isDisabled={!data?.entries.length} onPress={exportCsv}>
          <Download className="size-4" /> Export this page (CSV)
        </Button>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <Picker
          label="Type"
          value={kind}
          onChange={(v) => {
            setKind(v);
            reset();
          }}
          options={[["all", "All types"], ...(Object.entries(KIND_LABEL) as [string, string][])]}
        />
        <Picker
          label="Game"
          value={game}
          onChange={(v) => {
            setGame(v);
            reset();
          }}
          options={[
            ["all", "All games"],
            ["blackjack", "Blackjack"],
            ["roulette", "Roulette"],
          ]}
        />
        <label className="grid gap-1.5 text-sm">
          <span className="text-default-600 font-medium">From</span>
          <Input type="date" value={from} onChange={(e) => (setFrom(e.target.value), reset())} className="w-40" />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-default-600 font-medium">To</span>
          <Input type="date" value={to} onChange={(e) => (setTo(e.target.value), reset())} className="w-40" />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-default-600 font-medium">Minimum chips</span>
          <Input inputMode="numeric" value={min} onChange={(e) => (setMin(e.target.value.replace(/\D/g, "")), reset())} className="w-36" placeholder="Any" />
        </label>
      </div>

      {!data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : data.entries.length === 0 ? (
        <Empty>No transactions match.</Empty>
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Transactions" className="min-w-[760px]">
              <Table.Header>
                <Table.Column isRowHeader>When</Table.Column>
                <Table.Column>Player</Table.Column>
                <Table.Column>Type</Table.Column>
                <Table.Column>Details</Table.Column>
                <Table.Column>Chips</Table.Column>
              </Table.Header>
              <Table.Body>
                {data.entries.map((r) => (
                  <Table.Row key={r.id}>
                    <Table.Cell className="num text-default-500">{dateTime(r.created_at)}</Table.Cell>
                    <Table.Cell>
                      <Link href={`/players/${r.user_id}`} className="text-accent font-medium hover:underline">
                        {r.name}
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      {r.kind === "game" ? `${r.game === "roulette" ? "Roulette" : "Blackjack"} ${r.amount < 0 ? "bet" : "payout"}` : (KIND_LABEL[r.kind] ?? r.kind)}
                    </Table.Cell>
                    <Table.Cell className="text-default-500">{r.counterparty_name ?? r.ref ?? ""}</Table.Cell>
                    <Table.Cell className={`num font-medium ${r.amount >= 0 ? "text-success" : ""}`}>{signed(r.amount)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          <Table.Footer className="flex items-center justify-end gap-2">
            <span className="text-default-500 mr-auto text-sm">{chips(data.entries.length)} rows</span>
            <Button size="sm" variant="secondary" isDisabled={!stack.length} onPress={() => setStack(stack.slice(0, -1))}>
              Newer
            </Button>
            <Button size="sm" variant="secondary" isDisabled={!data.more} onPress={() => setStack([...stack, data.entries[data.entries.length - 1].id])}>
              Older
            </Button>
          </Table.Footer>
        </Table>
      )}
    </>
  );
}
