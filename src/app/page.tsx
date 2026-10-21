"use client";

import Link from "next/link";
import { useState } from "react";
import { useBusy, useConsole } from "@/components/console/Shell";
import { Bars, Chip, ErrorCard, Ic, LoadingNote, PageHead, Seg, Sk, Spark, StateChip, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import type { IconName } from "@/design/icons";
import { dayMonth, initials, num, pct, shortWhen, time } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { OverviewResponse } from "@/lib/org-contract";

const DAY = 86_400_000;
const APP: Record<string, { name: string; ic: IconName }> = {
  tournament: { name: "Tournament", ic: "bracket" },
  casino: { name: "Casino", ic: "chip" },
  wishlist: { name: "Wishlist", ic: "gift" },
};

function Loading() {
  return (
    <>
      <div className="kpis" aria-hidden="true">
        <Sk h={96} className="sk-k" />
        <Sk h={96} className="sk-k" />
        <Sk h={96} className="sk-k" />
        <Sk h={96} className="sk-k" />
      </div>
      <div className="cols sec" aria-hidden="true">
        <Sk h={300} />
        <Sk h={300} />
      </div>
      <div className="sec" aria-hidden="true">
        <Sk h={220} />
      </div>
      <LoadingNote label={CONSOLE.states.loading} />
    </>
  );
}

function Chart({ data }: { data: OverviewResponse }) {
  const [series, setSeries] = useState<"signups" | "active">("signups");
  const values = data[series];
  const t = now();
  const dayLabels = values.map((_, i) => dayMonth(t - (values.length - 1 - i) * DAY));
  const total = data.signups.reduce((a, b) => a + b, 0);
  const change = data.signupsPrev ? Math.round(((total - data.signupsPrev) / data.signupsPrev) * 100) : null;
  const avg = Math.round(data.active.reduce((a, b) => a + b, 0) / Math.max(1, data.active.length));
  const unit = series === "signups" ? "sign-ups" : "active users";
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (
    <section className="box" aria-labelledby="su-h">
      <div className="chart-h">
        <div>
          <h2 id="su-h" className="box-t">
            {series === "signups" ? "Sign-ups" : "Active users"}, last {data.days} days
          </h2>
        </div>
        <Seg
          label="Chart"
          value={series}
          onChange={setSeries}
          options={[
            ["signups", "Sign-ups"],
            ["active", "Active users"],
          ]}
        />
      </div>
      <p className="big">
        {num(series === "signups" ? total : avg)}{" "}
        <span className="box-s" style={{ fontFamily: "var(--body)", letterSpacing: 0 }}>
          {series === "signups"
            ? `in ${data.days} days${change !== null ? `, ${change >= 0 ? "+" : "−"}${Math.abs(change)}% on the ${data.days} days before` : ""}`
            : "a day on average"}
        </span>
      </p>
      <div style={{ marginTop: 16 }}>
        <Bars
          values={values}
          label={`${series === "signups" ? "Sign-ups" : "Active users"} per day, last ${data.days} days, between ${num(min)} and ${num(max)} a day`}
          titles={values.map((v, i) => `${dayLabels[i]}: ${num(v)} ${unit}`)}
        />
      </div>
      <div className="axis">
        <span>{dayLabels[0]}</span>
        <span>{dayLabels[Math.floor((values.length - 1) / 2)]}</span>
        <span>Today</span>
      </div>
    </section>
  );
}

export default function OverviewPage() {
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const { data, error, loading, reload } = useOrg<OverviewResponse>(`/console/overview?days=${days}`, 60_000);
  useBusy(loading);
  const { status } = useConsole();
  const t = now();
  const downSince = (id: string) => status?.services.find((s) => s.id === id)?.downSince ?? null;

  return (
    <>
      <PageHead title={CONSOLE.pages.overview.title}>
        <Seg
          label="Period"
          value={days}
          onChange={setDays}
          options={[
            ["7", "7 days"],
            ["30", "30 days"],
            ["90", "90 days"],
          ]}
        />
      </PageHead>

      {error && !data ? (
        <ErrorCard title="The overview didn’t load" error={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <section className="kpis" aria-label="Key figures">
            <div className="kpi">
              <span className="kpi-l">Accounts</span>
              <span className="kpi-v">{num(data.accounts)}</span>
              <span className="kpi-s">+{num(data.accountsNew7)} in 7 days</span>
            </div>
            <div className="kpi">
              <span className="kpi-l">Active today</span>
              <span className="kpi-v">{num(data.activeToday)}</span>
              <span className="kpi-s">across all apps</span>
            </div>
            <div className="kpi">
              <span className="kpi-l">Organisations</span>
              <span className="kpi-v">{num(data.organisations)}</span>
              <span className="kpi-s">{num(data.paidOrganisations)} on a paid plan</span>
            </div>
            <div className="kpi">
              <span className="kpi-l">Open support requests</span>
              <span className="kpi-v">{num(data.openRequests)}</span>
              <span className="kpi-s">{num(data.unassignedRequests)} unassigned</span>
            </div>
          </section>

          <div className="cols sec">
            <Chart data={data} />
            <section className="box" aria-labelledby="sr-h">
              <div className="box-h">
                <h2 id="sr-h" className="box-t">
                  Open support requests
                </h2>
                <Link className="alink" href="/support">
                  Inbox
                  <Ic name="arrow-r" small />
                </Link>
              </div>
              {data.requests.length ? (
                <ul>
                  {data.requests.map((r) => (
                    <li className="list-r" key={r.id}>
                      <div className="grow">
                        <b>
                          <Link href={`/support/${r.id}`} style={{ textDecoration: "none" }}>
                            {r.subject}
                          </Link>
                        </b>
                        <span className="s">
                          {r.organisation?.name ?? r.from.name} · {shortWhen(r.createdAt, t)}
                        </span>
                      </div>
                      {r.assignee ? (
                        <span className="av" title={r.assignee.name}>
                          {initials(r.assignee.name)}
                        </span>
                      ) : (
                        <Chip tone="line">Unassigned</Chip>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="box-s">Nothing open.</p>
              )}
            </section>
          </div>

          <section className="box sec" aria-labelledby="au-h">
            <div className="box-h">
              <h2 id="au-h" className="box-t">
                Active users per app
              </h2>
            </div>
            <Table
              cols="minmax(0,1.6fr) 80px 80px 80px 110px 100px"
              colsS="minmax(0,1fr) 56px 64px 72px"
              head={[{ h: "App" }, { h: "Today", r: true }, { h: "7 days", r: true }, { h: "30 days", r: true, hide: true }, { h: "Last 30 days", hide: true }, { h: "Service" }]}
            >
              {data.apps.map((a) => (
                <tr className="dt-r" key={a.app}>
                  <Td>
                    <span className="who">
                      <span className="appi">
                        <Ic name={APP[a.app].ic} small />
                      </span>
                      <b>{APP[a.app].name}</b>
                    </span>
                  </Td>
                  <Td r>
                    <b>{num(a.today)}</b>
                  </Td>
                  <Td r>{num(a.d7)}</Td>
                  <Td r hide>
                    {num(a.d30)}
                  </Td>
                  <Td hide>
                    <Spark values={a.spark} />
                  </Td>
                  <Td>
                    <StateChip state={a.state} />
                  </Td>
                </tr>
              ))}
            </Table>
          </section>

          <section className="sec" aria-labelledby="sv-h">
            <div className="box-h">
              <h2 id="sv-h" className="box-t">
                Services
              </h2>
              <Link className="alink" href="/status">
                Status
                <Ic name="arrow-r" small />
              </Link>
            </div>
            <div className="svc-strip">
              {data.services.map((s) => (
                <Link key={s.id} className={`svc${s.state === "down" ? " err" : ""}`} href="/status">
                  <span className={`dot ${s.state === "down" ? "err" : s.state === "degraded" ? "warn" : s.state === "ok" ? "ok" : ""}`} />
                  <span className="grow">
                    <b>{s.name}</b>
                    <span>{s.state === "down" ? (downSince(s.id) ? `Down since ${time(downSince(s.id)!)}` : "Down") : `${s.medianMs ?? "–"} ms · ${pct(s.uptime30)}`}</span>
                  </span>
                  <span className="sr">{s.state === "ok" ? "Up" : s.state}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
