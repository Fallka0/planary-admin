"use client";

import Link from "next/link";
import type { BwdRole } from "@/lib/org-contract";

export const BWD_ROLE: Record<BwdRole, string> = { student: "Student", teacher: "Teacher" };

/** The portal's wall time ("2026-11-20T08:15") as "20.11.2026 08:15". */
export function wallTime(s: string | null) {
  const m = s ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(s) : null;
  return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}` : "Never";
}

/** People and Classes, the two pages of the bwd Portal section. */
export function BwdTabs({ on }: { on: "people" | "classes" }) {
  return (
    <nav className="filters sec" aria-label="bwd Portal">
      <Link className={`fchip${on === "people" ? " on" : ""}`} href="/bwdportal" aria-current={on === "people" ? "page" : undefined}>
        People
      </Link>
      <Link className={`fchip${on === "classes" ? " on" : ""}`} href="/bwdportal/classes" aria-current={on === "classes" ? "page" : undefined}>
        Classes
      </Link>
    </nav>
  );
}
