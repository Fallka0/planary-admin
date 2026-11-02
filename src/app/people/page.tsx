"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gate, useBusy } from "@/components/console/Shell";
import { PersonStatusChip, SIGN_IN } from "@/components/console/person";
import { ErrorCard, PageHead, Sk, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import { date, initials, lastSeen } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { ConsoleApi } from "@/lib/org-contract";

type List = ConsoleApi["GET /console/people"]["R"];
type Filter = "all" | "suspended" | "banned";

function People() {
  const [filter, setFilter] = useState<Filter>("all");
  const [typed, setTyped] = useState("");
  const [term, setTerm] = useState("");
  // planary-auth searches; wait for a pause in typing instead of asking on every key.
  useEffect(() => {
    const t = window.setTimeout(() => setTerm(typed.trim()), 250);
    return () => window.clearTimeout(t);
  }, [typed]);
  const qs = new URLSearchParams({ ...(term ? { q: term } : {}), ...(filter !== "all" ? { status: filter } : {}) });
  const { data, error, loading, reload } = useOrg<List>(`/console/people${qs.size ? `?${qs}` : ""}`);
  useBusy(loading);
  const t = now();
  const chips: [Filter, string, number | undefined][] = [
    ["all", "All", data?.counts.all],
    ["suspended", "Suspended", data?.counts.suspended],
    ["banned", "Banned", data?.counts.banned],
  ];

  return (
    <>
      <PageHead title={CONSOLE.pages.people.title} />
      <div className="filters sec" role="group" aria-label="Filter people">
        {chips.map(([f, label, n]) => (
          <button key={f} className={`fchip${filter === f ? " on" : ""}`} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "suspended" ? <span className="dot warn" /> : f === "banned" ? <span className="dot err" /> : null}
            {label} <span className="c">{n ?? ""}</span>
          </button>
        ))}
        <input className="inp finp" type="search" placeholder="Name or email" aria-label="Search people" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </div>

      {error && !data ? (
        <ErrorCard title={error.code === "not_connected" ? "Planary accounts aren’t connected yet" : "People didn’t load"} error={error} onRetry={reload} />
      ) : (
        <section className="box">
          {!data ? (
            <Sk h={420} r={12} />
          ) : (
            <Table
              cols="minmax(0,2fr) minmax(0,1.3fr) 130px 112px 104px"
              colsS="minmax(0,1fr) auto"
              head={[{ h: "Person" }, { h: "Status" }, { h: "Sign-in", hide: true }, { h: "Last seen", r: true, hide: true }, { h: "Joined", r: true, hide: true }]}
            >
              {data.people.map((p) => (
                <tr className="dt-r dt-link" key={p.id}>
                  <Td>
                    <Link href={`/people/${p.id}`} className="who" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
                      <span className="av av-l" aria-hidden="true">
                        {initials(p.name || p.email)}
                      </span>
                      <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                        <b>{p.name || "–"}</b>
                        <span className="box-s" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.email}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <PersonStatusChip p={p} />
                  </Td>
                  <Td hide>
                    <span className="box-s">{p.signIn.map((s) => SIGN_IN[s] ?? s).join(", ") || "–"}</span>
                  </Td>
                  <Td r hide>
                    <span className="num">{lastSeen(p.lastSeen, t)}</span>
                  </Td>
                  <Td r hide>
                    <span className="num">{date(p.createdAt)}</span>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
          {data && !data.people.length ? <p className="box-s" style={{ marginTop: 12 }}>{term || filter !== "all" ? "Nobody matches." : "No Planary accounts yet."}</p> : null}
          {data?.more ? <p className="box-s" style={{ marginTop: 12 }}>Showing the newest 50. Search to find someone else.</p> : null}
        </section>
      )}
    </>
  );
}

export default function PeoplePage() {
  return (
    <Gate areas={["people"]}>
      <People />
    </Gate>
  );
}
