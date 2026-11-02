"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Gate, useBusy, useConsole } from "@/components/console/Shell";
import { PersonStatusChip, SIGN_IN } from "@/components/console/person";
import { useAct } from "@/components/console/useAct";
import { Dialog, ErrorCard, Ic, ReadOnlyNote, Sk } from "@/components/console/ui";
import { bytes, date, dayTime, initials, lastSeen } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { PersonChange, PersonDetail, PersonRow, VaultPerson } from "@/lib/org-contract";

const DAY = 86_400_000;
const GB = 1024 ** 3;
const PLAN: Record<VaultPerson["plan"], string> = { free: "Vault Free", plus: "Vault Plus", pro: "Vault Pro" };

type Sheet = "suspend" | "vault" | "ban" | "signout" | null;

/** A checkbox in the Console's style. */
function Check({ on, set, children }: { on: boolean; set: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="chk" style={{ cursor: "pointer" }}>
      <input type="checkbox" className="sr" checked={on} onChange={(e) => set(e.target.checked)} />
      <i className={on ? "on" : undefined} aria-hidden="true">
        {on ? <Ic name="check" small /> : null}
      </i>
      <span>{children}</span>
    </label>
  );
}

function Reason({ id, value, set, hint }: { id: string; value: string; set: (v: string) => void; hint: string }) {
  return (
    <div className="f">
      <label className="f-l" htmlFor={id}>
        Reason
      </label>
      <textarea id={id} className="ta" maxLength={300} value={value} onChange={(e) => set(e.target.value)} style={{ minHeight: 80 }} />
      <span className="f-h">{hint}</span>
    </div>
  );
}

function AccountBox({ p, edit, open }: { p: PersonRow; edit: boolean; open: (s: Sheet) => void }) {
  const { run, busy, error, toast } = useAct();
  return (
    <section className="box" aria-labelledby="ac-h">
      <div className="box-h">
        <h2 id="ac-h" className="box-t">
          Planary account
        </h2>
      </div>
      {p.status === "suspended" && p.suspension ? (
        <p className="pp-note warn">
          <b>Suspended {p.suspension.until ? `until ${date(p.suspension.until)}` : "until lifted"}</b> since {date(p.suspension.since)}. Reason: {p.suspension.reason}
        </p>
      ) : null}
      {p.status === "banned" ? (
        <p className="pp-note err">
          <b>Banned for good</b> on {date(p.bannedAt)}. They can’t sign in anywhere and their Vault was deleted.
        </p>
      ) : null}
      <dl className="kv">
        <dt>Email</dt>
        <dd>
          {p.email} {p.verified ? null : <span className="box-s">· not confirmed</span>}
        </dd>
        <dt>Signs in with</dt>
        <dd>{p.signIn.map((s) => SIGN_IN[s] ?? s).join(", ") || "–"}</dd>
        <dt>Joined</dt>
        <dd>{date(p.createdAt)}</dd>
        <dt>Last seen</dt>
        <dd>{lastSeen(p.lastSeen, now())}</dd>
      </dl>
      {edit && p.status !== "banned" ? (
        <div className="pp-acts">
          {p.status === "suspended" ? (
            <button
              className="btn btn-ink btn-s"
              type="button"
              disabled={busy}
              onClick={() => void run<PersonChange>(`/console/people/${p.id}/unsuspend`, { notify: true }, `${p.name || p.email} can sign in again`)}
            >
              Lift suspension
            </button>
          ) : (
            <button className="btn btn-ink btn-s" type="button" onClick={() => open("suspend")}>
              <Ic name="clock" small />
              Suspend…
            </button>
          )}
          <button className="btn btn-line btn-s" type="button" onClick={() => open("signout")}>
            <Ic name="logout" small />
            Sign out everywhere
          </button>
        </div>
      ) : null}
      {error ? <p className="f-err">{error}</p> : null}
      {toast}
    </section>
  );
}

