"use client";

import Link from "next/link";
import { use, useState } from "react";
import { BWD_ROLE, wallTime } from "@/components/console/bwdportal";
import { Gate, useBusy, useConsole } from "@/components/console/Shell";
import { useAct } from "@/components/console/useAct";
import { Dialog, ErrorCard, Ic, ReadOnlyNote, Sk } from "@/components/console/ui";
import { initials } from "@/lib/fmt";
import { useOrg } from "@/lib/org";
import type { BwdAssignment, BwdClass, BwdPerson, BwdRole, BwdSubject } from "@/lib/org-contract";

type Sheet = "role" | "class" | null;

function RoleSheet({ p, close }: { p: BwdPerson; close: () => void }) {
  const { run, busy, error } = useAct();
  const next: BwdRole = p.role === "teacher" ? "student" : "teacher";
  return (
    <Dialog
      title={next === "teacher" ? `Make ${p.name} a teacher?` : `Make ${p.name} a student?`}
      onClose={close}
      actions={
        <>
          <button className="btn btn-line" type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn-ink"
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await run(`/console/bwdportal/people/${encodeURIComponent(p.id)}`, { role: next }, `${p.name} is now a ${next}`)) close();
            }}
          >
            {next === "teacher" ? "Make teacher" : "Make student"}
          </button>
        </>
      }
    >
      <p className="box-s">
        {next === "teacher"
          ? "They leave their class and see the teacher view at their next page load. Assign classes and subjects afterwards."
          : "Their class assignments and any class teacher role are removed. Pick their class afterwards."}
      </p>
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

