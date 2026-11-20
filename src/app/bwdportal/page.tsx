"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BWD_ROLE, BwdTabs, wallTime } from "@/components/console/bwdportal";
import { Gate, useBusy } from "@/components/console/Shell";
import { Chip, ErrorCard, PageHead, Sk, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import { initials } from "@/lib/fmt";
import { useOrg } from "@/lib/org";
import type { BwdRole, ConsoleApi } from "@/lib/org-contract";

type List = ConsoleApi["GET /console/bwdportal/people"]["R"];
type Classes = ConsoleApi["GET /console/bwdportal/classes"]["R"];

function People() {
  const [role, setRole] = useState<BwdRole | "">("");
  const [cls, setCls] = useState("");
  const [typed, setTyped] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setTerm(typed.trim()), 250);
    return () => window.clearTimeout(t);
  }, [typed]);
  const qs = new URLSearchParams({ ...(term ? { q: term } : {}), ...(role ? { role } : {}), ...(cls ? { class: cls } : {}) });
  const { data, error, loading, reload } = useOrg<List>(`/console/bwdportal/people${qs.size ? `?${qs}` : ""}`);
  const classes = useOrg<Classes>("/console/bwdportal/classes");
  useBusy(loading);
  const chips: [BwdRole | "", string][] = [
    ["", "Everyone"],
    ["student", "Students"],
    ["teacher", "Teachers"],
  ];

  return (
    <>
      <PageHead title={CONSOLE.pages.bwdportal.title} />
      <BwdTabs on="people" />
      <div className="filters sec" role="group" aria-label="Filter people">
        {chips.map(([r, label]) => (
          <button key={r || "all"} className={`fchip${role === r ? " on" : ""}`} type="button" aria-pressed={role === r} onClick={() => setRole(r)}>
            {label}
          </button>
        ))}
        <select className="sel" style={{ height: 36, borderRadius: 999, width: "auto" }} aria-label="Class" value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="">Every class</option>
          {classes.data?.classes.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
        <input className="inp finp" type="search" placeholder="Name or school address" aria-label="Search people" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </div>

      {error && !data ? (
        <ErrorCard title={error.code === "not_connected" ? "The bwd Portal isn’t connected yet" : "People didn’t load"} error={error} onRetry={reload} />
      ) : (
        <section className="box">
          {!data ? (
            <Sk h={420} r={12} />
          ) : (
            <Table
              cols="minmax(0,2fr) 110px minmax(0,1.6fr) 150px"
              colsS="minmax(0,1fr) auto"
              head={[{ h: "Person" }, { h: "Role" }, { h: "Class or teaches", hide: true }, { h: "Last active", r: true, hide: true }]}
            >
              {data.people.map((p) => (
                <tr className="dt-r dt-link" key={p.id}>
                  <Td>
                    <Link href={`/bwdportal/people/${encodeURIComponent(p.id)}`} className="who" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
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
                  <Td>{p.role === "teacher" ? <Chip tone="info">{BWD_ROLE.teacher}</Chip> : <span className="box-s">{BWD_ROLE.student}</span>}</Td>
                  <Td hide>
                    <span className="box-s">
                      {p.role === "teacher"
                        ? p.assignments.length
                          ? p.assignments.map((a) => `${a.subject} ${a.classCode}`).join(", ")
                          : "Nothing assigned"
                        : (p.classCode ?? "No class")}
                    </span>
                  </Td>
                  <Td r hide>
                    <span className="num">{wallTime(p.lastLoginAt)}</span>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
          {data && !data.people.length ? <p className="box-s" style={{ marginTop: 12 }}>{term || role || cls ? "Nobody matches." : "No one has signed in to the bwd Portal yet."}</p> : null}
        </section>
      )}
    </>
  );
}

export default function BwdPortalPage() {
  return (
    <Gate areas={["bwdportal"]}>
      <People />
    </Gate>
  );
}
