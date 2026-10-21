"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Gate, useBusy, useConsole } from "@/components/console/Shell";
import { useAct } from "@/components/console/useAct";
import { Dialog, ErrorCard, Ic, PageHead, Sk, Table, Td } from "@/components/console/ui";
import { CONSOLE } from "@/design/console-copy";
import type { IconName } from "@/design/icons";
import { ApiError, adminCall } from "@/lib/api";
import { ago, initials, ROLE_NAME } from "@/lib/fmt";
import { FIXTURES, now, useOrg } from "@/lib/org";
import type { StaffRole, StaffRow } from "@/lib/org-contract";

const ROLES: StaffRole[] = ["owner", "manager", "support", "viewer"];
const CAP: Record<string, { icon: IconName; cls: string; text: string }> = {
  Edit: { icon: "check", cls: "", text: "Edit" },
  Read: { icon: "eye", cls: "", text: "Read" },
  No: { icon: "x", cls: "no", text: "No access" },
};

/**
 * The Casino keeps its own staff list for its /admin routes. Mirror the role there so one
 * screen manages one role per person. Answers a sentence when the Casino couldn't take it.
 */
async function mirrorToCasino(token: string, userId: string, role: StaffRole | null): Promise<string | null> {
  if (FIXTURES) return null;
  try {
    if (role) await adminCall(token, "/staff", { userId, role });
    else await adminCall(token, `/staff/${userId}/remove`, {});
    return null;
  } catch (e) {
    if (!role && e instanceof ApiError && e.status === 404) return null; // wasn't Casino staff
    if (e instanceof ApiError && e.status === 404) return "The Casino role wasn’t set: they need to open the casino once first.";
    return `The Casino didn’t take the change: ${e instanceof Error ? e.message : "unknown error"}`;
  }
}

function AddDialog({ onClose }: { onClose: () => void }) {
  const { run, busy, error } = useAct();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("support");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <Dialog
      title="Add staff"
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-line btn-s" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-ink btn-s"
            type="button"
            disabled={!valid || busy}
            onClick={async () => {
              if (await run("/console/staff", { email: email.trim().toLowerCase(), role }, `${email.trim()} added as ${ROLE_NAME[role]}`)) onClose();
            }}
          >
            Add
          </button>
        </>
      }
    >
      <div className="f">
        <label className="f-l" htmlFor="as-e">
          Planary account email
        </label>
        <input id="as-e" className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        <span className="f-h">They get access the next time they sign in to the Console with this account.</span>
      </div>
      <div className="f">
        <label className="f-l" htmlFor="as-r">
          Role
        </label>
        <select id="as-r" className="sel" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_NAME[r]}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

function RoleDialog({ person, onClose, notify }: { person: StaffRow; onClose: () => void; notify: (t: string, tone?: "err") => void }) {
  const { accessToken } = useAuth();
  const { me } = useConsole();
  const { run, busy, error } = useAct();
  const [role, setRole] = useState<StaffRole>(person.role);
  const [removing, setRemoving] = useState(false);
  const self = person.id === me.id;
  return (
    <Dialog
      title={removing ? `Remove ${person.name}?` : `Role of ${person.name}`}
      onClose={onClose}
      actions={
        removing ? (
          <>
            <button className="btn btn-line btn-s" type="button" onClick={() => setRemoving(false)}>
              Keep
            </button>
            <button
              className="btn btn-danger btn-s"
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!(await run(`/console/staff/${person.id}/remove`, {}, `${person.name} removed`))) return;
                const casino = await mirrorToCasino(accessToken, person.id, null);
                if (casino) notify(casino, "err");
                onClose();
              }}
            >
              Remove from staff
            </button>
          </>
        ) : (
          <>
            {!self ? (
              <button className="btn btn-ghost btn-s" type="button" style={{ marginRight: "auto" }} onClick={() => setRemoving(true)}>
                Remove from staff
              </button>
            ) : null}
            <button className="btn btn-line btn-s" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-ink btn-s"
              type="button"
              disabled={busy || role === person.role}
              onClick={async () => {
                if (!(await run(`/console/staff/${person.id}`, { role }, `${person.name} is now ${ROLE_NAME[role]}`))) return;
                const casino = await mirrorToCasino(accessToken, person.id, role);
                if (casino) notify(casino, "err");
                onClose();
              }}
            >
              Save
            </button>
          </>
        )
      }
    >
      {removing ? (
        <p>They lose access to the Console and the Casino admin. Their entries in the audit log stay.</p>
      ) : (
        <div className="f">
          <label className="f-l" htmlFor="rd-r">
            Role
          </label>
          <select id="rd-r" className="sel" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_NAME[r]}
              </option>
            ))}
          </select>
          <span className="f-h">The table below says what each role can do. The Casino gets the same role.</span>
        </div>
      )}
      {error ? <p className="f-err">{error}</p> : null}
    </Dialog>
  );
}