function VaultBox({ v, edit, open }: { v: PersonDetail["vault"]; edit: boolean; open: (s: Sheet) => void }) {
  return (
    <section className="box" aria-labelledby="va-h">
      <div className="box-h">
        <h2 id="va-h" className="box-t">
          Planary Vault
        </h2>
        {v && v !== "not_connected" && edit ? (
          <button className="btn btn-line btn-s" type="button" onClick={() => open("vault")}>
            <Ic name="lock" small />
            Restrict…
          </button>
        ) : null}
      </div>
      {v === "not_connected" ? (
        <p className="box-s">Planary Vault didn’t answer. Restrictions can’t be changed right now.</p>
      ) : !v ? (
        <p className="box-s">No vault. Nothing to restrict.</p>
      ) : (
        <>
          <span style={{ display: "grid", gap: 6 }} title={`${bytes(v.used)} of ${bytes(v.quota)}`}>
            <span className={`mtr${v.quota && v.used / v.quota >= 0.8 ? " warn" : ""}`} aria-hidden="true">
              <i style={{ width: `${Math.min(100, v.quota ? (v.used / v.quota) * 100 : 0)}%` }} />
            </span>
            <span className="box-s num">
              {bytes(v.used)} of {bytes(v.quota)}
              {v.restrictions.quota !== null ? " (own limit)" : ""} · {v.files} files · {PLAN[v.plan]}
            </span>
          </span>
          <ul className="pp-flags">
            <li className={v.restrictions.uploads ? "" : "off"}>
              <Ic name={v.restrictions.uploads ? "check" : "x"} small />
              Uploads {v.restrictions.uploads ? "allowed" : "off"}
            </li>
            <li className={v.restrictions.sharing ? "" : "off"}>
              <Ic name={v.restrictions.sharing ? "check" : "x"} small />
              Sharing {v.restrictions.sharing ? "allowed" : "off"}
            </li>
            <li className={v.restrictions.quota === null ? "" : "off"}>
              <Ic name={v.restrictions.quota === null ? "check" : "alert"} small />
              {v.restrictions.quota === null ? "Storage follows the plan" : `Own limit: ${bytes(v.restrictions.quota)}`}
            </li>
          </ul>
          {v.restrictions.reason ? <p className="box-s">Reason: {v.restrictions.reason}</p> : null}
          <p className="box-s" style={{ marginTop: 8 }}>
            Staff can’t see file names or contents.
          </p>
        </>
      )}
    </section>
  );
}

