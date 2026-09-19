"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { StatusPill, Who } from "@/components/ui";
import { type Badge, useAdmin } from "@/lib/api";
import { ago, chips, date } from "@/lib/format";

interface Row extends Badge {
  balance: number;
  status: string;
  muted: boolean;
  online: boolean;
  lastSeen: number | null;
  joinedAt: number;
}

function Players() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(0);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const next = params.get("q") ?? "";
    setQ(next);
    setQuery(next);
    setPage(0);
  }, [params]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(q.trim());
      setPage(0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  const { data } = useAdmin<{ players: Row[]; more: boolean; page: number }>(
    `/players?q=${encodeURIComponent(query)}&status=${status}&sort=${sort}&page=${page}`,
    30_000,
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Players</h1>
          <p>Search, open a player to see their history, adjust chips or restrict the account.</p>
        </div>
      </div>
      <section className="card">
        <div className="toolbar">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or player ID" aria-label="Search players" />
          <div className="segmented" role="group" aria-label="Filter">
            {[
              ["all", "All"],
              ["online", "Online"],
              ["restricted", "Restricted"],
              ["muted", "Muted"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={status === value}
                onClick={() => {
                  setStatus(value);
                  setPage(0);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <select className="select" style={{ width: "auto", marginLeft: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
            <option value="recent">Last seen</option>
            <option value="balance">Balance</option>
            <option value="joined">Newest</option>
            <option value="name">Name</option>
          </select>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Player</th>
                <th>Status</th>
                <th className="r">Balance</th>
                <th className="hide-sm">Last seen</th>
                <th className="hide-sm">Joined</th>
              </tr>
            </thead>
            <tbody>
              {!data ? (
                <tr>
                  <td colSpan={5} className="empty">
                    Loading…
                  </td>
                </tr>
              ) : data.players.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">
                    No players match.
                  </td>
                </tr>
              ) : (
                data.players.map((p) => (
                  <tr key={p.id} className="is-link" onClick={() => router.push(`/players/${p.id}`)}>
                    <td>
                      <a href={`/players/${p.id}`} onClick={(e) => e.preventDefault()}>
                        <Who player={p} sub={p.title ?? p.id.slice(0, 8)} />
                      </a>
                    </td>
                    <td>
                      <span className="row" style={{ gap: 6 }}>
                        <StatusPill status={p.status} />
                        {p.muted ? <StatusPill status="muted" /> : null}
                        {p.online ? <span className="pill pill-good">Online</span> : null}
                      </span>
                    </td>
                    <td className="r">{chips(p.balance)}</td>
                    <td className="hide-sm muted">{ago(p.lastSeen, now)}</td>
                    <td className="hide-sm muted">{date(p.joinedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && (page > 0 || data.more) ? (
          <div className="toolbar" style={{ borderTop: "1px solid var(--line)", borderBottom: 0, justifyContent: "flex-end" }}>
            <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span className="small muted">Page {page + 1}</span>
            <button className="btn btn-sm" disabled={!data.more} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={null}>
      <Players />
    </Suspense>
  );
}
