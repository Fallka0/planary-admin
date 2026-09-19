"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { useStaff } from "@/components/Shell";
import { Avatar, Dialog, StatusPill, useToast } from "@/components/ui";
import { ApiError, type Badge, type LedgerRow, useAdmin, useAdminAction } from "@/lib/api";
import { chips, dateTime, KIND_LABEL, signed } from "@/lib/format";

interface Detail extends Badge {
  balance: number;
  bio: string | null;
  joinedAt: number;
  presence: { online: boolean; where: string | null; table: string | null };
  lastSeen: number | null;
  status: string;
  blockedReason: string | null;
  account: { status: string; until: number | null; reason: string | null };
  mutedUntil: number | null;
  limits: { lossLimit: number | null; excludedUntil: number | null; lossToday: number };
  lifetime: Record<string, number>;
  stats: Record<string, number>;
  achievements: number;
  friends: number;
  items: number;
  notes: { id: number; staff_name: string; body: string; created_at: number }[];
  ledger: LedgerRow[];
  audit: { id: number; staff_name: string; action: string; details: string; created_at: number }[];
}

type Modal = "adjust" | "status" | "mute" | "limits" | null;

const DAY = 86_400_000;

function describe(row: LedgerRow) {
  const base = KIND_LABEL[row.kind] ?? row.kind;
  if (row.kind === "game") return `${row.game === "roulette" ? "Roulette" : "Blackjack"} ${row.amount < 0 ? "bet" : "payout"}`;
  if (row.kind === "transfer_in") return `From ${row.counterparty_name ?? "a player"}`;
  if (row.kind === "transfer_out") return `To ${row.counterparty_name ?? "a player"}`;
  if (row.kind === "adjustment" || row.kind === "shop") return `${base}${row.ref ? ` · ${row.ref}` : ""}`;
  return base;
}

function toMs(value: string) {
  return value ? new Date(`${value}T23:59:59`).getTime() : null;
}

function inDays(days: number) {
  return new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
}

function useRun(onDone: () => void) {
  const act = useAdminAction();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(path: string, body: unknown, done: string) {
    setBusy(true);
    setError(null);
    try {
      await act(path, body);
      toast(done);
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }
  return { run, error, busy };
}

function AdjustDialog({ p, onClose }: { p: Detail; onClose: () => void }) {
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const { run, error, busy } = useRun(onClose);
  const value = Number(amount) || 0;
  return (
    <Dialog
      title="Adjust chips"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={busy || !value || reason.trim().length < 3}
            onClick={() => void run(`/players/${p.id}/adjust`, { amount: direction === "credit" ? value : -value, reason }, "Balance adjusted")}
          >
            {direction === "credit" ? `Credit ${chips(value)}` : `Debit ${chips(value)}`}
          </button>
        </>
      }
    >
      <p className="muted">
        {p.name} has {chips(p.balance)} chips. The change is recorded in their history and the audit log, and they get a notification.
      </p>
      <div className="segmented" role="group" aria-label="Direction">
        <button aria-pressed={direction === "credit"} onClick={() => setDirection("credit")}>
          Credit
        </button>
        <button aria-pressed={direction === "debit"} onClick={() => setDirection("debit")}>
          Debit
        </button>
      </div>
      <label className="field">
        <span>Chips</span>
        <input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 1000" />
      </label>
      <label className="field">
        <span>Reason</span>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="e.g. Refund for a lost connection mid-round" />
        <small>The player sees this.</small>
      </label>
      {error ? <p className="form-error">{error}</p> : null}
    </Dialog>
  );
}

