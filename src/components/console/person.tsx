import { date } from "@/lib/fmt";
import type { PersonRow } from "@/lib/org-contract";
import { Chip } from "./ui";

export const SIGN_IN: Record<string, string> = { password: "Password", google: "Google", github: "GitHub" };

/** Active, suspended (until when) or banned, as a chip. */
export function PersonStatusChip({ p }: { p: PersonRow }) {
  if (p.status === "banned") return <Chip tone="err" dot>Banned</Chip>;
  if (p.status === "suspended") return <Chip tone="warn" dot>{p.suspension?.until ? `Suspended until ${date(p.suspension.until)}` : "Suspended"}</Chip>;
  return <Chip tone="line">Active</Chip>;
}
