"use client";

import Link from "next/link";
import { useState } from "react";
import { useStaff } from "@/components/Shell";
import { useAdmin } from "@/lib/api";
import { dateTime } from "@/lib/format";

interface Entry {
  id: number;
  staff_name: string;
  action: string;
  target_id: string | null;
  target_name: string | null;
  details: Record<string, unknown> | null;
  created_at: number;
}

const GROUPS: [string, string][] = [
  ["", "Everything"],
  ["chips", "Chips"],
  ["account", "Accounts"],
  ["chat", "Mutes"],
  ["limits", "Limits"],
  ["messages", "Message reads"],
  ["game", "Games"],
  ["settings", "Settings"],
  ["shop", "Shop"],
  ["announcement", "Announcements"],
  ["staff", "Staff"],
];

function detail(d: Record<string, unknown> | null) {
  if (!d) return "";
  return Object.entries(d)
    .filter(([k, v]) => v !== null && v !== "" && k !== "before" && k !== "after")
    .map(([k, v]) => `${k}: ${typeof v === "number" && v > 1e12 ? new Date(v).toLocaleDateString("de-CH") : typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

export default function AuditPage() {
  const staff = useStaff();
  const [action, setAction] = useState("");
  const [before, setBefore] = useState<number[]>([]);
  const cursor = before[before.length - 1];
  const { data } = useAdmin<{ entries: Entry[]; more: boolean }>(
    staff.can("audit") ? `/audit?${new URLSearchParams({ ...(action ? { action } : {}), ...(cursor ? { before: String(cursor) } : {}) })}` : null,
  );
  if (!staff.can("audit")) return <div className="card empty">Your role can&apos;t see the audit log.</div>;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audit log</h1>
          <p>Every staff action, who did it and when. Entries can&apos;t be edited or removed.</p>
        </div>
      </div>
      <section className="card">
        <div className="toolbar">
          <select className="select" style={{ width: "auto" }} value={action} onChange={(e) => (setAction(e.target.value), setBefore([]))} aria-label="Filter">
            {GROUPS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Staff</th>
                <th>Action</th>
                <th>On</th>
                <th className="hide-sm">Details</th>
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
                    Nothing logged yet.
                  </td>
                </tr>
              ) : (
                data.entries.map((e) => (
                  <tr key={e.id}>
                    <td className="muted num">{dateTime(e.created_at)}</td>
                    <td>{e.staff_name}</td>
                    <td>
                      <code className="code">{e.action}</code>
                    </td>
                    <td>
                      {e.target_name ? (
                        <Link className="link" href={`/players/${e.target_id}`}>
                          {e.target_name}
                        </Link>
                      ) : (
                        <span className="muted">{e.target_id ?? "—"}</span>
                      )}
                    </td>
                    <td className="hide-sm muted small">{detail(e.details)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="toolbar" style={{ borderTop: "1px solid var(--line)", borderBottom: 0, justifyContent: "flex-end" }}>
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
