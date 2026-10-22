"use client";

import Link from "next/link";
import { useState } from "react";
import { REQUEST_STATE } from "./customer";
import { useBusy, useConsole } from "./Shell";
import { useAct } from "./useAct";
import { Empty, ErrorCard, Ic, ReadOnlyNote, Seg, Sk } from "./ui";
import { CONSOLE } from "@/design/console-copy";
import { initials, PLAN_NAME, shortWhen, time } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { ConsoleApi, RequestDetail, RequestStatus, RequestSummary } from "@/lib/org-contract";

type List = ConsoleApi["GET /console/support"]["R"];
const TOPIC: Record<RequestSummary["topic"], string> = { tournament: "Tournament", billing: "Billing", plan: "Plan", account: "Account", other: "Other" };
const STATUS_OPTION: Record<RequestStatus, string> = { open: "Open", waiting: "Waiting for customer", done: "Done" };

function Thread({ id, assignable, auto }: { id: string; assignable: { id: string; name: string }[]; auto: boolean }) {
  const { can } = useConsole();
  const { data: r, error, reload } = useOrg<RequestDetail>(`/console/support/${id}`, 30_000);
  const { run, busy, error: actError, toast } = useAct();
  const [mode, setMode] = useState<"staff" | "internal">("staff");
  const [body, setBody] = useState("");
  const edit = can("support", "edit");
  const t = now();

  if (error && !r)
    return (
      <section className={`th${auto ? " auto" : ""}`} style={{ padding: 24 }}>
        <ErrorCard title="The request didn’t load" error={error} onRetry={reload} />
      </section>
    );
  if (!r)
    return (
      <section className={`th${auto ? " auto" : ""}`} style={{ padding: 24 }} aria-hidden="true">
        <Sk h={120} />
      </section>
    );

  const first = r.from.name.split(" ")[0];
  async function send(setStatus?: RequestStatus) {
    if (!body.trim()) return;
    const done = mode === "internal" ? "Internal note added" : setStatus === "waiting" ? "Sent, waiting for the customer" : "Reply sent";
    if (await run(`/console/support/${r!.id}/messages`, { kind: mode, body: body.trim(), ...(setStatus ? { setStatus } : {}) }, done)) setBody("");
  }

  return (
    <section className={`th${auto ? " auto" : ""}`} aria-labelledby="th-h">
      <div className="th-h">
        <Link className="alink th-back" href="/support">
          <Ic name="chev-l" small />
          All requests
        </Link>
        <p className="box-s mono-t">{r.code}</p>
        <h2 id="th-h">{r.subject}</h2>
        <p className="th-meta">
          <span>
            <b>{r.organisation?.name ?? "No organisation"}</b> · {r.from.name}
          </span>
          {r.plan ? <span className="cx">{PLAN_NAME[r.plan]}</span> : null}
          <span className="cx">
            {TOPIC[r.topic]}
            {r.tournament ? ` · ${r.tournament.name}` : ""}
          </span>
          {r.urgent ? (
            <span className="cx warn">
              <Ic name="zap" />
              During a live event
            </span>
          ) : null}
          <span>opened {shortWhen(r.createdAt, t)}</span>
        </p>
        <div className="th-ctl">
          <div className="f">
            <label className="f-l" htmlFor="s-st">
              Status
            </label>
            <select
              id="s-st"
              className="sel"
              disabled={!edit || busy}
              value={r.status}
              onChange={(e) => void run(`/console/support/${r.id}`, { status: e.target.value }, `Set to ${STATUS_OPTION[e.target.value as RequestStatus].toLowerCase()}`)}
            >
              {(Object.keys(STATUS_OPTION) as RequestStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_OPTION[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label className="f-l" htmlFor="s-as">
              Assigned to
            </label>
            <select
              id="s-as"
              className="sel"
              disabled={!edit || busy}
              value={r.assignee?.id ?? ""}
              onChange={(e) => {
                const who = assignable.find((a) => a.id === e.target.value);
                void run(`/console/support/${r.id}`, { assigneeId: e.target.value || null }, who ? `Assigned to ${who.name}` : "Unassigned");
              }}
            >
              {assignable.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
              {r.assignee && !assignable.some((a) => a.id === r.assignee!.id) ? <option value={r.assignee.id}>{r.assignee.name}</option> : null}
              <option value="">Nobody</option>
            </select>
          </div>
        </div>
        {actError ? <p className="f-err">{actError}</p> : null}
      </div>
      <div className="msgs" aria-live="polite">
        {r.messages.map((m) => {
          const cls = m.kind === "customer" ? "them" : m.kind === "staff" ? "us" : "int";
          return (
            <div className={`msg ${cls}`} key={m.id}>
              <p className="msg-h">
                <span className="av" style={{ width: 22, height: 22, fontSize: 8 }}>
                  {initials(m.author.name)}
                </span>
                <b>{m.author.name}</b>
                {shortWhen(m.at, t) === time(m.at) ? time(m.at) : `${shortWhen(m.at, t)} ${time(m.at)}`}
                {m.kind === "internal" ? (
                  <span className="cx warn" style={{ height: 20 }}>
                    <Ic name="lock" />
                    Internal note
                  </span>
                ) : null}
              </p>
              <div className="msg-b">
                {m.body.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {m.attachments.map((a) => (
                  <a key={a.id} className="att" href={a.url} target="_blank" rel="noreferrer">
                    <Ic name="image" small />
                    {a.name}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {edit ? (
        <form
          className="comp"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="comp-tabs" role="tablist" aria-label="Write">
            <button type="button" role="tab" className={mode === "staff" ? "on" : undefined} aria-selected={mode === "staff"} onClick={() => setMode("staff")}>
              Reply
            </button>
            <button type="button" role="tab" className={mode === "internal" ? "on" : undefined} aria-selected={mode === "internal"} onClick={() => setMode("internal")}>
              Internal note
            </button>
          </div>
          <label className="sr" htmlFor="s-rep">
            {mode === "staff" ? `Reply to ${r.from.name}` : "Internal note"}
          </label>
          <textarea
            id="s-rep"
            className="ta"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={mode === "staff" ? `Reply in German, ${first} wrote in German` : "Only staff see this"}
          />
          <div className="comp-f">
            <span className="grow box-s">{mode === "staff" ? `${first} gets an email and sees it in the portal.` : "Never shown to the customer."}</span>
            <button className="btn btn-line btn-s" type="submit" disabled={busy || !body.trim()}>
              {mode === "staff" ? "Send" : "Add note"}
            </button>
            {mode === "staff" ? (
              <button className="btn btn-ink btn-s" type="button" disabled={busy || !body.trim()} onClick={() => void send("waiting")}>
                <Ic name="send" small />
                Send and set to waiting
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <div style={{ margin: "0 24px 24px" }}>
          <ReadOnlyNote>Viewers can read requests but can’t reply.</ReadOnlyNote>
        </div>
      )}
      {toast}
    </section>
  );
}

/** Two panes: the request list (status tabs, all / mine / unassigned) and the selected thread. */
export function Inbox({ selected }: { selected?: string }) {
  const [status, setStatus] = useState<RequestStatus>("open");
  const [who, setWho] = useState<"all" | "mine" | "unassigned">("all");
  const { data, error, loading, reload } = useOrg<List>(`/console/support?status=${status}&who=${who}`, 30_000);
  useBusy(loading);
  const t = now();
  const list = data?.requests ?? [];
  const current = selected ?? list[0]?.id;

  return (
    <>
      <div className="ph">
        <div>
          <h1>{CONSOLE.pages.support.title}</h1>
        </div>
      </div>
      {error && !data ? (
        <ErrorCard title="Support didn’t load" error={error} onRetry={reload} />
      ) : (
        <div className={`inbox${selected ? " has-sel" : ""}`}>
          <div className="ib-list">
            <div className="ib-tools">
              <div className="tabbar" role="tablist" aria-label="Status" style={{ border: 0 }}>
                {(["open", "waiting", "done"] as RequestStatus[]).map((s) => (
                  <button key={s} className={`tab${status === s ? " on" : ""}`} role="tab" type="button" aria-selected={status === s} onClick={() => setStatus(s)}>
                    {REQUEST_STATE[s].label}
                    {s !== "done" && data ? <span className="c">{data.counts[s]}</span> : null}
                  </button>
                ))}
              </div>
              <Seg
                label="Assigned"
                value={who}
                onChange={setWho}
                options={[
                  ["all", "All"],
                  ["mine", "Mine"],
                  ["unassigned", "Unassigned"],
                ]}
              />
            </div>
            {!data ? (
              <div style={{ padding: 16 }} aria-hidden="true">
                <Sk h={300} r={12} />
              </div>
            ) : !list.length ? (
              <div style={{ padding: 16 }}>
                <Empty title={status === "open" ? CONSOLE.states.emptyH : "Nothing here"}>{status === "open" ? CONSOLE.states.emptyP : null}</Empty>
              </div>
            ) : (
              <div className="ib-items">
                {list.map((r) => {
                  const on = r.id === current;
                  return (
                    <Link key={r.id} className={`ib-it${on ? " on" : ""}${r.unread ? " unread" : ""}`} href={`/support/${r.id}`} aria-current={on ? "page" : undefined}>
                      <b>
                        {r.subject}
                        {r.unread ? <span className="sr"> (unread)</span> : null}
                      </b>
                      <span className="t">{shortWhen(r.updatedAt, t)}</span>
                      <span className="s">
                        <span>{r.organisation?.name ?? r.from.name}</span>
                        <span className="cx" style={{ height: 20 }}>
                          {TOPIC[r.topic]}
                        </span>
                        {r.urgent ? (
                          <span className="cx warn" style={{ height: 20 }}>
                            <Ic name="zap" />
                            During a live event
                          </span>
                        ) : null}
                        {r.assignee ? (
                          <span className="av" style={{ width: 20, height: 20, fontSize: 8, marginLeft: "auto" }} title={r.assignee.name}>
                            {initials(r.assignee.name)}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          {current ? (
            <Thread key={current} id={current} assignable={data?.assignable ?? []} auto={!selected} />
          ) : (
            <div className="th auto" style={{ display: "grid", placeItems: "center", color: "var(--t2)" }}>
              <p>No request selected.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
