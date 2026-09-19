"use client";

import Link from "next/link";
import { useState } from "react";
import { useStaff } from "@/components/Shell";
import { Avatar, StatusPill, useToast } from "@/components/ui";
import { avatarSrc, type Badge, useAdmin, useAdminAction } from "@/lib/api";
import { chips, date, dateTime } from "@/lib/format";

interface Data {
  avatars: (Badge & { updatedAt: number })[];
  bios: (Badge & { bio: string })[];
  restricted: (Badge & {
    status: string;
    mutedUntil: number | null;
    statusUntil: number | null;
    reason: string | null;
    lossLimit: number | null;
    excludedUntil: number | null;
  })[];
}

export default function ModerationPage() {
  const staff = useStaff();
  const act = useAdminAction();
  const toast = useToast();
  const { data } = useAdmin<Data>("/moderation", 30_000);
  const [now] = useState(() => Date.now());
  if (!staff.can("moderate")) return <div className="card empty">Your role doesn&apos;t include moderation.</div>;
  if (!data) return <div className="card empty">Loading…</div>;
  const remove = (id: string, what: "avatar" | "bio") =>
    void act(`/players/${id}/${what}/remove`).then(() => toast(what === "avatar" ? "Picture removed" : "Bio removed"), (e) => toast(e.message));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Moderation</h1>
          <p>Recent profile pictures and bios, and every account with a restriction.</p>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Profile pictures</h2>
            <p>Newest uploads first. Removing one notifies the player.</p>
          </div>
        </div>
        {data.avatars.length === 0 ? (
          <p className="empty">No pictures uploaded yet.</p>
        ) : (
          <ul className="avatar-grid">
            {data.avatars.map((a) => (
              <li key={a.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc(a.avatar) ?? ""} alt={`${a.name}'s picture`} width={120} height={120} loading="lazy" />
                <Link href={`/players/${a.id}`} className="small">
                  {a.name}
                </Link>
                <span className="small muted">{date(a.updatedAt)}</span>
                <button className="btn btn-sm btn-danger" onClick={() => remove(a.id, "avatar")}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Bios</h2>
          </div>
          {data.bios.length === 0 ? (
            <p className="empty">No bios yet.</p>
          ) : (
            <ul className="list">
              {data.bios.map((b) => (
                <li key={b.id}>
                  <Avatar player={b} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/players/${b.id}`} className="small muted">
                      {b.name}
                    </Link>
                    <p>{b.bio}</p>
                  </span>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(b.id, "bio")}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Restricted accounts</h2>
          </div>
          {data.restricted.length === 0 ? (
            <p className="empty">No restrictions in place.</p>
          ) : (
            <ul className="list">
              {data.restricted.map((r) => (
                <li key={r.id}>
                  <Link href={`/players/${r.id}`} className="who" style={{ flex: 1 }}>
                    <Avatar player={r} />
                    <span className="who-copy">
                      <strong>{r.name}</strong>
                      <span>
                        {[
                          r.reason,
                          r.statusUntil && r.status === "suspended" ? `until ${dateTime(r.statusUntil)}` : null,
                          r.mutedUntil ? `muted until ${date(r.mutedUntil)}` : null,
                          r.lossLimit !== null ? `loss limit ${chips(r.lossLimit)}` : null,
                          r.excludedUntil && r.excludedUntil > now ? `break until ${date(r.excludedUntil)}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </Link>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