function StatusDialog({ p, onClose }: { p: Detail; onClose: () => void }) {
  const [status, setStatus] = useState<"active" | "suspended" | "banned">(p.account.status === "banned" ? "banned" : p.status === "suspended" ? "suspended" : "active");
  const [until, setUntil] = useState(inDays(7));
  const [reason, setReason] = useState(p.account.reason ?? "");
  const { run, error, busy } = useRun(onClose);
  return (
    <Dialog
      title="Account status"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className={status === "active" ? "btn btn-primary" : "btn btn-danger-solid"}
            disabled={busy}
            onClick={() => void run(`/players/${p.id}/status`, { status, until: status === "suspended" ? toMs(until) : null, reason }, "Account updated")}
          >
            {status === "active" ? "Reactivate account" : status === "suspended" ? "Suspend account" : "Close account"}
          </button>
        </>
      }
    >
      <div className="segmented" role="group" aria-label="Status">
        <button aria-pressed={status === "active"} onClick={() => setStatus("active")}>
          Active
        </button>
        <button aria-pressed={status === "suspended"} onClick={() => setStatus("suspended")}>
          Suspended
        </button>
        <button aria-pressed={status === "banned"} onClick={() => setStatus("banned")}>
          Closed
        </button>
      </div>
      <p className="muted small">
        {status === "active"
          ? "The player can use the casino normally."
          : status === "suspended"
            ? "Blocks the casino and the tables until the date below. Chips are kept."
            : "Blocks the account until you reactivate it. Chips are kept."}
      </p>
      {status === "suspended" ? (
        <label className="field">
          <span>Until</span>
          <input className="input" type="date" value={until} min={inDays(1)} onChange={(e) => setUntil(e.target.value)} />
        </label>
      ) : null}
      {status !== "active" ? (
        <label className="field">
          <span>Reason</span>
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="e.g. Abusive chat" />
          <small>The player sees this when they open the casino.</small>
        </label>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
    </Dialog>
  );
}

function MuteDialog({ p, onClose }: { p: Detail; onClose: () => void }) {
  const [until, setUntil] = useState(inDays(1));
  const [reason, setReason] = useState("");
  const { run, error, busy } = useRun(onClose);
  return (
    <Dialog
      title={p.mutedUntil ? "Chat mute" : "Mute chat"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          {p.mutedUntil ? (
            <button className="btn" disabled={busy} onClick={() => void run(`/players/${p.id}/mute`, { until: null }, "Mute lifted")}>
              Lift mute
            </button>
          ) : null}
          <button className="btn btn-primary" disabled={busy} onClick={() => void run(`/players/${p.id}/mute`, { until: toMs(until), reason }, "Player muted")}>
            {p.mutedUntil ? "Change end date" : "Mute"}
          </button>
        </>
      }
    >
      <p className="muted small">Stops table chat and direct messages. Playing is not affected.</p>
      {p.mutedUntil ? <p className="small">Muted until {dateTime(p.mutedUntil)}.</p> : null}
      <label className="field">
        <span>Until</span>
        <input className="input" type="date" value={until} min={inDays(0)} onChange={(e) => setUntil(e.target.value)} />
      </label>
      <label className="field">
        <span>Note for the audit log</span>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
    </Dialog>
  );
}

function LimitsDialog({ p, onClose }: { p: Detail; onClose: () => void }) {
  const [limit, setLimit] = useState(p.limits.lossLimit?.toString() ?? "");
  const [excluded, setExcluded] = useState(p.limits.excludedUntil ? new Date(p.limits.excludedUntil).toISOString().slice(0, 10) : "");
  const [reason, setReason] = useState("");
  const { run, error, busy } = useRun(onClose);
  return (
    <Dialog
      title="Responsible play"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              void run(`/players/${p.id}/limits`, { lossLimit: limit === "" ? null : Number(limit), excludedUntil: excluded ? toMs(excluded) : null, reason }, "Limits saved")
            }
          >
            Save limits
          </button>
        </>
      }
    >
      <label className="field">
        <span>Daily loss limit (chips)</span>
        <input className="input" inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} placeholder="No limit" />
        <small>Bets that would take today&apos;s losses past this are refused. Lost today: {chips(p.limits.lossToday)}.</small>
      </label>
      <label className="field">
        <span>Break from play until</span>
        <input className="input" type="date" value={excluded} min={inDays(1)} onChange={(e) => setExcluded(e.target.value)} />
        <small>No bets until then. The player can still sign in, chat and see their profile. Leave empty for none.</small>
      </label>
      <label className="field">
        <span>Note for the audit log</span>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="e.g. Requested by the player" />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
    </Dialog>
  );
}