function History({ h }: { h: PersonDetail["history"] }) {
  return (
    <section className="box" aria-labelledby="hi-h">
      <div className="box-h">
        <h2 id="hi-h" className="box-t">
          History
        </h2>
        <span className="box-s">from the audit log</span>
      </div>
      {!h.length ? (
        <p className="box-s">Nothing changed by staff yet.</p>
      ) : (
        <ol className="pp-hist">
          {h.map((e) => (
            <li key={e.id}>
              <b>{e.sentence}</b>
              {e.details ? <span>{e.details}</span> : null}
              <span className="box-s">
                {e.actor?.name ?? "Planary"} · {dayTime(e.at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function SuspendSheet({ p, close }: { p: PersonRow; close: () => void }) {
  const { run, busy, error } = useAct();
  const [length, setLength] = useState<"1" | "7" | "30" | "date" | "lifted">("7");
  const [day, setDay] = useState(() => new Date(now() + 14 * DAY).toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const until = length === "lifted" ? null : length === "date" ? new Date(`${day}T23:59:59`).getTime() : now() + Number(length) * DAY;
  const ok = reason.trim().length >= 3 && (until === null || until > now());
  return (
    <Dialog
      title={`Suspend ${p.name || p.email}`}
      onClose={close}
      actions={
        <>
          <button className="btn btn-line btn-s" type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn-ink btn-s"
            type="button"
            disabled={busy || !ok}
            onClick={async () => {
              if (await run<PersonChange>(`/console/people/${p.id}/suspend`, { until, reason: reason.trim(), notify }, `${p.name || p.email} is suspended`)) close();
            }}
          >
            Suspend
          </button>
        </>
      }
    >
      <div className="f">
        <label className="f-l" htmlFor="su-l">
          How long
        </label>
        <select id="su-l" className="sel" value={length} onChange={(e) => setLength(e.target.value as typeof length)}>
          <option value="1">1 day</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="date">Until a date…</option>
          <option value="lifted">Until lifted by staff</option>
        </select>
      </div>
      {length === "date" ? (
        <div className="f">
          <label className="f-l" htmlFor="su-d">
            Last day
          </label>
          <input id="su-d" className="inp" type="date" value={day} min={new Date(now() + DAY).toISOString().slice(0, 10)} onChange={(e) => setDay(e.target.value)} />
        </div>
      ) : null}
      <Reason id="su-r" value={reason} set={setReason} hint="They see it when they try to sign in, and in the mail." />
      <Check on={notify} set={setNotify}>
        Mail {p.email} that their account is suspended, until when and why
      </Check>
      <p className="box-s">They’re signed out on every device and can’t sign in to any Planary app until then. Nothing is deleted.</p>
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

function VaultSheet({ p, v, close }: { p: PersonRow; v: VaultPerson; close: () => void }) {
  const { run, busy, error } = useAct();
  const r = v.restrictions;
  const [uploads, setUploads] = useState(r.uploads);
  const [sharing, setSharing] = useState(r.sharing);
  const [own, setOwn] = useState(r.quota !== null);
  const [gb, setGb] = useState(r.quota !== null ? String(Math.round((r.quota / GB) * 10) / 10) : "");
  const [reason, setReason] = useState(r.reason ?? "");
  const [notify, setNotify] = useState(true);
  const quota = own ? Math.round(Number(gb) * GB) : null;
  const any = !uploads || !sharing || quota !== null;
  const ok = (!own || (gb !== "" && Number(gb) >= 0)) && (!any || reason.trim().length >= 3);
  return (
    <Dialog
      title={`Restrict ${p.name || p.email}’s vault`}
      onClose={close}
      actions={
        <>
          <button className="btn btn-line btn-s" type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn-ink btn-s"
            type="button"
            disabled={busy || !ok}
            onClick={async () => {
              if (await run<PersonChange>(`/console/people/${p.id}/vault`, { uploads, sharing, quota, reason: reason.trim(), notify }, any ? "Vault restricted" : "Vault restrictions lifted")) close();
            }}
          >
            {any ? "Save restrictions" : "Lift restrictions"}
          </button>
        </>
      }
    >
      <div className="f" style={{ gap: 12 }}>
        <Check on={!uploads} set={(x) => setUploads(!x)}>
          Turn uploads off <span className="box-s">· new files and new versions</span>
        </Check>
        <Check on={!sharing} set={(x) => setSharing(!x)}>
          Turn sharing off <span className="box-s">· new links and new shares; existing ones keep working</span>
        </Check>
        <Check on={own} set={setOwn}>
          Own storage limit <span className="box-s">· instead of {PLAN[v.plan]}’s</span>
        </Check>
        {own ? (
          <div className="f">
            <label className="f-l" htmlFor="vr-q">
              Limit in GB
            </label>
            <input id="vr-q" className="inp" type="number" min={0} step={0.5} value={gb} onChange={(e) => setGb(e.target.value)} />
            <span className="f-h">They use {bytes(v.used)} now. Below that, their files stay but new uploads stop.</span>
          </div>
        ) : null}
      </div>
      {any ? <Reason id="vr-r" value={reason} set={setReason} hint="Shown in their vault and in the mail." /> : null}
      <Check on={notify} set={setNotify}>
        Mail {p.email} about the change
      </Check>
      <p className="box-s">Their files always stay readable and downloadable.</p>
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

function SignOutSheet({ p, close }: { p: PersonRow; close: () => void }) {
  const { run, busy, error } = useAct();
  return (
    <Dialog
      title="Sign out everywhere"
      onClose={close}
      actions={
        <>
          <button className="btn btn-line btn-s" type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn-ink btn-s"
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await run<PersonChange>(`/console/people/${p.id}/sign-out`, {}, `${p.name || p.email} is signed out everywhere`)) close();
            }}
          >
            Sign out
          </button>
        </>
      }
    >
      <p className="box-s">
        Ends every session of {p.email} on every device and app. They can sign in again right away. Use it after a lost phone or a password leak.
      </p>
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

function BanSheet({ p, close }: { p: PersonRow; close: () => void }) {
  const { run, busy, error } = useAct();
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [notify, setNotify] = useState(true);
  const ok = reason.trim().length >= 3 && typed.trim().toLowerCase() === p.email.toLowerCase();
  return (
    <Dialog
      title="Ban for good"
      onClose={close}
      actions={
        <>
          <button className="btn btn-line btn-s" type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn-danger btn-s"
            type="button"
            disabled={busy || !ok}
            onClick={async () => {
              const res = await run<PersonChange & { vaultDeleted?: string }>(`/console/people/${p.id}/ban`, { reason: reason.trim(), email: typed.trim(), notify }, `${p.name || p.email} is banned`);
              if (res) close();
            }}
          >
            Ban and delete their Vault
          </button>
        </>
      }
    >
      <p className="pp-note err">
        This can’t be undone. {p.email} can never sign in to any Planary app again, the address can’t sign up again, and their Planary Vault is deleted for good.
        For anything temporary, suspend instead.
      </p>
      <Reason id="bn-r" value={reason} set={setReason} hint="Kept in the audit log, and in the mail if you send it." />
      <div className="f">
        <label className="f-l" htmlFor="bn-e">
          Type {p.email} to confirm
        </label>
        <input id="bn-e" className="inp" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </div>
      <Check on={notify} set={setNotify}>
        Mail {p.email} that their account is closed and why
      </Check>
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

function Person({ id }: { id: string }) {
  const { can } = useConsole();
  const { data, error, loading, reload } = useOrg<PersonDetail>(`/console/people/${id}`);
  const [sheet, setSheet] = useState<Sheet>(null);
  useBusy(loading);
  const edit = can("people", "edit");
  const close = () => setSheet(null);

  const crumb = (name: string) => (
    <p className="crumb">
      <Link className="ul" href="/people">
        People
      </Link>
      <Ic name="chev-r" small />
      {name}
    </p>
  );

  if (error && !data) {
    return (
      <>
        {crumb("Person")}
        <ErrorCard title={error.status === 404 ? "No Planary account with that id" : "This person didn’t load"} error={error} onRetry={reload} />
      </>
    );
  }
  if (!data) {
    return (
      <>
        {crumb("Person")}
        <Sk h={72} />
        <div className="cols sec">
          <Sk h={320} />
          <Sk h={320} />
        </div>
      </>
    );
  }

  const p = data.person;
  return (
    <>
      {crumb(p.name || p.email)}
      <div className="cust-h">
        <span className="av av-l" style={{ width: 56, height: 56, fontSize: 18 }} aria-hidden="true">
          {initials(p.name || p.email)}
        </span>
        <div className="grow">
          <h1>{p.name || p.email}</h1>
          <p>
            {p.email} <PersonStatusChip p={p} />
          </p>
        </div>
      </div>
      {!edit ? (
        <div className="sec">
          <ReadOnlyNote>Your role can see this person but not suspend or restrict them.</ReadOnlyNote>
        </div>
      ) : null}
      <div className="cols sec">
        <div style={{ display: "grid", gap: 16 }}>
          <AccountBox p={p} edit={edit} open={setSheet} />
          <VaultBox v={data.vault} edit={edit && p.status !== "banned"} open={setSheet} />
          {can("people_ban", "edit") && p.status !== "banned" ? (
            <section className="box pp-danger" aria-labelledby="dz-h">
              <div className="box-h">
                <h2 id="dz-h" className="box-t">
                  Permanent ban
                </h2>
                <button className="btn btn-danger btn-s" type="button" onClick={() => setSheet("ban")}>
                  Ban for good…
                </button>
              </div>
              <p className="box-s">Closes the account on every Planary app and deletes their Vault. Owners only; it can’t be undone.</p>
            </section>
          ) : null}
        </div>
        <History h={data.history} />
      </div>
      {sheet === "suspend" ? <SuspendSheet p={p} close={close} /> : null}
      {sheet === "signout" ? <SignOutSheet p={p} close={close} /> : null}
      {sheet === "ban" ? <BanSheet p={p} close={close} /> : null}
      {sheet === "vault" && data.vault && data.vault !== "not_connected" ? <VaultSheet p={p} v={data.vault} close={close} /> : null}
    </>
  );
}

export default function PersonPage({ params }: PageProps<"/people/[id]">) {
  const { id } = use(params);
  return (
    <Gate areas={["people"]}>
      <Person id={id} />
    </Gate>
  );
}
