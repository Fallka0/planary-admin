"use client";

import Link from "next/link";
import { useState } from "react";
import { Download } from "lucide-react";
import { type LedgerRow, useAdmin } from "@/lib/api";
import { chips, dateTime, KIND_LABEL, signed } from "@/lib/format";

function dayStart(value: string) {
  return value ? new Date(`${value}T00:00:00`).getTime() : 0;
}

function toCsv(rows: LedgerRow[]) {
  const head = ["id", "time", "player_id", "player", "kind", "game", "amount", "reference", "counterparty"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [head.join(","), ...rows.map((r) => [r.id, new Date(r.created_at).toISOString(), r.user_id, r.name, r.kind, r.game, r.amount, r.ref, r.counterparty_name].map(esc).join(","))].join("\n");
}

export default function TransactionsPage() {
  const [kind, setKind] = useState("");
  const [game, setGame] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("");
  const [before, setBefore] = useState<number[]>([]);
  const cursor = before[before.length - 1] ?? 0;
  const query = new URLSearchParams({
    ...(kind ? { kind } : {}),
    ...(game ? { game } : {}),
    ...(from ? { from: String(dayStart(from)) } : {}),
    ...(to ? { to: String(dayStart(to) + 86_400_000) } : {}),
    ...(min ? { min } : {}),
    ...(cursor ? { before: String(cursor) } : {}),
  });
  const { data } = useAdmin<{ entries: LedgerRow[]; more: boolean }>(`/ledger?${query}`);
  const reset = () => setBefore([]);

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
      <div className="page-head">
        <div>
          <h1>Transactions</h1>
          <p>Every chip movement in the casino, newest first. Nothing here can be edited; corrections are new adjustments.</p>
        </div>
        <button className="btn" onClick={exportCsv} disabled={!data?.entries.length}>
          <Download size={14} aria-hidden="true" /> Export this page (CSV)
        </button>
      </div>
      <section className="card">
        <div className="toolbar">
          <select className="select" style={{ width: "auto" }} value={kind} onChange={(e) => (setKind(e.target.value), reset())} aria-label="Type">
            <option value="">All types</option>
            {Object.entries(KIND_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <select className="select" style={{ width: "auto" }} value={game} onChange={(e) => (setGame(e.target.value), reset())} aria-label="Game">
            <option value="">All games</option>
            <option value="blackjack">Blackjack</option>
            <option value="roulette">Roulette</option>
          </select>
          <label className="row small muted" style={{ alignItems: "center", gap: 6 }}>
            From <input className="input" type="date" value={from} onChange={(e) => (setFrom(e.target.value), reset())} style={{ width: 150 }} />
          </label>
          <label className="row small muted" style={{ alignItems: "center", gap: 6 }}>
            to <input className="input" type="date" value={to} onChange={(e) => (setTo(e.target.value), reset())} style={{ width: 150 }} />
          </label>
          <input
            className="input"
            style={{ width: 150 }}
            inputMode="numeric"
            value={min}
            onChange={(e) => (setMin(e.target.value.replace(/\D/g, "")), reset())}
            placeholder="Min. chips"
            aria-label="Minimum amount"
          />
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Player</th>
                <th>Type</th>
                <th className="hide-sm">Details</th>
                <th className="r">Chips</th>
              </tr>
            </thead>
            <tbody>
              {!data ? (
                <tr>
                  <td colSpan={5} className="empty">
                    Loading…
                  </td>
                </tr>
              ) : data.entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">
                    No transactions match.
                  </td>
                </tr>
              ) : (
                data.entries.map((r) => (
                  <tr key={r.id}>
                    <td className="muted num">{dateTime(r.created_at)}</td>
                    <td>
                      <Link href={`/players/${r.user_id}`} className="link">
                        {r.name}
                      </Link>
                    </td>
                    <td>{r.kind === "game" ? `${r.game === "roulette" ? "Roulette" : "Blackjack"} ${r.amount < 0 ? "bet" : "payout"}` : (KIND_LABEL[r.kind] ?? r.kind)}</td>
                    <td className="hide-sm muted">{r.counterparty_name ?? r.ref ?? ""}</td>
                    <td className={`r ${r.amount >= 0 ? "up" : ""}`}>{signed(r.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="toolbar" style={{ borderTop: "1px solid var(--line)", borderBottom: 0, justifyContent: "flex-end" }}>
          <span className="small muted" style={{ marginRight: "auto" }}>
            {data ? `${chips(data.entries.length)} rows` : ""}
          </span>
          <button className="btn btn-sm" disabled={!before.length} onClick={() => setBefore(before.slice(0, -1))}>
            Newer
          </button>
          <button className="btn btn-sm" disabled={!data?.more} onClick={() => data && setBefore([...before, data.entries[data.entries.length - 1].id])}>
            Older
          </button>
        </div>
      </section>
    </>
  );
}
