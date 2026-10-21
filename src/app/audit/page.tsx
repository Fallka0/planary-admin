"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Gate, useBusy, useConsole } from "@/components/console/Shell";
import { ErrorCard, Ic, PageHead, Sk, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import { adminCall } from "@/lib/api";
import { dayTime, num, shortName } from "@/lib/fmt";
import { FIXTURES, OrgError, orgCall } from "@/lib/org";
import type { AuditEntry } from "@/lib/org-contract";

/** The casino API's audit rows (its own log, for the Casino section). */
interface CasinoEntry {
  id: number;
  staff_name: string;
  action: string;
  target_id: string | null;
  target_name: string | null;
  details: Record<string, unknown> | null;
  created_at: number;
}

const CASINO_SENTENCE: Record<string, string> = {
  "chips.adjust": "Adjusted chips",
  "account.active": "Reopened an account",
  "account.suspended": "Suspended an account",
  "account.banned": "Closed an account",
  "account.reset": "Reset an account",
  "chat.mute": "Muted a player in chat",
  "chat.unmute": "Unmuted a player",
  "limits.set": "Set loss limits",
  "avatar.remove": "Removed an avatar",
  "bio.remove": "Removed a bio",
  "name.set": "Renamed a player",
  "name.reset": "Reset a player name",
  "password.reset_link": "Made a password reset link",
  "note.add": "Added a player note",
  "messages.read": "Read a player’s messages",
  "progress.achievements": "Changed achievements",
  "progress.stats": "Changed counters",
  "game.open": "Opened a game",
  "game.maintenance": "Put a game into maintenance",
  "game.closed": "Closed a game",
  "settings.update": "Changed casino settings",
  "bank.deposit": "Paid into the bank",
  "bank.withdraw": "Took chips from the bank",
  "announcement.send": "Sent an announcement",
  "staff.bootstrap": "Claimed the Casino owner role",
  "staff.set": "Changed a Casino role",
  "staff.remove": "Removed Casino staff",
};
const MODERATION = new Set(["chat.mute", "chat.unmute", "avatar.remove", "bio.remove", "name.set", "name.reset", "note.add", "messages.read"]);

function casinoDetails(d: Record<string, unknown> | null) {
  if (!d) return null;
  return (
    Object.entries(d)
      .filter(([k, v]) => v !== null && v !== "" && k !== "before" && k !== "after")
      .map(([k, v]) => `${k}: ${typeof v === "number" && v > 1e12 ? dayTime(v) : typeof v === "number" ? num(v) : typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(" · ") || null
  );
}

function fromCasino(e: CasinoEntry): AuditEntry {
  return {
    id: `casino-${e.id}`,
    at: e.created_at,
    area: MODERATION.has(e.action) ? "casino_moderation" : "casino",
    actor: { id: e.staff_name, name: e.staff_name },
    action: e.action,
    sentence: CASINO_SENTENCE[e.action] ?? e.action,
    target: e.target_id ? `Casino · player ${e.target_name ?? e.target_id.slice(0, 4)}` : "Casino",
    details: casinoDetails(e.details),
  };
}

const AREAS: [string, string][] = [
  ["", "Every area"],
  ["customers", "Customers"],
  ["support", "Support"],
  ["incidents", "Status and incidents"],
  ["tournament", "Tournament"],
  ["casino", "Casino"],
  ["wishlist", "Wishlist"],
  ["staff", "Staff"],
  ["portal", "Portal (customers)"],
];

/** Area filter → which org areas it covers. Customers includes notes; Casino includes moderation. */
const COVERS: Record<string, string[]> = { customers: ["customers", "notes"], casino: ["casino", "casino_moderation"], incidents: ["incidents", "overview", "system"] };

function csv(rows: AuditEntry[]) {
  const q = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
  return ["when,area,staff,action,target,details", ...rows.map((r) => [new Date(r.at).toISOString(), r.area, q(r.actor?.name ?? ""), q(r.sentence), q(r.target), q(r.details)].join(","))].join("\n");
}

interface Page {
  entries: AuditEntry[];
  /** Where the next page starts, per source; null when that source has nothing older. */
  org: string | null;
  casino: number | null;
}

function AuditPageInner() {
  const { accessToken } = useAuth();
  const { can } = useConsole();
  const [area, setArea] = useState("");
  const [who, setWho] = useState("");
  const [data, setData] = useState<Page | null>(null);
  const [error, setError] = useState<OrgError | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useBusy(loading);

  // Casino rows come from the casino API's own log (Owners and Managers can read it there).
  const withCasino = !FIXTURES && can("audit") && (area === "" || area === "casino");

  const fetchPage = useCallback(
    async (from: { org: string | null; casino: number | null }): Promise<Page> => {
      const orgArea = area ? `&area=${encodeURIComponent((COVERS[area] ?? [area]).join(","))}` : "";
      const [org, casino] = await Promise.all([
        from.org === null
          ? null
          : orgCall<{ entries: AuditEntry[]; more: boolean }>(accessToken, "GET", `/console/audit?before=${encodeURIComponent(from.org)}${orgArea}`),
        from.casino === null || !withCasino
          ? null
          : adminCall<{ entries: CasinoEntry[]; more: boolean }>(accessToken, `/audit?before=${from.casino}`).catch(() => null),
      ]);
      const orgRows = org?.entries ?? [];
      const casRows = casino?.entries ?? [];
      return {
        entries: [...orgRows, ...casRows.map(fromCasino)],
        org: org?.more && orgRows.length ? orgRows[orgRows.length - 1].id : null,
        casino: casino?.more && casRows.length ? casRows[casRows.length - 1].id : null,
      };
    },
    [accessToken, area, withCasino],
  );

  // A new filter starts from the newest entries.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setData(null);
    fetchPage({ org: "", casino: Number.MAX_SAFE_INTEGER }).then(
      (p) => alive && (setData({ ...p, entries: p.entries.sort((a, b) => b.at - a.at) }), setLoading(false)),
      (e: OrgError) => alive && (setError(e), setLoading(false)),
    );
    return () => {
      alive = false;
    };
  }, [fetchPage, attempt]);

  function older() {
    if (!data) return;
    setLoading(true);
    fetchPage({ org: data.org, casino: data.casino }).then(
      (p) => (setData({ ...p, entries: [...data.entries, ...p.entries].sort((a, b) => b.at - a.at) }), setLoading(false)),
      (e: OrgError) => (setError(e), setLoading(false)),
    );
  }

  const rows = data?.entries ?? [];
  const people = useMemo(() => [...new Set(rows.map((r) => r.actor?.name).filter(Boolean) as string[])].sort(), [rows]);
  const shown = rows.filter((r) => !who || r.actor?.name === who);
  const hasMore = !!data && (data.org !== null || data.casino !== null);

  return (
    <>
      <PageHead title={CONSOLE.pages.audit.title}>
        <button
          className="btn btn-line btn-s"
          type="button"
          disabled={!shown.length}
          onClick={() => {
            const url = URL.createObjectURL(new Blob([csv(shown)], { type: "text/csv;charset=utf-8" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "planary-audit.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Ic name="download" small />
          Export CSV
        </button>
      </PageHead>
      <div className="filters">
        <label className="f" style={{ minWidth: 180 }}>
          <span className="sr">Area</span>
          <select className="sel" style={{ height: 36, borderRadius: 999 }} value={area} onChange={(e) => setArea(e.target.value)}>
            {AREAS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="f" style={{ minWidth: 180 }}>
          <span className="sr">Staff</span>
          <select className="sel" style={{ height: 36, borderRadius: 999 }} value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">All staff</option>
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <span className="box-s" aria-live="polite">
          Showing {num(shown.length)}
          {hasMore ? "" : " (all)"}
        </span>
      </div>
      {error && !rows.length ? (
        <ErrorCard title="The audit log didn’t load" error={error} onRetry={() => setAttempt((n) => n + 1)} />
      ) : !rows.length && loading ? (
        <Sk h={480} />
      ) : (
        <section className="box">
          <Table
            cols="100px 110px minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,1.2fr)"
            colsS="78px minmax(0,1fr)"
            head={[{ h: "When" }, { h: "Staff" }, { h: "Action" }, { h: "Target" }, { h: "Details", hide: true }]}
          >
            {shown.map((a) => (
              <tr className="dt-r" key={a.id}>
                <Td style={{ whiteSpace: "nowrap" }}>{dayTime(a.at)}</Td>
                <Td style={{ whiteSpace: "nowrap" }}>{a.actor ? shortName(a.actor.name) : "System"}</Td>
                <Td>
                  <b>{a.sentence}</b>
                </Td>
                <Td>{a.target ?? "–"}</Td>
                <Td hide className="mono-t">
                  {a.details ?? ""}
                </Td>
              </tr>
            ))}
          </Table>
          {!shown.length ? <p className="box-s" style={{ marginTop: 12 }}>Nothing logged for this filter.</p> : null}
          {hasMore ? (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn btn-line btn-s" type="button" onClick={older} disabled={loading}>
                Older entries
                <Ic name="chev-r" small />
              </button>
            </div>
          ) : null}
        </section>
      )}
    </>
  );
}

export default function AuditPage() {
  return (
    <Gate areas={["audit"]}>
      <AuditPageInner />
    </Gate>
  );
}