function Notes({ p }: { p: Detail }) {
  const staff = useStaff();
  const [body, setBody] = useState("");
  const { run, error, busy } = useRun(() => setBody(""));
  return (
    <div className="card-body" style={{ display: "grid", gap: 14 }}>
      {staff.can("note") ? (
        <form
          style={{ display: "grid", gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault();
            void run(`/players/${p.id}/notes`, { body }, "Note added");
          }}
        >
          <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Internal note, only staff see it" maxLength={2000} />
          <div>
            <button className="btn btn-primary btn-sm" disabled={busy || !body.trim()}>
              Add note
            </button>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      ) : null}
      {p.notes.length === 0 ? (
        <p className="muted">No notes yet.</p>
      ) : (
        <ul style={{ display: "grid", gap: 10 }}>
          {p.notes.map((n) => (
            <li key={n.id} className="note">
              <p style={{ whiteSpace: "pre-wrap" }}>{n.body}</p>
              <span className="small muted">
                {n.staff_name} · {dateTime(n.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Ledger({ p }: { p: Detail }) {
  const [before, setBefore] = useState<number | null>(null);
  const { data } = useAdmin<{ entries: LedgerRow[] }>(before ? `/players/${p.id}/ledger?before=${before}` : null);
  const rows = before ? (data?.entries ?? []) : p.ledger;
  return (
    <>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>When</th>
              <th>What</th>
              <th className="r">Chips</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="muted num">{dateTime(r.created_at)}</td>
                <td>{describe(r)}</td>
                <td className={`r ${r.amount >= 0 ? "up" : ""}`}>{signed(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="toolbar" style={{ borderTop: "1px solid var(--line)", borderBottom: 0, justifyContent: "flex-end" }}>
        {before ? (
          <button className="btn btn-sm" onClick={() => setBefore(null)}>
            Newest
          </button>
        ) : null}
        <button className="btn btn-sm" disabled={rows.length < 50} onClick={() => setBefore(rows[rows.length - 1]?.id ?? null)}>
          Older
        </button>
      </div>
    </>
  );
}

function Messages({ p }: { p: Detail }) {
  const [partner, setPartner] = useState<Badge | null>(null);
  const { data: convos } = useAdmin<{ conversations: { with: Badge; count: number; last: number }[] }>(`/players/${p.id}/messages`);
  const { data: thread } = useAdmin<{ messages: { id: number; fromPlayer: boolean; body: string; at: number }[] }>(
    partner ? `/players/${p.id}/messages?with=${partner.id}` : null,
  );
  if (!convos) return <p className="empty">Loading…</p>;
  if (!convos.conversations.length) return <p className="empty">{p.name} hasn&apos;t messaged anyone.</p>;
  return (
    <div className="msg-split">
      <ul className="list msg-list">
        {convos.conversations.map((c) => (
          <li key={c.with.id}>
            <button className={`msg-pick${partner?.id === c.with.id ? " is-active" : ""}`} onClick={() => setPartner(c.with)}>
              <Avatar player={c.with} size={28} />
              <span>{c.with.name}</span>
              <span className="muted small">{c.count}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="msg-thread">
        {!partner ? (
          <p className="muted">Pick a conversation. Opening one is recorded in the audit log.</p>
        ) : !thread ? (
          <p className="muted">Loading…</p>
        ) : (
          thread.messages.map((m) => (
            <div key={m.id} className={`msg${m.fromPlayer ? " is-player" : ""}`}>
              <span className="small muted">
                {m.fromPlayer ? p.name : partner.name} · {dateTime(m.at)}
              </span>
              <p>{m.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const ACTION_LABEL: Record<string, string> = {
  "chips.adjust": "Adjusted chips",
  "account.active": "Reactivated account",
  "account.suspended": "Suspended account",
  "account.banned": "Closed account",
  "chat.mute": "Muted chat",
  "chat.unmute": "Lifted chat mute",
  "limits.set": "Set limits",
  "avatar.remove": "Removed picture",
  "bio.remove": "Removed bio",
  "note.add": "Added a note",
  "messages.read": "Read messages",
  "staff.set": "Changed staff role",
  "staff.remove": "Removed from staff",
};

export default function PlayerPage({ params }: PageProps<"/players/[id]">) {
  const { id } = use(params);
  const staff = useStaff();
  const toast = useToast();
  const act = useAdminAction();
  const { data: p, error } = useAdmin<Detail>(`/players/${id}`, 30_000);
  const [modal, setModal] = useState<Modal>(null);
  const [now] = useState(() => Date.now());
  const [tab, setTab] = useState<"summary" | "ledger" | "messages" | "notes" | "activity">("summary");

  if (error) return <div className="card empty">{error.message}</div>;
  if (!p) return <div className="card empty">Loading…</div>;

  const s = p.stats;
  const where = p.presence.online ? (p.presence.where === "lobby" ? "In the lobby" : `At ${p.presence.where}${p.presence.table ? ` · ${p.presence.table}` : ""}`) : "Offline";

  return (
    <>
      <Link href="/players" className="btn btn-ghost btn-sm" style={{ justifySelf: "start" }}>
        <ArrowLeft size={14} aria-hidden="true" /> Players
      </Link>

      <section className="card player-head">
        <Avatar player={p} size={64} />
        <div className="player-id">
          <h1>{p.name}</h1>
          <div className="row" style={{ gap: 6, alignItems: "center" }}>
            <StatusPill status={p.status} />
            {p.mutedUntil ? <StatusPill status="muted" /> : null}
            <span className={`pill${p.presence.online ? " pill-good" : ""}`}>{where}</span>
            {p.title ? <span className="pill">{p.title}</span> : null}
          </div>
          <button
            className="btn btn-ghost btn-sm id-copy"
            onClick={() => void navigator.clipboard.writeText(p.id).then(() => toast("Player ID copied"))}
            title="Copy player ID"
          >
            <Copy size={12} aria-hidden="true" /> {p.id}
          </button>
        </div>
        <div className="player-balance">
          <span className="muted small">Balance</span>
          <strong className="num">{chips(p.balance)}</strong>
        </div>
      </section>

      {p.blockedReason ? <div className="banner-warn">{p.blockedReason}</div> : null}

      <div className="page-actions">
        {staff.can("chips") ? (
          <button className="btn btn-primary" onClick={() => setModal("adjust")}>
            Adjust chips
          </button>
        ) : null}
        {staff.can("restrict") ? (
          <>
            <button className="btn" onClick={() => setModal("status")}>
              Account status
            </button>
            <button className="btn" onClick={() => setModal("limits")}>
              Responsible play
            </button>
          </>
        ) : null}
        {staff.can("moderate") ? (
          <>
            <button className="btn" onClick={() => setModal("mute")}>
              {p.mutedUntil ? "Chat mute" : "Mute chat"}
            </button>
            {p.avatar ? (
              <button
                className="btn btn-danger"
                onClick={() => void act(`/players/${p.id}/avatar/remove`).then(() => toast("Picture removed"), (e) => toast(e.message))}
              >
                Remove picture
              </button>
            ) : null}
            {p.bio ? (
              <button className="btn btn-danger" onClick={() => void act(`/players/${p.id}/bio/remove`).then(() => toast("Bio removed"), (e) => toast(e.message))}>
                Remove bio
              </button>
            ) : null}
          </>
        ) : null}
        <a className="btn btn-ghost" href={`https://casino.planary.ch/u/${p.id}`} target="_blank" rel="noreferrer">
          Public profile <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>

      <section className="card">
        <div className="tabs" role="tablist">
          {(
            [
              ["summary", "Summary"],
              ["ledger", "Chip history"],
              ...(staff.can("moderate") ? [["messages", "Messages"]] : []),
              ["notes", `Notes${p.notes.length ? ` (${p.notes.length})` : ""}`],
              ["activity", "Staff activity"],
            ] as [typeof tab, string][]
          ).map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {tab === "summary" ? (
          <div className="grid-3 card-body">
            <div>
              <h3 className="sub-h">Money in and out</h3>
              <dl className="kv">
                <dt>Wagered</dt>
                <dd>{chips(p.lifetime.wagered)}</dd>
                <dt>Won back</dt>
                <dd>{chips(p.lifetime.won)}</dd>
                <dt>Net at the tables</dt>
                <dd className={p.lifetime.net >= 0 ? "up" : "down"}>{signed(p.lifetime.net)}</dd>
                <dt>Free chips</dt>
                <dd>{chips(p.lifetime.free)}</dd>
                <dt>Received / sent</dt>
                <dd>
                  {chips(p.lifetime.received)} / {chips(p.lifetime.sent)}
                </dd>
                <dt>Spent in shop</dt>
                <dd>{chips(p.lifetime.shop)}</dd>
                <dt>Staff adjustments</dt>
                <dd>{signed(p.lifetime.adjustments)}</dd>
              </dl>
            </div>
            <div>
              <h3 className="sub-h">Play</h3>
              <dl className="kv">
                <dt>Blackjack rounds</dt>
                <dd>{chips(s.bj_hands ?? 0)}</dd>
                <dt>Blackjacks</dt>
                <dd>{chips(s.bj_naturals ?? 0)}</dd>
                <dt>Roulette spins</dt>
                <dd>{chips(s.roulette_spins ?? 0)}</dd>
                <dt>Best round</dt>
                <dd>{signed(s.best_round ?? 0)}</dd>
                <dt>Achievements</dt>
                <dd>{p.achievements}</dd>
                <dt>Friends</dt>
                <dd>{p.friends}</dd>
                <dt>Cosmetics owned</dt>
                <dd>{p.items}</dd>
              </dl>
            </div>
            <div>
              <h3 className="sub-h">Account</h3>
              <dl className="kv">
                <dt>Joined</dt>
                <dd>{dateTime(p.joinedAt)}</dd>
                <dt>Last seen</dt>
                <dd>{dateTime(p.lastSeen)}</dd>
                <dt>Daily loss limit</dt>
                <dd>{p.limits.lossLimit === null ? "None" : chips(p.limits.lossLimit)}</dd>
                <dt>Lost today</dt>
                <dd>{chips(p.limits.lossToday)}</dd>
                <dt>Break until</dt>
                <dd>{p.limits.excludedUntil && p.limits.excludedUntil > now ? dateTime(p.limits.excludedUntil) : "—"}</dd>
                <dt>Chat muted until</dt>
                <dd>{p.mutedUntil ? dateTime(p.mutedUntil) : "—"}</dd>
              </dl>
              {p.bio ? <p className="bio-quote">“{p.bio}”</p> : null}
            </div>
          </div>
        ) : tab === "ledger" ? (
          <Ledger p={p} />
        ) : tab === "messages" ? (
          <Messages p={p} />
        ) : tab === "notes" ? (
          <Notes p={p} />
        ) : (
          <ul className="list">
            {p.audit.length === 0 ? (
              <li className="muted">No staff actions on this player yet.</li>
            ) : (
              p.audit.map((a) => (
                <li key={a.id}>
                  <span style={{ flex: 1 }}>
                    <strong>{a.staff_name}</strong> {ACTION_LABEL[a.action]?.toLowerCase() ?? a.action}
                    {a.details && a.details !== "null" ? <span className="muted small"> · {summarise(a.details)}</span> : null}
                  </span>
                  <span className="muted small num">{dateTime(a.created_at)}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      {modal === "adjust" ? <AdjustDialog p={p} onClose={() => setModal(null)} /> : null}
      {modal === "status" ? <StatusDialog p={p} onClose={() => setModal(null)} /> : null}
      {modal === "mute" ? <MuteDialog p={p} onClose={() => setModal(null)} /> : null}
      {modal === "limits" ? <LimitsDialog p={p} onClose={() => setModal(null)} /> : null}
    </>
  );
}

function summarise(details: string) {
  try {
    const d = JSON.parse(details) as Record<string, unknown>;
    return Object.entries(d)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => `${k}: ${typeof v === "number" && v > 1e12 ? new Date(v).toLocaleDateString("de-CH") : String(v)}`)
      .join(", ");
  } catch {
    return details;
  }
}
