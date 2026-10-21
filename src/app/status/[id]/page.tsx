"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useBusy, useConsole } from "@/components/console/Shell";
import { useAct } from "@/components/console/useAct";
import { Bars, Dialog, ErrorCard, Ic, Sk } from "@/components/console/ui";
import type { IconName } from "@/design/icons";
import { date, duration, num, time } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { IncidentDetail, IncidentStatus, IncidentUpdate, Severity } from "@/lib/org-contract";

const STATUS_NAME: Record<IncidentStatus, string> = { investigating: "Investigating", identified: "Identified", monitoring: "Monitoring", resolved: "Resolved" };
const STATUS_TONE: Record<IncidentStatus, string> = { investigating: "err", identified: "warn", monitoring: "info", resolved: "ok" };
const SEVERITY: Record<Severity, { name: string; tone: string }> = { minor: { name: "Minor", tone: "warn" }, major: { name: "Major", tone: "err" }, critical: { name: "Critical", tone: "err" } };
const HOSTS: Record<string, string> = { auth: "auth.planary.ch", tournament: "tournament.planary.ch", casino: "casino.planary.ch", wishlist: "wishlist.planary.ch", web: "planary.ch" };

/** Timeline label: the status when it changed, "Update" when it didn't, "Opened automatically" for the checks. */
const auto = (u: IncidentUpdate | undefined, older: IncidentUpdate | undefined) => !!u && !older && u.by === "Status checks";

function label(u: IncidentUpdate, older: IncidentUpdate | undefined, oldest: IncidentUpdate | undefined) {
  if (auto(u, older)) return "Opened automatically";
  if (!older || older.status !== u.status || auto(older, oldest)) return STATUS_NAME[u.status];
  return "Update";
}

function dotOf(u: IncidentUpdate, older: IncidentUpdate | undefined, oldest: IncidentUpdate | undefined): { tone: string; icon: IconName } {
  if (auto(u, older)) return { tone: "err", icon: "alert" };
  if (older && older.status === u.status && !auto(older, oldest)) return { tone: "", icon: "dot" };
  return { tone: STATUS_TONE[u.status] === "info" ? "" : STATUS_TONE[u.status], icon: u.status === "resolved" ? "check" : "dot" };
}

