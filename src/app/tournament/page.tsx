"use client";

import { useState } from "react";
import { logoShade, TOURNAMENT_STATE } from "@/components/console/customer";
import { Gate, useBusy, useConsole } from "@/components/console/Shell";
import { ErrorCard, Ic, PageHead, Sk, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import { dayMonth, num, PLAN_NAME, time } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { ConsoleApi, OrganiserRow, TournamentState, TournamentSummary } from "@/lib/org-contract";

const APP = "https://tournament.planary.ch";
type Tab = "tours" | "orgs" | "live";
type Filter = "all" | TournamentState;

function teams(t: TournamentSummary) {
  return t.state === "draft" && !t.teams ? "–" : `${t.teams} / ${t.maxTeams}`;
}

function date(t: TournamentSummary, nowMs: number) {
  if (!t.startsAt) return "–";
  return dayMonth(t.startsAt) === dayMonth(nowMs) ? "Today" : dayMonth(t.startsAt);
}

function LiveCards({ live, alerts }: { live: TournamentSummary[]; alerts: Set<string> }) {
  return (
    <section aria-labelledby="lv-h">
      <div className="box-h">
        <h2 id="lv-h" className="box-t">
          Live now
        </h2>
        <span className="box-s">refreshes every 10 seconds</span>
      </div>
      {live.length ? (
        <div className="live-cards">
          {live.map((l) => (
            <article className="lc" key={l.id}>
              <div className="lc-h">
                <span className="lc-live">
                  <i aria-hidden="true" />
                  {l.phase ?? "Live"}
                </span>
                <span className="box-s">{num(l.viewers)} watching</span>
              </div>
              <h3 className="lc-n">{l.name}</h3>
              <dl className="kv">
                <dt>Organiser</dt>
                <dd>{l.organisationName ?? "–"}</dd>
                <dt>Game</dt>
                <dd>
                  {l.game} · {l.teams} teams
                </dd>
                <dt>Started</dt>
                <dd>{l.startsAt ? time(l.startsAt) : "–"}</dd>
              </dl>
              {alerts.has(l.id) ? (
                <p className="cx err" style={{ width: "max-content" }}>
                  <Ic name="alert" />
                  Open support request
                </p>
              ) : null}
              <a className="alink" href={`${APP}/${l.slug}`} target="_blank" rel="noreferrer">
                Watch as a viewer
                <Ic name="arrow-ur" small />
              </a>
            </article>
          ))}
        </div>
      ) : (
        <p className="box-s">No tournament is live right now.</p>
      )}
    </section>
  );
}

function Organisers() {
  const { data, error, reload } = useOrg<{ organisers: OrganiserRow[] }>("/console/organisers");
  const t = now();
  if (error && !data) return <ErrorCard title="Organisers didn’t load" error={error} onRetry={reload} />;
  const STATUS: Record<OrganiserRow["status"], { tone: string; label: (o: OrganiserRow) => string }> = {
    active: { tone: "ok", label: () => "Active" },
    overdue: { tone: "err", label: () => "Overdue" },
    free: { tone: "", label: (o) => (o.kind === "person" ? "Free, no organisation" : "Free") },
  };
  return (
    <section className="box" aria-labelledby="or-h">
      <div className="box-h">
        <h2 id="or-h" className="box-t">
          Organisers
        </h2>
        <span className="box-s">Organisations, and people who run tournaments without one</span>
      </div>
      {!data ? (
        <Sk h={300} r={12} />
      ) : (
        <Table
          cols="minmax(0,1.8fr) 90px 90px 130px minmax(0,1.6fr) 170px"
          colsS="minmax(0,1fr) auto auto"
          head={[{ h: "Organiser" }, { h: "Plan" }, { h: "Organisers", r: true, hide: true }, { h: "Tournaments 2026", r: true, hide: true }, { h: "Latest", hide: true }, { h: "Account" }]}
        >
          {data.organisers.map((o) => {
            const st = STATUS[o.status];
            const latest = o.latest ? `${o.latest.name} · ${o.latest.state === "draft" ? "draft" : o.latest.at ? (dayMonth(o.latest.at) === dayMonth(t) ? "today" : dayMonth(o.latest.at)) : "–"}` : "–";
            return (
              <tr className="dt-r" key={o.id}>
                <Td>
                  <span className="who">
                    <span className={`logo ${logoShade(o.id)}`.trim()} aria-hidden="true">
                      {o.initials}
                    </span>
                    <b>{o.name}</b>
                  </span>
                </Td>
                <Td>
                  <span className="cx">{PLAN_NAME[o.plan]}</span>
                </Td>
                <Td r hide>
                  {num(o.organisers)}
                </Td>
                <Td r hide>
                  {num(o.tournaments)}
                </Td>
                <Td hide>{latest}</Td>
                <Td>
                  <span className={`cx ${st.tone}`.trim()}>
                    <span className={`dot ${st.tone}`.trim()} />
                    {st.label(o)}
                  </span>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </section>
  );
}

function Tournament() {
  const { can } = useConsole();
  const [tab, setTab] = useState<Tab>("tours");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useOrg<{ tournaments: TournamentSummary[] }>("/console/tournaments", 10_000);
  const { data: orgs } = useOrg<{ organisers: OrganiserRow[] }>("/console/organisers");
  const { data: reqs } = useOrg<ConsoleApi["GET /console/support"]["R"]>(can("support") ? "/console/support?status=open" : null, 30_000);
  useBusy(loading);
  const t = now();

  const all = data?.tournaments ?? [];
  const live = all.filter((x) => x.state === "live");
  const alerts = new Set((reqs?.requests ?? []).map((r) => r.tournament?.id).filter(Boolean) as string[]);
  const term = q.trim().toLowerCase();
  const rows = all.filter((x) => (filter === "all" || x.state === filter) && (!term || [x.name, x.organisationName ?? "", x.game].some((s) => s.toLowerCase().includes(term))));
  const count = (f: Filter) => all.filter((x) => f === "all" || x.state === f).length;
  const tabs: [Tab, string, number | null][] = [
    ["tours", "Tournaments", data ? all.length : null],
    ["orgs", "Organisers", orgs ? orgs.organisers.length : null],
    ["live", "Live now", data ? live.length : null],
  ];
  const filters: [Filter, string][] = [
    ["all", "All"],
    ["live", "Live"],
    ["open", "Sign-up open"],
    ["draft", "Drafts"],
    ["done", "Finished"],
  ];

  return (
    <>
      <PageHead title={CONSOLE.pages.tournament.title}>
        <a className="btn btn-line btn-s" href={APP} target="_blank" rel="noreferrer">
          <Ic name="arrow-ur" small />
          Open the app
        </a>
      </PageHead>
      <div className="tabbar subnav" role="tablist" aria-label="Tournament">
        {tabs.map(([k, label, n]) => (
          <button key={k} className={`tab${tab === k ? " on" : ""}`} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}>
            {label}
            {n !== null ? <span className="c">{num(n)}</span> : null}
          </button>
        ))}
      </div>
      {tab === "orgs" ? (
        <Organisers />
      ) : error && !data ? (
        <ErrorCard title="Tournaments didn’t load" error={error} onRetry={reload} />
      ) : !data ? (
        <div className="stack" aria-hidden="true">
          <Sk h={250} />
          <Sk h={420} />
        </div>
      ) : (
        <>
          <LiveCards live={live} alerts={alerts} />
          {tab === "tours" ? (
            <section className="box sec" aria-labelledby="at-h">
              <div className="box-h">
                <h2 id="at-h" className="box-t">
                  All tournaments
                </h2>
                <label className="srch" style={{ width: 260 }}>
                  <span className="sr">Search tournaments</span>
                  <Ic name="search" small />
                  <input className="inp" type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
                </label>
              </div>
              <div className="filters" role="group" aria-label="Filter tournaments">
                {filters.map(([f, label]) => (
                  <button key={f} className={`fchip${filter === f ? " on" : ""}`} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                    {label} <span className="c">{num(count(f))}</span>
                  </button>
                ))}
              </div>
              <Table
                cols="minmax(0,1.4fr) minmax(0,1.4fr) minmax(0,1.2fr) 70px 80px 130px 64px"
                colsS="minmax(0,1fr) 56px auto"
                head={[{ h: "Tournament" }, { h: "Organisation", hide: true }, { h: "Game", hide: true }, { h: "Teams", r: true }, { h: "Plan", hide: true }, { h: "Status" }, { h: "Date", r: true, hide: true }]}
              >
                {rows.map((x) => {
                  const s = TOURNAMENT_STATE[x.state];
                  return (
                    <tr className="dt-r" key={x.id}>
                      <Td>
                        <b>{x.name}</b>
                      </Td>
                      <Td hide>{x.organisationName ?? "–"}</Td>
                      <Td hide>{x.game}</Td>
                      <Td r>{teams(x)}</Td>
                      <Td hide>
                        <span className="cx">{PLAN_NAME[x.plan]}</span>
                      </Td>
                      <Td>
                        <span className={`cx ${s.chip}`.trim()}>
                          <span className={`dot ${s.dot}`.trim()} />
                          {s.label}
                        </span>
                      </Td>
                      <Td r hide>
                        {date(x, t)}
                      </Td>
                    </tr>
                  );
                })}
              </Table>
              {!rows.length ? <p className="box-s" style={{ marginTop: 12 }}>No tournaments match.</p> : null}
            </section>
          ) : null}
        </>
      )}
    </>
  );
}

export default function TournamentPage() {
  return (
    <Gate areas={["tournament"]}>
      <Tournament />
    </Gate>
  );
}
