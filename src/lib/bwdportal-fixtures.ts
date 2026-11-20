import type { BwdClass, BwdPerson, BwdSubject } from "./org-contract";

/** Made-up bwd Portal accounts and classes for `fixtures` mode. */
const PEOPLE: BwdPerson[] = [
  { id: "bw_lea", name: "Lea Muster", email: "lea.muster@bwdbern.ch", role: "student", classCode: "IM24a", lastLoginAt: "2026-10-20T07:42", assignments: [], classTeacherOf: [] },
  { id: "bw_noah", name: "Noah Beispiel", email: "noah.beispiel@bwdbern.ch", role: "student", classCode: "IM24a", lastLoginAt: "2026-10-19T18:03", assignments: [], classTeacherOf: [] },
  { id: "bw_mia", name: "Mia Probst", email: "mia.probst@bwdbern.ch", role: "student", classCode: "IM25a", lastLoginAt: null, assignments: [], classTeacherOf: [] },
  {
    id: "bw_keller",
    name: "Anna Keller",
    email: "anna.keller@bwdbern.ch",
    role: "teacher",
    classCode: null,
    lastLoginAt: "2026-10-20T06:58",
    assignments: [
      { classCode: "IM24a", subject: "MA" },
      { classCode: "IM25a", subject: "MA" },
    ],
    classTeacherOf: ["IM24a"],
  },
  { id: "bw_frei", name: "Jonas Frei", email: "jonas.frei@bwdbern.ch", role: "teacher", classCode: null, lastLoginAt: "2026-10-18T12:10", assignments: [{ classCode: "IM24a", subject: "D" }], classTeacherOf: [] },
];

const CLASSES: BwdClass[] = [
  { id: "c_im24a", code: "IM24a", program: "Informatikmittelschule", classTeacher: { id: "bw_keller", name: "Anna Keller" }, students: 2, teachers: 2 },
  { id: "c_im25a", code: "IM25a", program: "Informatikmittelschule", classTeacher: null, students: 1, teachers: 1 },
];

const SUBJECTS: BwdSubject[] = [
  { code: "D", name: "Deutsch" },
  { code: "E", name: "Englisch" },
  { code: "F", name: "Französisch" },
  { code: "MA", name: "Mathematik" },
  { code: "WR", name: "Wirtschaft und Recht" },
  { code: "IN", name: "Informatik" },
];

export function bwdPeople(q: URLSearchParams) {
  const term = (q.get("q") ?? "").toLowerCase();
  const role = q.get("role");
  const cls = q.get("class");
  return {
    people: PEOPLE.filter(
      (p) => (!term || p.name.toLowerCase().includes(term) || p.email.includes(term)) && (!role || p.role === role) && (!cls || p.classCode === cls || p.assignments.some((a) => a.classCode === cls)),
    ),
  };
}

export function bwdPerson(id: string) {
  const p = PEOPLE.find((x) => x.id === id);
  if (!p) throw Object.assign(new Error("Not found in the bwd Portal."), { status: 404, code: "not_found" });
  return p;
}

export const bwdClasses = () => ({ classes: CLASSES });
export const bwdSubjects = () => ({ subjects: SUBJECTS });
