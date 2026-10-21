"use client";

import Link from "next/link";
import { use, useState } from "react";
import { BILLING, logoShade, REQUEST_STATE, TOURNAMENT_STATE } from "@/components/console/customer";
import { Gate, useBusy, useConsole } from "@/components/console/Shell";
import { useAct } from "@/components/console/useAct";
import { Dialog, ErrorCard, Ic, ReadOnlyNote, Sk, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import { chf, date, dayMonth, dayTime, initials, lastSeen, num, PLAN_NAME } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { CustomerDetail, Invoice, PlanId, TournamentSummary } from "@/lib/org-contract";

const PRICE: Record<PlanId, string> = { gratis: "free", event: "CHF 49 per tournament", verein: "CHF 19 / month, billed yearly" };
type Tab = "overview" | "members" | "tournaments" | "billing" | "support";

function invoiceStatus(i: Invoice) {
  if (i.status === "paid") return { tone: "ok", label: "Paid" };
  if (i.status === "open" && i.overdueDays > 0) return { tone: "err", label: `Overdue ${i.overdueDays} day${i.overdueDays === 1 ? "" : "s"}` };
  if (i.status === "open") return { tone: "warn", label: "Open" };
  if (i.status === "void") return { tone: "", label: "Void" };
  if (i.status === "uncollectible") return { tone: "err", label: "Uncollectible" };
  return { tone: "", label: "Draft" };
}

function when(t: TournamentSummary, nowMs: number) {
  if (!t.startsAt) return "No date";
  return t.state === "live" || dayMonth(t.startsAt) === dayMonth(nowMs) ? "Today" : dayMonth(t.startsAt);
}

function Invoices({ c }: { c: CustomerDetail }) {
  if (!c.invoices.length) return <p className="box-s" style={{ marginTop: 18 }}>No invoices yet.</p>;
  return (
    <Table cols="minmax(0,1fr) 100px 100px 150px 60px" colsS="minmax(0,1fr) auto auto 44px" style={{ marginTop: 18 }} head={[{ h: "Invoice" }, { h: "Date", hide: true }, { h: "Amount", r: true }, { h: "Status" }, { h: "" }]}>
      {c.invoices.map((i) => {
        const st = invoiceStatus(i);
        return (
          <tr className="dt-r" key={i.id}>
            <Td className="mono-t">{i.number}</Td>
            <Td hide>{date(i.createdAt)}</Td>
            <Td r>{chf(i.amount)}</Td>
            <Td>
              <span className={`cx ${st.tone}`.trim()}>
                <span className={`dot ${st.tone}`.trim()} />
                {st.label}
              </span>
            </Td>
            <Td r>
              {i.pdfUrl ? (
                <a className="alink" href={i.pdfUrl} target="_blank" rel="noreferrer">
                  <Ic name="file" small />
                  PDF<span className="sr"> of invoice {i.number}</span>
                </a>
              ) : null}
            </Td>
          </tr>
        );
      })}
    </Table>
  );
}

function PlanBox({ c }: { c: CustomerDetail }) {
  const pm = c.paymentMethod;
  return (
    <section className="box" aria-labelledby="pl-h">
      <div className="box-h">
        <h2 id="pl-h" className="box-t">
          Plan and billing
        </h2>
        {c.provider ? <span className="box-s">from Stripe</span> : null}
      </div>
      <dl className="kv">
        <dt>Plan</dt>
        <dd>
          {PLAN_NAME[c.plan]} · {PRICE[c.plan]}
        </dd>
        <dt>Renews</dt>
        <dd>{c.renewsAt ? date(c.renewsAt) : "–"}</dd>
        <dt>Payment method</dt>
        <dd>{pm ? (pm.kind === "card" ? `${pm.brand} •••• ${pm.last4}, expires ${String(pm.expMonth).padStart(2, "0")}/${String(pm.expYear).slice(-2)}` : pm.kind === "twint" ? "TWINT" : "Invoice") : "–"}</dd>
        <dt>Billing contact</dt>
        <dd>{c.contact?.email ?? "–"}</dd>
      </dl>
      <Invoices c={c} />
    </section>
  );
}

function Members({ c, t }: { c: CustomerDetail; t: number }) {
  return (
    <section className="box" aria-labelledby="mb-h">
      <div className="box-h">
        <h2 id="mb-h" className="box-t">
          Members
        </h2>
        <span className="box-s">{c.memberList.length}</span>
      </div>
      <ul>
        {c.memberList.map((m) => (
          <li className="list-r" key={m.id}>
            <span className="av">{initials(m.name)}</span>
            <div className="grow">
              <b>{m.name}</b>
              <span className="s">active {lastSeen(m.lastActive, t)}</span>
            </div>
            <span className="cx">{m.role === "owner" ? "Owner" : "Member"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Tournaments({ c, t, all = false }: { c: CustomerDetail; t: number; all?: boolean }) {
  const list = all ? c.tournaments : c.tournaments.slice(0, 3);
  return (
    <section className="box" aria-labelledby="tr-h">
      <div className="box-h">
        <h2 id="tr-h" className="box-t">
          Tournaments
        </h2>
        <span className="box-s">{c.tournamentsThisYear} this year</span>
      </div>
      {list.length ? (
        <ul>
          {list.map((x) => {
            const s = TOURNAMENT_STATE[x.state];
            return (
              <li className="list-r" key={x.id}>
                <div className="grow">
                  <b>{x.name}</b>
                  <span className="s">{when(x, t)}</span>
                </div>
                <span className={`cx ${s.chip}`.trim()}>
                  <span className={`dot ${s.dot}`.trim()} />
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="box-s">No tournaments yet.</p>
      )}
    </section>
  );
}

function Notes({ c }: { c: CustomerDetail }) {
  const { can } = useConsole();
  const { run, busy, error, toast } = useAct();
  const [body, setBody] = useState("");
  return (
    <section className="box" aria-labelledby="nt-h">
      <div className="box-h">
        <h2 id="nt-h" className="box-t">
          Notes
        </h2>
        <span className="box-s">staff only</span>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {c.notes.map((n) => (
          <div className="note" key={n.id}>
            <p className="note-h">
              <b>{n.by}</b>
              {dayTime(n.at)}
            </p>
            <p>{n.body}</p>
          </div>
        ))}
        {!c.notes.length ? <p className="box-s">No notes yet.</p> : null}
      </div>
      {can("notes", "edit") ? (
        <form
          className="f"
          style={{ marginTop: 12 }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!body.trim()) return;
            if (await run(`/console/customers/${c.id}/notes`, { body: body.trim() }, "Note added")) setBody("");
          }}
        >
          <label className="f-l sr" htmlFor="c-note">
            Add a note
          </label>
          <textarea id="c-note" className="ta" style={{ minHeight: 80 }} placeholder="Add a note for the team" value={body} onChange={(e) => setBody(e.target.value)} />
          <div>
            <button className="btn btn-ink btn-s" type="submit" disabled={busy || !body.trim()}>
              Add note
            </button>
          </div>
          {error ? <p className="f-err">{error}</p> : null}
        </form>
      ) : (
        <ReadOnlyNote>{CONSOLE.states.viewerNote}</ReadOnlyNote>
      )}
      {toast}
    </section>
  );
}

function Requests({ c }: { c: CustomerDetail }) {
  return (
    <section className="box" aria-labelledby="rq-h">
      <div className="box-h">
        <h2 id="rq-h" className="box-t">
          Support requests
        </h2>
      </div>
      {c.requests.length ? (
        <ul>
          {c.requests.map((r) => (
            <li className="list-r" key={r.id}>
              <div className="grow">
                <b>
                  <Link href={`/support/${r.id}`} style={{ textDecoration: "none" }}>
                    {r.subject}
                  </Link>
                </b>
                <span className="s mono-t">{r.code}</span>
              </div>
              <span className={`cx ${REQUEST_STATE[r.status].chip}`.trim()}>{REQUEST_STATE[r.status].label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="box-s">No requests.</p>
      )}
    </section>
  );
}

function Actions({ c }: { c: CustomerDetail }) {
  const { run, busy, error, toast } = useAct();
  const [dialog, setDialog] = useState<"reminder" | "plan" | null>(null);
  const open = c.invoices.filter((i) => i.status === "open");
  const [invoice, setInvoice] = useState(open[0]?.id ?? "");
  const [plan, setPlan] = useState<PlanId>(c.plan);
  const [reason, setReason] = useState("");

  return (
    <div className="ph-a">
      <button className="btn btn-line btn-s" type="button" disabled={!open.length} onClick={() => setDialog("reminder")}>
        <Ic name="mail" small />
        Send reminder
      </button>
      <button className="btn btn-ink btn-s" type="button" onClick={() => setDialog("plan")}>
        <Ic name="edit" small />
        Change plan
      </button>
      {dialog === "reminder" ? (
        <Dialog
          title="Send a payment reminder"
          onClose={() => setDialog(null)}
          actions={
            <>
              <button className="btn btn-line btn-s" type="button" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button
                className="btn btn-ink btn-s"
                type="button"
                disabled={busy || !invoice}
                onClick={async () => {
                  if (await run(`/console/customers/${c.id}/reminder`, { invoiceId: invoice }, `Reminder sent to ${c.contact?.email ?? "the billing contact"}`)) setDialog(null);
                }}
              >
                Send reminder
              </button>
            </>
          }
        >
          <div className="f">
            <label className="f-l" htmlFor="rm-i">
              Invoice
            </label>
            <select id="rm-i" className="sel" value={invoice} onChange={(e) => setInvoice(e.target.value)}>
              {open.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.number} · {chf(i.amount)}
                  {i.overdueDays ? ` · overdue ${i.overdueDays} days` : ""}
                </option>
              ))}
            </select>
            <span className="f-h">The billing contact ({c.contact?.email ?? "none on file"}) gets an e-mail with the payment link, in German.</span>
          </div>
          {error ? <p className="f-err">{error}</p> : null}
        </Dialog>
      ) : null}
      {dialog === "plan" ? (
        <Dialog
          title="Change plan"
          onClose={() => setDialog(null)}
          actions={
            <>
              <button className="btn btn-line btn-s" type="button" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button
                className="btn btn-ink btn-s"
                type="button"
                disabled={busy || plan === c.plan || reason.trim().length < 3}
                onClick={async () => {
                  if (await run(`/console/customers/${c.id}/plan`, { plan, reason: reason.trim() }, `${c.name} is on ${PLAN_NAME[plan]} now`)) setDialog(null);
                }}
              >
                Change plan
              </button>
            </>
          }
        >
          <div className="f">
            <label className="f-l" htmlFor="cp-p">
              Plan
            </label>
            <select id="cp-p" className="sel" value={plan} onChange={(e) => setPlan(e.target.value as PlanId)}>
              {(["gratis", "event", "verein"] as PlanId[]).map((p) => (
                <option key={p} value={p}>
                  {PLAN_NAME[p]}
                </option>
              ))}
            </select>
            <span className="f-h">Changes what the organisation can do right away. It doesn’t charge or refund anything at Stripe.</span>
          </div>
          <div className="f">
            <label className="f-l" htmlFor="cp-r">
              Reason, for the audit log
            </label>
            <input id="cp-r" className="inp" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          {error ? <p className="f-err">{error}</p> : null}
        </Dialog>
      ) : null}
      {toast}
    </div>
  );
}

function Customer({ id }: { id: string }) {
  const { can } = useConsole();
  const { data: c, error, loading, reload } = useOrg<CustomerDetail>(`/console/customers/${id}`);
  const [tab, setTab] = useState<Tab>("overview");
  useBusy(loading);
  const t = now();

  const crumb = (name: string) => (
    <p className="crumb">
      <Link className="ul" href="/customers">
        Customers
      </Link>
      <Ic name="chev-r" small />
      {name}
    </p>
  );
  if (error && !c)
    return (
      <>
        {crumb("Customer")}
        <ErrorCard title="The customer didn’t load" error={error} onRetry={reload} />
      </>
    );
  if (!c)
    return (
      <>
        {crumb("Customer")}
        <div className="stack" aria-hidden="true">
          <Sk h={72} />
          <Sk h={420} />
        </div>
      </>
    );

  const tabs: [Tab, string, number | null][] = [
    ["overview", "Overview", null],
    ["members", "Members", c.memberList.length],
    ["tournaments", "Tournaments", c.tournamentsThisYear],
    ["billing", "Billing", null],
    ["support", "Support", c.requests.length],
  ];

  return (
    <>
      {crumb(c.name)}
      <div className="cust-h">
        <span className={`logo logo-l ${logoShade(c.id)}`.trim()} aria-hidden="true">
          {c.initials}
        </span>
        <div className="grow">
          <h1>{c.name}</h1>
          <p>
            <span className="cx">{PLAN_NAME[c.plan]}</span>
            {c.billing !== "paid" && c.billing !== "free" ? (
              <span className={`cx ${BILLING[c.billing].tone}`}>
                <span className={`dot ${BILLING[c.billing].tone}`} />
                {c.billing === "overdue" ? `Invoice overdue ${c.overdueDays} day${c.overdueDays === 1 ? "" : "s"}` : BILLING[c.billing].label(c)}
              </span>
            ) : null}
            <span className="mono-t">{c.id}</span>
            <span>since {date(c.since)}</span>
          </p>
        </div>
        {can("customers", "edit") ? <Actions c={c} /> : null}
      </div>

      <div className="tabbar sec" role="tablist" aria-label="Customer">
        {tabs.map(([k, label, n]) => (
          <button key={k} className={`tab${tab === k ? " on" : ""}`} role="tab" type="button" aria-selected={tab === k} aria-controls="cust-panel" id={`cust-tab-${k}`} onClick={() => setTab(k)}>
            {label}
            {n !== null ? <span className="c">{num(n)}</span> : null}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="cust-panel" aria-labelledby={`cust-tab-${tab}`} style={{ marginTop: 20 }}>
        {tab === "overview" ? (
          <div className="cols">
            <div className="stack">
              <PlanBox c={c} />
              <div className="cols-2">
                <Members c={c} t={t} />
                <Tournaments c={c} t={t} />
              </div>
            </div>
            <div className="stack">
              <Notes c={c} />
              <Requests c={c} />
            </div>
          </div>
        ) : tab === "members" ? (
          <Members c={c} t={t} />
        ) : tab === "tournaments" ? (
          <Tournaments c={c} t={t} all />
        ) : tab === "billing" ? (
          <PlanBox c={c} />
        ) : (
          <Requests c={c} />
        )}
      </div>
    </>
  );
}

export default function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = use(params);
  return (
    <Gate areas={["customers"]}>
      <Customer id={id} />
    </Gate>
  );
}