function StaffPageInner() {
  const { can } = useConsole();
  const { data, error, loading, reload } = useOrg<{ staff: StaffRow[] }>("/console/staff");
  const { toast, notify } = useAct();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  useBusy(loading);
  const edit = can("staff", "edit");
  const t = now();

  return (
    <>
      <PageHead title={CONSOLE.pages.staff.title}>
        {edit ? (
          <button className="btn btn-ink btn-s" type="button" onClick={() => setAdding(true)}>
            <Ic name="plus" small />
            Add staff
          </button>
        ) : null}
      </PageHead>
      {error && !data ? (
        <ErrorCard title="Staff didn’t load" error={error} onRetry={reload} />
      ) : (
        <section className="box" aria-labelledby="st-h">
          <div className="box-h">
            <h2 id="st-h" className="box-t">
              Staff
            </h2>
            <span className="box-s">{data ? `${data.staff.length} ${data.staff.length === 1 ? "person" : "people"}` : ""}</span>
          </div>
          {!data ? (
            <Sk h={200} r={12} />
          ) : (
            <Table
              cols="minmax(0,1.4fr) minmax(0,1.4fr) 110px 110px 44px"
              colsS="minmax(0,1fr) auto 44px"
              head={[{ h: "Name" }, { h: "Email", hide: true }, { h: "Role" }, { h: "Last active", hide: true }, { h: "" }]}
            >
              {data.staff.map((s) => (
                <tr className="dt-r" key={s.id}>
                  <Td>
                    <span className="who">
                      <span className="av">{initials(s.name)}</span>
                      <b>{s.name}</b>
                    </span>
                  </Td>
                  <Td hide>{s.email}</Td>
                  <Td>
                    <span className="chip">{ROLE_NAME[s.role]}</span>
                  </Td>
                  <Td hide>{s.lastActive ? ago(s.lastActive, t) : "invited"}</Td>
                  <Td r>
                    {edit ? (
                      <button className="ib" type="button" aria-label={`Change role of ${s.name}`} onClick={() => setEditing(s)}>
                        <Ic name="more" small />
                      </button>
                    ) : null}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </section>
      )}

      <section className="box sec" aria-labelledby="mx-h">
        <div className="box-h">
          <h2 id="mx-h" className="box-t">
            What each role can do
          </h2>
        </div>
        <Table
          className="matrix"
          cols="minmax(0,1.8fr) repeat(4,minmax(0,1fr))"
          colsS="minmax(0,1.4fr) repeat(4,minmax(0,1fr))"
          head={[{ h: "Area" }, { h: "Owner" }, { h: "Manager" }, { h: "Support" }, { h: "Viewer" }]}
        >
          {CONSOLE.matrix.map(([areaName, ...cells]) => (
            <tr className="dt-r" key={areaName}>
              <Td>
                <b>{areaName}</b>
              </Td>
              {cells.map((c, i) => (
                <Td key={i}>
                  <span className={`cap ${CAP[c].cls}`.trim()}>
                    <Ic name={CAP[c].icon} small />
                    <span className="cap-t">{CAP[c].text}</span>
                  </span>
                </Td>
              ))}
            </tr>
          ))}
        </Table>
      </section>
      {adding ? <AddDialog onClose={() => setAdding(false)} /> : null}
      {editing ? <RoleDialog person={editing} onClose={() => setEditing(null)} notify={notify} /> : null}
      {toast}
    </>
  );
}

export default function StaffPage() {
  return (
    <Gate areas={["staff"]}>
      <StaffPageInner />
    </Gate>
  );
}
