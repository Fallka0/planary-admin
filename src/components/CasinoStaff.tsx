"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Permission, StaffMe } from "@/lib/api";

/** The casino API's view of the signed-in staff member, for the Casino pages' permission checks. */
const CasinoStaffContext = createContext<StaffMe | null>(null);

export function CasinoStaffProvider({ me, children }: { me: StaffMe; children: ReactNode }) {
  return <CasinoStaffContext.Provider value={me}>{children}</CasinoStaffContext.Provider>;
}

export function useStaff() {
  const staff = useContext(CasinoStaffContext);
  if (!staff) throw new Error("useStaff outside the Casino section");
  return { ...staff, can: (p: Permission) => staff.permissions.includes(p) };
}
