"use client";

import { useState } from "react";
import { useStaff } from "@/components/Shell";
import { Avatar, Dialog, StatusPill, useToast, Who } from "@/components/ui";
import { ApiError, type Badge, type Role, useAdmin, useAdminAction } from "@/lib/api";
import { date } from "@/lib/format";

interface Member extends Badge {
  email: string;
  role: Role;
  since: number;
}

const ROLES: { role: Role; label: string; can: string }[] = [
  { role: "owner", label: "Owner", can: "Everything, including staff." },
  { role: "manager", label: "Manager", can: "Players, chips, restrictions, games, economy, announcements, audit log." },
  { role: "support", label: "Support", can: "Look up players, notes, mutes and moderation. No chip changes." },
  { role: "viewer", label: "Viewer", can: "Read-only: figures, players and transactions." },
];

function AddDialog({ onClose }: { onClose: () => void }) {
  const act = useAdminAction();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Badge | null>(null);
  const [role, setRole] = useState<Role>("support");
  const [error, setError] = useState<string | null>(null);
  const { data } = useAdmin<{ players: Badge[] }>(q.trim().length >= 2 && !picked ? `/players?q=${encodeURIComponent(q.trim())}` : null);
  return (
    <Dialog
      title="Add staff"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!picked}
            onClick={() =>
              void act("/staff", { userId: picked!.id, role }).then(
                () => (toast(`${picked!.name} added as ${role}`), onClose()),
                (e) => setError(e instanceof ApiError ? e.message : "That didn't work."),
              )
            }
          >
            Add
          </button>
        </>
      }
    >
      <p className="muted small">Staff sign in to admin.planary.ch with their own Planary account. They need to have opened the casino once.</p>
      {picked ? (
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <Who player={picked} sub={picked.id} />
          <button className="btn btn-sm" onClick={() => setPicked(null)}>
            Change
          </button>
        </div>
      ) : (
        <>
          <label className="field">
            <span>Player</span>
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" />
          </label>
          {data?.players.length ? (
            <ul className="pick-list">
              {data.players.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <button className="btn btn-ghost" onClick={() => setPicked(p)}>
                    <Avatar player={p} size={24} /> {p.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
      <fieldset className="roles">
        <legend className="small muted">Role</legend>
        {ROLES.map((r) => (
          <label key={r.role} className={`role-option${role === r.role ? " is-picked" : ""}`}>
            <input type="radio" name="role" value={r.role} checked={role === r.role} onChange={() => setRole(r.role)} />
            <span>
              <strong>{r.label}</strong>
              <span className="small muted">{r.can}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {error ? <p className="form-error">{error}</p> : null}
    </Dialog>
  );
}

export default function StaffPage() {
  const me = useStaff();
  const act = useAdminAction();
  const toast = useToast();
  const { data } = useAdmin<{ staff: Member[] }>("/staff");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Staff</h1>
          <p>Who can use this console, and what each role allows.</p>
        </div>
        {me.can("staff") ? (
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            Add staff
          </button>
        ) : null}
      </div>
      <section className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Person</th>
                <th>Role</th>
                <th className="hide-sm">Since</th>
                <th className="r" />
              </tr>
            </thead>
            <tbody>
              {(data?.staff ?? []).map((m) => (
                <tr key={m.id}>
                  <td>
                    <Who player={m} sub={m.email || "Hasn't signed in yet"} />
                  </td>
                  <td>
                    {me.can("staff") && m.id !== me.id ? (
                      <select
                        className="select"
                        style={{ width: "auto" }}
                        value={m.role}
                        onChange={(e) => void act("/staff", { userId: m.id, role: e.target.value }).then(() => toast("Role changed"), (err) => toast(err.message))}
                        aria-label={`Role of ${m.name}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r.role} value={r.role}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusPill status={m.role} />
                    )}
                  </td>
                  <td className="hide-sm muted">{date(m.since)}</td>
                  <td className="r">
                    {me.can("staff") && m.id !== me.id ? (
                      <button className="btn btn-sm btn-danger" onClick={() => setRemoving(m)}>
                        Remove
                      </button>
                    ) : m.id === me.id ? (
                      <span className="small muted">You</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Roles</h2>
        </div>
        <ul className="list">
          {ROLES.map((r) => (
            <li key={r.role}>
              <StatusPill status={r.role} />
              <span className="muted">{r.can}</span>
            </li>
          ))}
        </ul>
      </section>
      {adding ? <AddDialog onClose={() => setAdding(false)} /> : null}
      {removing ? (
        <Dialog
          title={`Remove ${removing.name}?`}
          onClose={() => setRemoving(null)}
          footer={
            <>
              <button className="btn" onClick={() => setRemoving(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger-solid"
                onClick={() =>
                  void act(`/staff/${removing.id}/remove`).then(
                    () => (toast("Removed from staff"), setRemoving(null)),
                    (e) => (toast(e.message), setRemoving(null)),
                  )
                }
              >
                Remove access
              </button>
            </>
          }
        >
          <p className="muted">They lose access to this console straight away. Their player account is not affected.</p>
        </Dialog>
      ) : null}
    </>
  );
}