function ClassSheet({ p, classes, close }: { p: BwdPerson; classes: BwdClass[]; close: () => void }) {
  const { run, busy, error } = useAct();
  const [code, setCode] = useState(p.classCode ?? "");
  return (
    <Dialog
      title={`Class of ${p.name}`}
      onClose={close}
      actions={
        <>
          <button className="btn btn-line" type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn-ink"
            type="button"
            disabled={busy || code === (p.classCode ?? "")}
            onClick={async () => {
              if (await run(`/console/bwdportal/people/${encodeURIComponent(p.id)}`, { classCode: code || null }, code ? `${p.name} moved to ${code}` : `${p.name} has no class now`)) close();
            }}
          >
            Save
          </button>
        </>
      }
    >
      <div className="f">
        <label className="f-l" htmlFor="bw-class">
          Class
        </label>
        <select id="bw-class" className="sel" value={code} onChange={(e) => setCode(e.target.value)}>
          <option value="">No class</option>
          {classes.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
              {c.program ? ` · ${c.program}` : ""}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

/** A teacher's classes and subjects, edited as a list and saved as a whole. */
function Assignments({ p, classes, subjects, edit }: { p: BwdPerson; classes: BwdClass[]; subjects: BwdSubject[]; edit: boolean }) {
  const { run, busy, error, setError, toast } = useAct();
  const [rows, setRows] = useState<BwdAssignment[] | null>(null);
  const list = rows ?? p.assignments;
  const dirty = rows !== null;
  const name = (code: string) => subjects.find((s) => s.code === code)?.name ?? code;
  const set = (i: number, a: Partial<BwdAssignment>) => setRows(list.map((r, j) => (j === i ? { ...r, ...a } : r)));

  async function save() {
    const clean = list.filter((a) => a.classCode && a.subject);
    const seen = new Set(clean.map((a) => `${a.classCode}|${a.subject}`));
    if (seen.size !== clean.length) return setError("Each class and subject only once.");
    if (await run(`/console/bwdportal/people/${encodeURIComponent(p.id)}/assignments`, { assignments: clean }, `Saved what ${p.name} teaches`)) setRows(null);
  }

  return (
    <section className="box" aria-labelledby="as-h">
      <div className="box-h">
        <h2 id="as-h" className="box-t">
          Teaches
        </h2>
        {edit ? (
          <button className="btn btn-line btn-s" type="button" onClick={() => setRows([...list, { classCode: classes[0]?.code ?? "", subject: subjects[0]?.code ?? "" }])}>
            <Ic name="plus" small />
            Add
          </button>
        ) : null}
      </div>
      {!list.length ? <p className="box-s">Nothing assigned. They only see classes and subjects assigned here.</p> : null}
      {edit ? (
        <div style={{ display: "grid", gap: 8 }}>
          {list.map((a, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr) auto", gap: 8, alignItems: "center" }}>
              <select className="sel" aria-label={`Class ${i + 1}`} value={a.classCode} onChange={(e) => set(i, { classCode: e.target.value })}>
                {classes.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
              <select className="sel" aria-label={`Subject ${i + 1}`} value={a.subject} onChange={(e) => set(i, { subject: e.target.value })}>
                {subjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              <button className="ib" type="button" aria-label={`Remove ${name(a.subject)} in ${a.classCode}`} onClick={() => setRows(list.filter((_, j) => j !== i))}>
                <Ic name="trash" small />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <ul className="box-s" style={{ margin: 0, paddingLeft: 18 }}>
          {list.map((a) => (
            <li key={`${a.classCode}|${a.subject}`}>
              {name(a.subject)} in {a.classCode}
            </li>
          ))}
        </ul>
      )}
      {edit && dirty ? (
        <div className="pp-acts">
          <button className="btn btn-ink btn-s" type="button" disabled={busy} onClick={() => void save()}>
            Save
          </button>
          <button className="btn btn-line btn-s" type="button" onClick={() => (setRows(null), setError(null))}>
            Discard
          </button>
        </div>
      ) : null}
      {error ? <p className="f-err">{error}</p> : null}
      {toast}
    </section>
  );
}

function Person({ id }: { id: string }) {
  const { can } = useConsole();
  const { data: p, error, loading, reload } = useOrg<BwdPerson>(`/console/bwdportal/people/${encodeURIComponent(id)}`);
  const classes = useOrg<{ classes: BwdClass[] }>("/console/bwdportal/classes");
  const subjects = useOrg<{ subjects: BwdSubject[] }>("/console/bwdportal/subjects");
  const [sheet, setSheet] = useState<Sheet>(null);
  useBusy(loading);
  const edit = can("bwdportal", "edit");
  const close = () => setSheet(null);

  const crumb = (name: string) => (
    <p className="crumb">
      <Link className="ul" href="/bwdportal">
        bwd Portal
      </Link>
      <Ic name="chev-r" small />
      {name}
    </p>
  );

  if (error && !p) {
    return (
      <>
        {crumb("Person")}
        <ErrorCard title={error.status === 404 ? "No bwd Portal account with that id" : "This person didn’t load"} error={error} onRetry={reload} />
      </>
    );
  }
  if (!p) {
    return (
      <>
        {crumb("Person")}
        <Sk h={72} />
        <div className="cols sec">
          <Sk h={260} />
          <Sk h={260} />
        </div>
      </>
    );
  }

  const cls = classes.data?.classes ?? [];
  return (
    <>
      {crumb(p.name || p.email)}
      <div className="cust-h">
        <span className="av av-l" style={{ width: 56, height: 56, fontSize: 18 }} aria-hidden="true">
          {initials(p.name || p.email)}
        </span>
        <div className="grow">
          <h1>{p.name || p.email}</h1>
          <p>{p.email}</p>
        </div>
      </div>
      {!edit ? (
        <div className="sec">
          <ReadOnlyNote>Your role can see this account but not change it.</ReadOnlyNote>
        </div>
      ) : null}
      <div className="cols sec">
        <section className="box" aria-labelledby="ac-h">
          <div className="box-h">
            <h2 id="ac-h" className="box-t">
              bwd Portal account
            </h2>
          </div>
          <dl className="kv">
            <dt>Role</dt>
            <dd>{BWD_ROLE[p.role]}</dd>
            {p.role === "student" ? (
              <>
                <dt>Class</dt>
                <dd>{p.classCode ?? "No class"}</dd>
              </>
            ) : (
              <>
                <dt>Class teacher of</dt>
                <dd>{p.classTeacherOf.join(", ") || "–"}</dd>
              </>
            )}
            <dt>Last active</dt>
            <dd>{wallTime(p.lastLoginAt)}</dd>
          </dl>
          {edit ? (
            <div className="pp-acts">
              <button className="btn btn-ink btn-s" type="button" onClick={() => setSheet("role")}>
                <Ic name="key" small />
                {p.role === "teacher" ? "Make student…" : "Make teacher…"}
              </button>
              {p.role === "student" ? (
                <button className="btn btn-line btn-s" type="button" disabled={!classes.data} onClick={() => setSheet("class")}>
                  <Ic name="users" small />
                  Change class…
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
        {p.role === "teacher" ? (
          classes.data && subjects.data ? (
            <Assignments key={JSON.stringify(p.assignments)} p={p} classes={cls} subjects={subjects.data.subjects} edit={edit} />
          ) : classes.error || subjects.error ? (
            <ErrorCard title="Classes and subjects didn’t load" error={(classes.error ?? subjects.error)!} onRetry={() => (classes.reload(), subjects.reload())} />
          ) : (
            <Sk h={260} />
          )
        ) : null}
      </div>
      {sheet === "role" ? <RoleSheet p={p} close={close} /> : null}
      {sheet === "class" ? <ClassSheet p={p} classes={cls} close={close} /> : null}
    </>
  );
}

export default function BwdPersonPage({ params }: PageProps<"/bwdportal/people/[id]">) {
  const { id } = use(params);
  return (
    <Gate areas={["bwdportal"]}>
      <Person id={id} />
    </Gate>
  );
}
