"use client";

import { Gate, useBusy } from "@/components/console/Shell";
import { Bars, ErrorCard, Ic, PageHead, Sk } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import { num } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { WishlistTotals } from "@/lib/org-contract";

/** ISO week number, for the chart's axis. */
function week(ms: number) {
  const d = new Date(ms);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round((d.getTime() - jan4.getTime()) / 604_800_000 - (3 - ((jan4.getUTCDay() + 6) % 7)) / 7);
}

function Privacy() {
  const p = CONSOLE.wishlistPrivacy;
  return (
    <section className="priv" aria-labelledby="pv-h">
      <Ic name="shield-check" />
      <div>
        <h2 id="pv-h">{p.h}</h2>
        <p>{p.p}</p>
        <ul>
          {p.li.map((x) => (
            <li key={x}>
              <Ic name="x" small />
              {x}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Wishlist() {
  const { data, error, loading, reload } = useOrg<WishlistTotals>("/console/wishlist", 300_000);
  useBusy(loading);
  const t = now();
  const weeks = data?.newPerWeek.map((_, i, a) => week(t - (a.length - 1 - i) * 7 * 86_400_000)) ?? [];

  return (
    <>
      <PageHead title={CONSOLE.pages.wishlist.title} />
      <Privacy />
      {error && !data ? (
        <div className="sec">
          {error.code === "not_connected" ? (
            <div className="empty">
              <Ic name="gift" />
              <h3>Not connected yet</h3>
              <p>The Wishlist API doesn’t answer totals yet. Once it has its /internal/totals route and WISHLIST_API is set on planary-org, the numbers show here.</p>
            </div>
          ) : (
            <ErrorCard title="Wishlist totals didn’t load" error={error} onRetry={reload} />
          )}
        </div>
      ) : !data ? (
        <div className="kpis sec" aria-hidden="true">
          <Sk h={96} />
          <Sk h={96} />
          <Sk h={96} />
          <Sk h={96} />
        </div>
      ) : (
        <>
          <section className="kpis sec" aria-label="Wishlist totals">
            <div className="kpi">
              <span className="kpi-l">Lists</span>
              <span className="kpi-v">{num(data.lists)}</span>
              <span className="kpi-s">+{num(data.listsNewWeek)} this week</span>
            </div>
            <div className="kpi">
              <span className="kpi-l">Items saved</span>
              <span className="kpi-v">{num(data.items)}</span>
              <span className="kpi-s">{data.lists ? (data.items / data.lists).toFixed(1) : "0"} per list</span>
            </div>
            <div className="kpi">
              <span className="kpi-l">Shared lists</span>
              <span className="kpi-v">{num(data.sharedLists)}</span>
              <span className="kpi-s">{data.lists ? Math.round((data.sharedLists / data.lists) * 100) : 0}% of all lists</span>
            </div>
            <div className="kpi">
              <span className="kpi-l">Reservations this month</span>
              <span className="kpi-v">{num(data.reservationsMonth)}</span>
              <span className="kpi-s">a count, nothing more</span>
            </div>
          </section>
          <div className="cols sec">
            <section className="box" aria-labelledby="wl-h">
              <div className="chart-h">
                <div>
                  <h2 id="wl-h" className="box-t">
                    New lists per week
                  </h2>
                </div>
              </div>
              <Bars values={data.newPerWeek} label={`New lists per week, last ${data.newPerWeek.length} weeks`} titles={data.newPerWeek.map((v, i) => `Week ${weeks[i]}: ${num(v)} new lists`)} />
              <div className="axis">
                <span>Week {weeks[0]}</span>
                <span>This week</span>
              </div>
            </section>
            <section className="box" aria-labelledby="sh-h">
              <div className="box-h">
                <h2 id="sh-h" className="box-t">
                  Where items come from
                </h2>
                <span className="box-s">shop domains, all items</span>
              </div>
              <ul className="share">
                {data.shops.map(([domain, share]) => (
                  <li key={domain}>
                    <span>{domain}</span>
                    <span className="mtr" aria-hidden="true">
                      <i style={{ width: `${Math.min(100, share * 240)}%` }} />
                    </span>
                    <b className="num" style={{ textAlign: "right" }}>
                      {Math.round(share * 100)}%
                    </b>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}

export default function WishlistPage() {
  return (
    <Gate areas={["wishlist"]}>
      <Wishlist />
    </Gate>
  );
}
