"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBusy, useConsole } from "@/components/console/Shell";
import { useAct } from "@/components/console/useAct";
import { Dialog, ErrorCard, Ic, PageHead, Sk, Spark, StateChip, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import { dayMonth, dayTime, duration, num, pct, shortName, time } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { IncidentDetail, IncidentSummary, ServiceId, Severity, StatusResponse } from "@/lib/org-contract";

const SERVICE_IDS: ServiceId[] = ["auth", "tournament", "casino", "wishlist", "web"];

function OpenIncidentDialog({ services, onClose }: { services: StatusResponse["services"]; onClose: () => void }) {
  const router = useRouter();
  const { run, busy, error } = useAct();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("major");
  const [picked, setPicked] = useState<ServiceId[]>(services.filter((s) => s.state === "down").map((s) => s.id));
  const [message, setMessage] = useState("");
  const ok = title.trim().length >= 4 && picked.length > 0 && message.trim().length > 0;

  return (
    <Dialog
      title="Open an incident"
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-line btn-s" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-ink btn-s"
            type="button"
            disabled={!ok || busy}
            onClick={async () => {
              const body = { title: title.trim(), severity, services: picked, message: message.trim() };
              const res = await run<{ id: string }>("/console/incidents", body, "Incident opened");
              if (res) router.push(`/status/${res.id}`);
            }}
          >
            Open incident
          </button>
        </>
      }
    >
      <div className="f">
        <label className="f-l" htmlFor="ni-t">
          Title
        </label>
        <input id="ni-t" className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tournament: live API not responding" />
      </div>
      <div className="f">
        <label className="f-l" htmlFor="ni-s">
          Severity
        </label>
        <select id="ni-s" className="sel" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
          <option value="minor">Minor</option>
          <option value="major">Major</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <fieldset className="f" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="f-l">Affected services</legend>
        {SERVICE_IDS.map((id) => {
          const s = services.find((x) => x.id === id);
          return (
            <label key={id} className="chk">
              <input
                type="checkbox"
                checked={picked.includes(id)}
                onChange={(e) => setPicked((p) => (e.target.checked ? [...p, id] : p.filter((x) => x !== id)))}
              />
              {s?.name ?? id}
            </label>
          );
        })}
      </fieldset>
      <div className="f">
        <label className="f-l" htmlFor="ni-m">
          First update
        </label>
        <textarea id="ni-m" className="ta" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

function involved(i: IncidentSummary, detail?: IncidentDetail | null) {
  const names = [...new Set((detail?.updates ?? []).filter((u) => u.by !== "Status checks").map((u) => shortName(u.by)))];
  return names.length ? ` · ${names.join(", ")}` : "";
}

export default function StatusPage() {
  const { can } = useConsole();
  const { data, error, loading, reload } = useOrg<StatusResponse>("/console/status", 60_000);
  const [checkedAt, setCheckedAt] = useState(() => now());
  const [opening, setOpening] = useState(false);
  useBusy(loading);
  const t = now();

  const down = data?.services.filter((s) => s.state === "down") ?? [];
  const first = data?.open[0] ?? null;
  const { data: firstDetail } = useOrg<IncidentDetail>(first ? `/console/incidents/${first.id}` : null);
  const fine = data?.services.filter((s) => s.state === "ok").map((s) => s.name) ?? [];
  const lastResolved = data?.recent[0] ?? null;

  let sumH: string = CONSOLE.sysUp;
  let sumP = "";
  if (data) {
    if (down.length) {
      const d = down[0];
      sumH = `${d.name} is down`;
      const since = d.downSince ?? t;
      sumP = `Since ${time(since)}, ${duration(t - since).replace(" min", " minutes")}. ${fine.length ? `${fine.slice(0, -1).join(", ")}${fine.length > 1 ? " and " : ""}${fine[fine.length - 1]} ${fine.length > 1 ? "are" : "is"} fine.` : ""}`;
    } else {
      sumP = `${data.services.length === 5 ? "Five" : num(data.services.length)} services, all answering.${
        lastResolved?.resolvedAt ? ` Last incident ${dayMonth(lastResolved.startedAt)}, resolved in ${duration(lastResolved.resolvedAt - lastResolved.startedAt).replace(" min", " minutes")}.` : ""
      }`;
    }
  }

  return (
    <>
      <PageHead title={CONSOLE.pages.status.title}>
        <span className="box-s">Checked {time(checkedAt)}</span>
        <button
          className="btn btn-line btn-s"
          type="button"
          onClick={() => {
            reload();
            setCheckedAt(now());
          }}
        >
          <Ic name="refresh" small />
          Check now
        </button>
      </PageHead>

      {error && !data ? (
        <ErrorCard title="Status didn’t load" error={error} onRetry={reload} />
      ) : !data ? (
        <div aria-hidden="true" className="stack">
          <Sk h={88} />
          <Sk h={340} />
        </div>
      ) : (
        <>
          <div className={`sum${down.length ? " err" : ""}`}>
            <span className="sum-i">
              <Ic name={down.length ? "alert" : "check"} />
            </span>
            <div className="grow">
              <h2>{sumH}</h2>
              <p>{sumP}</p>
            </div>
            {down.length && first ? (
              <Link className="btn btn-ink btn-s" href={`/status/${first.id}`}>
                {first.code} · {first.status[0].toUpperCase() + first.status.slice(1)}
              </Link>
            ) : null}
          </div>

          <section className="box sec" aria-labelledby="svc-h">
            <div className="box-h">
              <h2 id="svc-h" className="box-t">
                Services
              </h2>
              <span className="box-s">Last hour · 30 days uptime</span>
            </div>
            <Table
              cols="minmax(0,1.5fr) 100px 90px 110px 76px minmax(0,1.4fr) 90px"
              colsS="minmax(0,1fr) 76px 64px 44px"
              head={[{ h: "Service" }, { h: "Status" }, { h: "Response", r: true }, { h: "Last hour", hide: true }, { h: "Uptime", r: true, hide: true }, { h: "Last deploy", hide: true }, { h: "Errors 24 h", r: true }]}
            >
              {data.services.map((s) => (
                <tr className="dt-r" key={s.id}>
                  <Td>
                    <span className="who">
                      <span>
                        <b>{s.name}</b>
                        <span>{s.host}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <StateChip state={s.state} />
                  </Td>
                  <Td r>
                    <b>{s.state === "down" ? "timeout" : s.medianMs !== null ? `${s.medianMs} ms` : "–"}</b>
                  </Td>
                  <Td hide>
                    <Spark values={s.spark} tone={s.state === "down" ? "err" : undefined} />
                  </Td>
                  <Td r hide>
                    {pct(s.uptime30)}
                  </Td>
                  <Td hide>
                    {s.deploy ? (
                      <span className="who">
                        <span>
                          <b className="mono-t">{s.deploy.commit}</b>
                          <span>
                            {dayTime(s.deploy.at)} · {s.deploy.author}
                          </span>
                        </span>
                      </span>
                    ) : (
                      <span className="box-s">–</span>
                    )}
                  </Td>
                  <Td r>{num(s.errors24h)}</Td>
                </tr>
              ))}
            </Table>
          </section>

          <div className="cols-2 sec">
            {down.map((d) =>
              data.errorGroups[d.id]?.length ? (
                <section className="box" aria-labelledby={`er-${d.id}`} key={d.id}>
                  <div className="box-h">
                    <h2 id={`er-${d.id}`} className="box-t">
                      {d.name} · recent errors
                    </h2>
                    <span className="box-s">grouped, last hour</span>
                  </div>
                  <ul className="errl">
                    {data.errorGroups[d.id]!.map((e) => (
                      <li key={e.message + e.route}>
                        <b>{e.message}</b>
                        <b className="num">{num(e.count)}</b>
                        <span className="s mono-t">{e.route}</span>
                        <span className="s">last {time(e.lastAt)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null,
            )}
            <section className="box" aria-labelledby="in-h">
              <div className="box-h">
                <h2 id="in-h" className="box-t">
                  Incidents
                </h2>
                <button className="btn btn-line btn-s" type="button" disabled={!can("incidents", "edit")} onClick={() => setOpening(true)}>
                  <Ic name="plus" small />
                  Open an incident
                </button>
              </div>
              {data.open.length || data.recent.length ? (
                <ul>
                  {data.open.map((i) => (
                    <li className="inc" key={i.id}>
                      <span className="cx err">
                        <Ic name="alert" />
                        Open
                      </span>
                      <Link className="rowlink" href={`/status/${i.id}`} style={{ fontWeight: 700, textDecoration: "none" }}>
                        {i.code} · {i.title}
                      </Link>
                      <span className="box-s">{duration(t - i.startedAt)}</span>
                      <span className="s">
                        Started {time(i.startedAt)}
                        {involved(i, i.id === first?.id ? firstDetail : null)}
                      </span>
                    </li>
                  ))}
                  {data.recent.map((i) => (
                    <li className="inc" key={i.id}>
                      <span className="cx ok">
                        <Ic name="check" />
                        Resolved
                      </span>
                      <Link className="rowlink" href={`/status/${i.id}`} style={{ fontWeight: 700, textDecoration: "none" }}>
                        {i.code} · {i.title}
                      </Link>
                      <span className="box-s">{i.resolvedAt ? duration(i.resolvedAt - i.startedAt) : ""}</span>
                      <span className="s">{dayTime(i.startedAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="box-s">No incidents in the last 90 days.</p>
              )}
            </section>
          </div>
        </>
      )}
      {opening && data ? <OpenIncidentDialog services={data.services} onClose={() => setOpening(false)} /> : null}
    </>
  );
}
