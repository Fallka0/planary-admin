"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Gate, useBusy } from "@/components/console/Shell";
import { ErrorCard, Ic, PageHead, Sk, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import { date, francs, num, PLAN_NAME } from "@/lib/fmt";
import { orgDownload, useOrg } from "@/lib/org";
import type { CustomerRow, PlanId } from "@/lib/org-contract";
import { BILLING, logoShade } from "@/components/console/customer";

type Filter = "all" | PlanId | "overdue";

function Customers() {
  const { accessToken } = useAuth();
  const { data, error, loading, reload } = useOrg<{ customers: CustomerRow[] }>("/console/customers");
  const [filter, setFilter] = useState<Filter>("all");
  const [exporting, setExporting] = useState(false);
  useBusy(loading || exporting);

  const all = data?.customers ?? [];
  const count = (f: Filter) => all.filter((c) => f === "all" || (f === "overdue" ? c.billing === "overdue" : c.plan === f)).length;
  const rows = all.filter((c) => filter === "all" || (filter === "overdue" ? c.billing === "overdue" : c.plan === filter));
  const chips: [Filter, string][] = [
    ["all", "All"],
    ["plus", "Plus"],
    ["gratis", "Gratis"],
    ["overdue", "Overdue"],
  ];

  return (
    <>
      <PageHead title={CONSOLE.pages.customers.title}>
        <button
          className="btn btn-line btn-s"
          type="button"
          disabled={!data || exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await orgDownload(accessToken, "/console/customers.csv", "planary-customers.csv");
            } finally {
              setExporting(false);
            }
          }}
        >
          <Ic name="download" small />
          Export CSV
        </button>
      </PageHead>
      {error && !data ? (
        <ErrorCard title={CONSOLE.states.errorH} error={error} onRetry={reload} />
      ) : (
        <>
          <div className="filters" role="group" aria-label="Filter customers">
            {chips.map(([f, label]) => (
              <button key={f} className={`fchip${filter === f ? " on" : ""}`} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f === "overdue" ? <span className="dot err" /> : null}
                {label} <span className="c">{data ? num(count(f)) : ""}</span>
              </button>
            ))}
          </div>
          <section className="box">
            {!data ? (
              <Sk h={420} r={12} />
            ) : (
              <Table
                cols="minmax(0,2fr) 90px 80px 130px 90px minmax(0,1.3fr) 110px"
                colsS="minmax(0,1fr) auto auto"
                head={[{ h: "Organisation" }, { h: "Plan" }, { h: "Members", r: true, hide: true }, { h: "Tournaments 2026", r: true, hide: true }, { h: "CHF / year", r: true, hide: true }, { h: "Billing" }, { h: "Customer since", hide: true }]}
              >
                {rows.map((c) => (
                  <tr className="dt-r" key={c.id}>
                    <Td>
                      <span className="who">
                        <span className={`logo ${logoShade(c.id)}`.trim()} aria-hidden="true">
                          {c.initials}
                        </span>
                        <Link className="rowlink" href={`/customers/${c.id}`}>
                          {c.name}
                        </Link>
                      </span>
                    </Td>
                    <Td>
                      <span className="cx">{PLAN_NAME[c.plan]}</span>
                    </Td>
                    <Td r hide>
                      {num(c.members)}
                    </Td>
                    <Td r hide>
                      {num(c.tournamentsThisYear)}
                    </Td>
                    <Td r hide>
                      {francs(c.revenueYear)}
                    </Td>
                    <Td>
                      <span className={`cx ${BILLING[c.billing].tone}`.trim()}>
                        <span className={`dot ${BILLING[c.billing].tone}`.trim()} />
                        {BILLING[c.billing].label(c)}
                      </span>
                    </Td>
                    <Td hide>{date(c.since)}</Td>
                  </tr>
                ))}
              </Table>
            )}
            {data && !rows.length ? <p className="box-s" style={{ marginTop: 12 }}>No customers match this filter.</p> : null}
          </section>
        </>
      )}
    </>
  );
}

export default function CustomersPage() {
  return (
    <Gate areas={["customers"]}>
      <Customers />
    </Gate>
  );
}