function UpdateForm({ incident }: { incident: IncidentDetail }) {
  const { run, busy, error, toast } = useAct();
  const [status, setStatus] = useState<IncidentStatus>(incident.status);
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(incident.showToOrganisers);
  useEffect(() => setStatus(incident.status), [incident.status]);

  return (
    <section className="box" aria-labelledby="up-h">
      <h2 id="up-h" className="box-t" style={{ marginBottom: 14 }}>
        Post an update
      </h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!message.trim()) return;
          const ok = await run(`/console/incidents/${incident.id}/updates`, { status, message: message.trim(), showToOrganisers: show }, "Update posted");
          if (ok) setMessage("");
        }}
      >
        <div className="th-ctl" style={{ marginBottom: 12 }}>
          <div className="f">
            <label className="f-l" htmlFor="i-st">
              Status
            </label>
            <select id="i-st" className="sel" value={status} onChange={(e) => setStatus(e.target.value as IncidentStatus)}>
              {(Object.keys(STATUS_NAME) as IncidentStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_NAME[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="f">
          <label className="f-l" htmlFor="i-msg">
            What changed
          </label>
          <textarea id="i-msg" className="ta" value={message} onChange={(e) => setMessage(e.target.value)} required />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <label className="chk" style={{ cursor: "pointer" }}>
            <input type="checkbox" className="sr" checked={show} onChange={(e) => setShow(e.target.checked)} />
            <i className={show ? "on" : undefined} aria-hidden="true">
              {show ? <Ic name="check" small /> : null}
            </i>
            Also show to organisers of live events in the portal
          </label>
          <button className="btn btn-ink btn-s" type="submit" disabled={busy || !message.trim()}>
            Post update
          </button>
        </div>
        {error ? (
          <p className="f-err" style={{ marginTop: 8 }}>
            {error}
          </p>
        ) : null}
      </form>
      {toast}
    </section>
  );
}

export default function IncidentPage({ params }: PageProps<"/status/[id]">) {
  const { id } = use(params);
  const { can } = useConsole();
  const { data: inc, error, loading, reload } = useOrg<IncidentDetail>(`/console/incidents/${id}`, 30_000);
  const { run, busy, error: actError, toast } = useAct();
  const [dialog, setDialog] = useState<"message" | "resolve" | null>(null);
  const [text, setText] = useState("");
  useBusy(loading);
  const t = now();
  const edit = can("incidents", "edit");

  const crumb = (
    <p className="crumb">
      <Link className="ul" href="/status">
        Status
      </Link>
      <Ic name="chev-r" small />
      {inc?.code ?? "Incident"}
    </p>
  );

  if (error && !inc) return (
    <>
      {crumb}
      <ErrorCard title="The incident didn’t load" error={error} onRetry={reload} />
    </>
  );
  if (!inc) return (
    <>
      {crumb}
      <div className="stack" aria-hidden="true">
        <Sk h={120} />
        <Sk h={420} />
      </div>
    </>
  );

  const open = inc.status !== "resolved";
  const updates = [...inc.updates].sort((a, b) => b.at - a.at);
  const errMax = Math.max(1, ...inc.errorsPerMinute.map((e) => e.n));
  const peak = inc.errorsPerMinute.reduce((a, b) => (b.n > a.n ? b : a), inc.errorsPerMinute[0] ?? { at: t, n: 0 });
  const suspect = inc.deploys.find((d) => d.suspect);
  const running = inc.deploys.find((d) => d.running);

  return (
    <>
      {crumb}
      <div className="ph">
        <div>
          <div className="steps-s">
            <span className={`chip ${SEVERITY[inc.severity].tone}`}>
              <Ic name="alert" />
              {SEVERITY[inc.severity].name}
            </span>
            <span className={`chip ${STATUS_TONE[inc.status]}`}>{STATUS_NAME[inc.status]}</span>
          </div>
          <h1 style={{ marginTop: 12 }}>{inc.title}</h1>
          <p>
            Started {date(inc.startedAt).slice(0, 6)} {time(inc.startedAt)} · {open ? `open for ${duration(t - inc.startedAt)}` : `resolved after ${duration((inc.resolvedAt ?? t) - inc.startedAt)}`} ·{" "}
            {inc.services.map((s) => HOSTS[s]).join(", ")}
          </p>
        </div>
        {edit && open ? (
          <div className="ph-a">
            <button className="btn btn-line btn-s" type="button" onClick={() => (setText(""), setDialog("message"))}>
              <Ic name="msg" small />
              Message organisers
            </button>
            <button className="btn btn-ink btn-s" type="button" onClick={() => (setText(""), setDialog("resolve"))}>
              <Ic name="check" small />
              Resolve
            </button>
          </div>
        ) : null}
      </div>

      <div className="cols">
        <div className="stack">
          {edit && open ? <UpdateForm incident={inc} /> : null}
          <section className="box" aria-labelledby="tl-h">
            <h2 id="tl-h" className="box-t" style={{ marginBottom: 18 }}>
              Timeline
            </h2>
            <ol className="tl">
              {updates.map((u, i) => {
                const older = updates[i + 1];
                const oldest = updates[i + 2];
                const d = dotOf(u, older, oldest);
                return (
                  <li key={u.id}>
                    <span className={`tl-d ${d.tone}`.trim()}>
                      <Ic name={d.icon} />
                    </span>
                    <div>
                      <p className="tl-h">
                        <b>{label(u, older, oldest)}</b>
                        <span>
                          {time(u.at)} · {u.by}
                        </span>
                      </p>
                      <p>{u.message}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
        <div className="stack">
          <section className="box" aria-labelledby="ae-h">
            <div className="box-h">
              <h2 id="ae-h" className="box-t">
                Live events affected
              </h2>
              <span className="box-s">{inc.liveEvents.length}</span>
            </div>
            {inc.liveEvents.length ? (
              <ul>
                {inc.liveEvents.map((l) => (
                  <li className="list-r" key={l.id}>
                    <div className="grow">
                      <b>{l.name}</b>
                      <span className="s">{[l.organisationName, l.phase ?? l.game].filter(Boolean).join(" · ")}</span>
                    </div>
                    <span className="box-s">{num(l.viewers)} watching</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="box-s">No live tournament on the affected services.</p>
            )}
          </section>
          <section className="box" aria-labelledby="ec-h">
            <div className="box-h">
              <h2 id="ec-h" className="box-t">
                Errors per minute
              </h2>
              <span className="box-s">last 30 min</span>
            </div>
            <Bars
              tone="err"
              height={120}
              values={inc.errorsPerMinute.map((e) => e.n)}
              label={`Errors per minute, peaking at ${num(errMax)} around ${time(peak.at)}`}
              titles={inc.errorsPerMinute.map((e) => `${time(e.at)} · ${num(e.n)} errors`)}
            />
            <div className="axis">
              <span>{inc.errorsPerMinute[0] ? time(inc.errorsPerMinute[0].at) : ""}</span>
              <span>Now</span>
            </div>
          </section>
          <section className="box" aria-labelledby="dp-h">
            <div className="box-h">
              <h2 id="dp-h" className="box-t">
                Deploys
              </h2>
            </div>
            {inc.deploys.length ? (
              <dl className="kv">
                {suspect ? (
                  <>
                    <dt>Suspect</dt>
                    <dd>
                      <span className="mono-t">{suspect.commit}</span> · {time(suspect.at)} · {suspect.author}
                      {suspect.message ? (
                        <>
                          <br />
                          <span className="box-s" style={{ fontWeight: 500 }}>
                            {suspect.message}
                          </span>
                        </>
                      ) : null}
                    </dd>
                  </>
                ) : null}
                {running ? (
                  <>
                    <dt>Running</dt>
                    <dd>
                      <span className="mono-t">{running.commit}</span> · since {time(running.at)}
                    </dd>
                  </>
                ) : null}
              </dl>
            ) : (
              <p className="box-s">No deploy information. Set GITHUB_TOKEN on planary-org to see deploys here.</p>
            )}
          </section>
        </div>
      </div>

      {dialog ? (
        <Dialog
          title={dialog === "message" ? "Message organisers" : "Resolve the incident"}
          onClose={() => setDialog(null)}
          actions={
            <>
              <button className="btn btn-line btn-s" type="button" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button
                className="btn btn-ink btn-s"
                type="button"
                disabled={busy || !text.trim()}
                onClick={async () => {
                  const ok =
                    dialog === "message"
                      ? await run(`/console/incidents/${inc.id}/notify`, { message: text.trim() }, "Organisers will see it in the portal")
                      : await run(`/console/incidents/${inc.id}/updates`, { status: "resolved", message: text.trim(), showToOrganisers: inc.showToOrganisers }, "Incident resolved");
                  if (ok) setDialog(null);
                }}
              >
                {dialog === "message" ? "Send" : "Resolve"}
              </button>
            </>
          }
        >
          <div className="f">
            <label className="f-l" htmlFor="dlg-t">
              {dialog === "message" ? "Message, shown as a banner in the portal (German)" : "What fixed it"}
            </label>
            <textarea id="dlg-t" className="ta" value={text} onChange={(e) => setText(e.target.value)} />
            {dialog === "message" ? <span className="f-h">Organisers of live events on {inc.services.map((s) => HOSTS[s]).join(", ")} see it until the incident is resolved.</span> : null}
          </div>
          {actError ? <p className="f-err">{actError}</p> : null}
        </Dialog>
      ) : null}
      {toast}
    </>
  );
}
