import type { CustomerRow, RequestStatus, TournamentState } from "@/lib/org-contract";

export const BILLING: Record<CustomerRow["billing"], { tone: string; label: (c: CustomerRow) => string }> = {
  paid: { tone: "ok", label: () => "Paid" },
  overdue: { tone: "err", label: (c) => `Overdue ${c.overdueDays} day${c.overdueDays === 1 ? "" : "s"}` },
  free: { tone: "", label: () => "Free" },
  card_expires: { tone: "warn", label: () => "Card expires soon" },
};

/** Logo tiles in three shades, picked from the id so a customer always keeps its colour. */
export function logoShade(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ["", "l2", "l3"][h % 3];
}


/** Tournament states: chip tone, dot tone, label. */
export const TOURNAMENT_STATE: Record<TournamentState, { chip: string; dot: string; label: string }> = {
  live: { chip: "warn", dot: "warn", label: "Live" },
  open: { chip: "", dot: "ok", label: "Sign-up open" },
  draft: { chip: "cx-line", dot: "", label: "Draft" },
  done: { chip: "", dot: "", label: "Finished" },
};

export const REQUEST_STATE: Record<RequestStatus, { chip: string; label: string }> = {
  open: { chip: "info", label: "Open" },
  waiting: { chip: "", label: "Waiting" },
  done: { chip: "ok", label: "Done" },
};
