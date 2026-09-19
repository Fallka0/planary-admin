"use client";

import Link from "next/link";
import { useState } from "react";
import { useStaff } from "@/components/Shell";
import { Avatar, Dialog, StatusPill, useToast } from "@/components/ui";
import { ApiError, type Badge, type Figures, useAdmin, useAdminAction } from "@/lib/api";
import { chips, pct, signed } from "@/lib/format";

interface Game {
  game: string;
  status: "open" | "maintenance";
  note: string | null;
  theoretical: number;
  today: Figures;
  week: Figures;
  month: Figures;
  tables: { id: string; players: Badge[] }[];
}

const NAME: Record<string, string> = { blackjack: "Blackjack", roulette: "Roulette" };
const HOST: Record<string, string> = { blackjack: "https://21.planary.ch", roulette: "https://roulette.planary.ch" };
const RULES: Record<string, string> = {
  blackjack: "6 decks, dealer stands on all 17s, blackjack 3:2, insurance 2:1, split to 4 hands.",
  roulette: "European single zero. Straight 35:1 down to even money 1:1.",
};

function StatusDialog({ g, onClose }: { g: Game; onClose: () => void }) {
  const act = useAdminAction();
  const toast = useToast();
  const closing = g.status === "open";
  const [note, setNote] = useState(g.note ?? "");
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      title={closing ? `Close ${NAME[g.game]}` : `Reopen ${NAME[g.game]}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className={closing ? "btn btn-danger-solid" : "btn btn-primary"}
            onClick={() =>
              void act(`/games/${g.game}`, { status: closing ? "maintenance" : "open", note: closing ? note : "" }).then(
                () => (toast(closing ? "Game closed" : "Game reopened"), onClose()),
                (e) => setError(e instanceof ApiError ? e.message : "That didn't work."),
              )
            }
          >
            {closing ? "Close for maintenance" : "Reopen"}
          </button>
        </>
      }
    >
      {closing ? (
        <>
          <p className="muted">Rounds already dealt finish normally. After that, new bets are refused with the message below until you reopen.</p>
          <label className="field">
            <span>Message for players</span>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="This game is closed for maintenance. Try again soon." />
          </label>
        </>
      ) : (
        <p className="muted">Players can bet again right away.</p>
      )}
      {error ? <p className="form-error">{error}</p> : null}
    </Dialog>
  );
}

function Row({ label, f }: { label: string; f: Figures }) {
  return (
    <tr>
      <td>{label}</td>
      <td className="r">{chips(f.handle)}</td>
      <td className="r">{chips(f.bets)}</td>
      <td className="r">{chips(f.players)}</td>
      <td className={`r ${f.ggr >= 0 ? "up" : "down"}`}>{signed(f.ggr)}</td>
      <td className="r">{pct(f.rtp)}</td>
    </tr>
  );
}

export default function GamesPage() {
  const staff = useStaff();
  const { data } = useAdmin<{ games: Game[] }>("/games", 15_000);
  const [editing, setEditing] = useState<Game | null>(null);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Games</h1>
          <p>Status, results against the expected return, and who is at a table right now.</p>
        </div>
      </div>
      {!data ? (
        <div className="card empty">Loading…</div>
      ) : (
        data.games.map((g) => (
          <section key={g.game} className="card">
            <div className="card-head">
              <div>
                <h2 className="row" style={{ alignItems: "center", gap: 8 }}>
                  {NAME[g.game]} <StatusPill status={g.status} />
                </h2>
                <p>{g.status === "maintenance" && g.note ? `Players see: “${g.note}”` : RULES[g.game]}</p>
              </div>
              <div className="page-actions">
                <a className="btn btn-sm" href={HOST[g.game]} target="_blank" rel="noreferrer">
                  Open game
                </a>
                {staff.can("games") ? (
                  <button className={g.status === "open" ? "btn btn-sm btn-danger" : "btn btn-sm btn-primary"} onClick={() => setEditing(g)}>
                    {g.status === "open" ? "Close for maintenance" : "Reopen"}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th className="r">Wagered</th>
                    <th className="r">Bets</th>
                    <th className="r">Players</th>
                    <th className="r">House result</th>
                    <th className="r">RTP (expected {pct(g.theoretical)})</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="Today" f={g.today} />
                  <Row label="7 days" f={g.week} />
                  <Row label="30 days" f={g.month} />
                </tbody>
              </table>
            </div>
            <div className="card-body">
              <h3 className="sub-h">Live now</h3>
              {g.tables.length === 0 ? (
                <p className="muted">Nobody is playing right now.</p>
              ) : (
                <ul className="live-tables">
                  {g.tables.map((t) => (
                    <li key={t.id}>
                      <span className="small muted">{t.id === "lobby" ? "In the lobby" : `Table ${t.id}${t.id.startsWith("p-") ? " (private)" : ""}`}</span>
                      <span className="row" style={{ gap: 6 }}>
                        {t.players.map((p) => (
                          <Link key={p.id} href={`/players/${p.id}`} className="pill" title={p.name}>
                            <Avatar player={p} size={16} /> {p.name}
                          </Link>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))
      )}
      {editing ? <StatusDialog g={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}
