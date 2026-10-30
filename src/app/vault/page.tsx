"use client";

import { useState } from "react";
import { Gate, useBusy } from "@/components/console/Shell";
import { ErrorCard, Ic, PageHead, Sk, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import { bytes, date, lastSeen, num } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { VaultPerson, VaultUsage } from "@/lib/org-contract";

const PLAN: Record<VaultPerson["plan"], string> = { free: "Free", plus: "Plus", pro: "Pro" };

type Filter = "all" | VaultPerson["plan"] | "full";

/** Past this share of the quota a vault counts as nearly full. */
const NEARLY_FULL = 0.8;

const share = (p: VaultPerson) => (p.quota ? p.used / p.quota : 0);

function Vault() {
  const { data, error, loading, reload } = useOrg<VaultUsage>("/console/vault", 300_000);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  useBusy(loading);
  const t = now();

  const all = data?.people ?? [];
  const matches = (p: VaultPerson, f: Filter) => f === "all" || (f === "full" ? share(p) >= NEARLY_FULL : p.plan === f);
  const term = query.trim().toLowerCase();
  const rows = all.filter((p) => matches(p, filter) && (!term || p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term)));
  const chips: [Filter, string][] = [
    ["all", "All"],
    ["free", "Free"],
    ["plus", "Plus"],
    ["pro", "Pro"],
    ["full", "Nearly full"],
  ];
  const top = all[0];

  return (
    <>
      <PageHead title={CONSOLE.pages.vault.title} />
      {error && !data ? (
        <div className="sec">
          {error.code === "not_connected" ? (
            <div className="empty">
              <Ic name="lock" />
              <h3>Not connected yet</h3>
              <p>planary-org can’t reach Planary Vault yet. Once it has the VAULT binding and INTERNAL_KEY_VAULT, storage per person shows here.</p>
            </div>
          ) : (
            <ErrorCard title="Vault storage didn’t load" error={error} onRetry={reload} />
          )}
        </div>
      ) : (
        <>
          {!data ? (
            <div className="kpis sec" aria-hidden="true">
              <Sk h={96} />
              <Sk h={96} />
              <Sk h={96} />
              <Sk h={96} />
            </div>
          ) : (
            <section className="kpis sec" aria-label="Vault totals">
              <div className="kpi">
                <span className="kpi-l">Vaults</span>
                <span className="kpi-v">{num(data.totals.vaults)}</span>
                <span className="kpi-s">{num(all.filter((p) => p.plan !== "free").length)} on a paid plan</span>
              </div>
              <div className="kpi">
                <span className="kpi-l">Stored</span>
                <span className="kpi-v">{bytes(data.totals.used)}</span>
                <span className="kpi-s">encrypted, all versions</span>
              </div>
              <div className="kpi">
                <span className="kpi-l">Largest vault</span>
                <span className="kpi-v">{top ? bytes(top.used) : "–"}</span>
                <span className="kpi-s">{top ? top.name : "nobody yet"}</span>
              </div>
              <div className="kpi">
                <span className="kpi-l">Nearly full</span>
                <span className="kpi-v">{num(all.filter((p) => share(p) >= NEARLY_FULL).length)}</span>
                <span className="kpi-s">{Math.round(NEARLY_FULL * 100)}% of their plan or more</span>
              </div>
            </section>
          )}

          <div className="filters" role="group" aria-label="Filter vaults">
            {chips.map(([f, label]) => (
              <button key={f} className={`fchip${filter === f ? " on" : ""}`} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f === "full" ? <span className="dot warn" /> : null}
                {label} <span className="c">{data ? num(all.filter((p) => matches(p, f)).length) : ""}</span>
              </button>
            ))}
            <input className="inp" type="search" placeholder="Name or email" aria-label="Search vaults" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginLeft: "auto", maxWidth: 240 }} />
          </div>

          <section className="box">
            {!data ? (
              <Sk h={420} r={12} />
            ) : (
              <Table
                cols="minmax(0,2fr) 70px minmax(0,1.6fr) 110px 70px 110px 110px"
                colsS="minmax(0,1fr) auto"
                head={[{ h: "Person" }, { h: "Plan", hide: true }, { h: "Used of plan" }, { h: "Stored", r: true }, { h: "Files", r: true, hide: true }, { h: "Last visit", hide: true }, { h: "Since", hide: true }]}
              >
                {rows.map((p) => {
                  const s = share(p);
                  return (
                    <tr className="dt-r" key={p.userId}>
                      <Td>
                        <span className="who" style={{ display: "grid", gap: 2 }}>
                          <b>{p.name}</b>
                          <span className="box-s">{p.email}</span>
                        </span>
                      </Td>
                      <Td hide>
                        <span className="cx">{PLAN[p.plan]}</span>
                      </Td>
                      <Td>
                        <span style={{ display: "grid", gap: 4 }} title={`${bytes(p.used)} of ${bytes(p.quota)}`}>
                          <span className={`mtr${s >= NEARLY_FULL ? " warn" : ""}`} aria-hidden="true">
                            <i style={{ width: `${Math.min(100, Math.max(p.used ? 1 : 0, s * 100))}%` }} />
                          </span>
                          <span className="box-s num">
                            {Math.round(s * 100)}% of {bytes(p.quota)}
                          </span>
                        </span>
                      </Td>
                      <Td r>
                        <b className="num">{bytes(p.used)}</b>
                      </Td>
                      <Td r hide>
                        {num(p.files)}
                      </Td>
                      <Td hide>{lastSeen(p.lastSeen, t)}</Td>
                      <Td hide>{date(p.createdAt)}</Td>
                    </tr>
                  );
                })}
              </Table>
            )}
            {data && !rows.length ? <p className="box-s" style={{ marginTop: 12 }}>{all.length ? "No vaults match." : "Nobody has opened a vault yet."}</p> : null}
            {data ? (
              <p className="box-s" style={{ marginTop: 12 }}>
                Sizes are what the quota counts: the encrypted files with every version kept. Staff can’t see file names or contents.
              </p>
            ) : null}
          </section>
        </>
      )}
    </>
  );
}

export default function VaultPage() {
  return (
    <Gate areas={["vault"]}>
      <Vault />
    </Gate>
  );
}
