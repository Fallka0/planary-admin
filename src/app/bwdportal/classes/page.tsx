"use client";

import { useState } from "react";
import { BwdTabs } from "@/components/console/bwdportal";
import { Gate, useBusy, useConsole } from "@/components/console/Shell";
import { useAct } from "@/components/console/useAct";
import { Dialog, ErrorCard, Ic, PageHead, Sk, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import { useOrg } from "@/lib/org";
import type { BwdClass, BwdPerson } from "@/lib/org-contract";

const CODE = /^[A-Za-z]{1,6}\d{2}[a-z]?$/;

function NewClassSheet({ close }: { close: () => void }) {
  const { run, busy, error, setError } = useAct();
  const [code, setCode] = useState("");
  const [program, setProgram] = useState("");
  return (
    <Dialog
      title="New class"
      onClose={close}
      actions={
        <>
          <button className="btn btn-line" type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn-ink"
            type="button"
            disabled={busy || !code.trim()}
            onClick={async () => {
              const c = code.trim();
              if (!CODE.test(c)) return setError("Use a code like IM25a: letters, the start year in two digits, maybe a letter.");
              if (await run("/console/bwdportal/classes", { code: c, program: program.trim() || null }, `Created ${c}`)) close();
            }}
          >
            Create class
          </button>
        </>
      }
    >
      <div className="f">
        <label className="f-l" htmlFor="nc-code">
          Code
        </label>
        <input id="nc-code" className="inp" maxLength={12} placeholder="IM25a" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      <div className="f">
        <label className="f-l" htmlFor="nc-prog">
          Program
        </label>
        <input id="nc-prog" className="inp" maxLength={120} placeholder="Informatikmittelschule" value={program} onChange={(e) => setProgram(e.target.value)} />
      </div>
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

function EditClassSheet({ c, teachers, close }: { c: BwdClass; teachers: BwdPerson[]; close: () => void }) {
  const { run, busy, error } = useAct();
  const [program, setProgram] = useState(c.program ?? "");
  const [kt, setKt] = useState(c.classTeacher?.id ?? "");
  const changed = (program.trim() || null) !== c.program || (kt || null) !== (c.classTeacher?.id ?? null);
  return (
    <Dialog
      title={c.code}
      onClose={close}
      actions={
        <>
          <button className="btn btn-line" type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn-ink"
            type="button"
            disabled={busy || !changed}
            onClick={async () => {
              const body: { program?: string | null; classTeacherId?: string | null } = {};
              if ((program.trim() || null) !== c.program) body.program = program.trim() || null;
              if ((kt || null) !== (c.classTeacher?.id ?? null)) body.classTeacherId = kt || null;
              if (await run(`/console/bwdportal/classes/${encodeURIComponent(c.code)}`, body, `Saved ${c.code}`)) close();
            }}
          >
            Save
          </button>
        </>
      }
    >
      <div className="f">
        <label className="f-l" htmlFor="ec-prog">
          Program
        </label>
        <input id="ec-prog" className="inp" maxLength={120} value={program} onChange={(e) => setProgram(e.target.value)} />
      </div>
      <div className="f">
        <label className="f-l" htmlFor="ec-kt">
          Class teacher
        </label>
        <select id="ec-kt" className="sel" value={kt} onChange={(e) => setKt(e.target.value)}>
          <option value="">None</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name || t.email}
            </option>
          ))}
        </select>
        <span className="f-h">The class teacher also sees the absences of the whole class.</span>
      </div>
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

function Classes() {
  const { can } = useConsole();
  const { data, error, loading, reload } = useOrg<{ classes: BwdClass[] }>("/console/bwdportal/classes");
  const teachers = useOrg<{ people: BwdPerson[] }>("/console/bwdportal/people?role=teacher");
  const [sheet, setSheet] = useState<BwdClass | "new" | null>(null);
  useBusy(loading);
  const edit = can("bwdportal", "edit");
  const close = () => setSheet(null);

  return (
    <>
      <PageHead title={CONSOLE.pages.bwdportal.title}>
        {edit ? (
          <button className="btn btn-ink btn-s" type="button" onClick={() => setSheet("new")}>
            <Ic name="plus" small />
            New class
          </button>
        ) : null}
      </PageHead>
      <BwdTabs on="classes" />
      {error && !data ? (
        <ErrorCard title={error.code === "not_connected" ? "The bwd Portal isn’t connected yet" : "Classes didn’t load"} error={error} onRetry={reload} />
      ) : (
        <section className="box">
          {!data ? (
            <Sk h={320} r={12} />
          ) : (
            <Table
              cols={`120px minmax(0,1.6fr) minmax(0,1.4fr) 90px 90px${edit ? " 96px" : ""}`}
              colsS={`minmax(0,1fr) minmax(0,1fr)${edit ? " auto" : ""}`}
              head={[{ h: "Class" }, { h: "Program", hide: true }, { h: "Class teacher" }, { h: "Students", r: true, hide: true }, { h: "Teachers", r: true, hide: true }, ...(edit ? [{ h: "", r: true }] : [])]}
            >
              {data.classes.map((c) => (
                <tr className="dt-r" key={c.code}>
                  <Td>
                    <b>{c.code}</b>
                  </Td>
                  <Td hide>
                    <span className="box-s">{c.program ?? "–"}</span>
                  </Td>
                  <Td>{c.classTeacher ? c.classTeacher.name : <span className="box-s">None</span>}</Td>
                  <Td r hide>
                    <span className="num">{c.students}</span>
                  </Td>
                  <Td r hide>
                    <span className="num">{c.teachers}</span>
                  </Td>
                  {edit ? (
                    <Td r>
                      <button className="btn btn-line btn-s" type="button" disabled={!teachers.data} aria-label={`Edit ${c.code}`} onClick={() => setSheet(c)}>
                        <Ic name="edit" small />
                        Edit
                      </button>
                    </Td>
                  ) : null}
                </tr>
              ))}
            </Table>
          )}
          {data && !data.classes.length ? <p className="box-s" style={{ marginTop: 12 }}>No classes yet.</p> : null}
        </section>
      )}
      {sheet === "new" ? <NewClassSheet close={close} /> : null}
      {sheet && sheet !== "new" && teachers.data ? <EditClassSheet c={sheet} teachers={teachers.data.people} close={close} /> : null}
    </>
  );
}

export default function BwdClassesPage() {
  return (
    <Gate areas={["bwdportal"]}>
      <Classes />
    </Gate>
  );
}
