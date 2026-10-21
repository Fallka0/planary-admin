"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { CasinoHeadSlot, CasinoStaffProvider } from "@/components/CasinoStaff";
import { useBusy } from "@/components/console/Shell";
import { ErrorCard, PageHead, Sk } from "@/components/console/ui";
import { type Permission, type StaffMe, useAdmin } from "@/lib/api";
import { OrgError } from "@/lib/org";

const TABS: { href: string; label: string; needs?: Permission }[] = [
  { href: "/casino", label: "Overview" },
  { href: "/casino/games", label: "Games" },
  { href: "/casino/rounds", label: "Game rounds" },
  { href: "/casino/transactions", label: "Transactions" },
  { href: "/casino/players", label: "Players" },
  { href: "/casino/moderation", label: "Moderation", needs: "moderate" },
  { href: "/casino/announcements", label: "Announcements" },
  { href: "/casino/bank", label: "Bank" },
  { href: "/casino/economy", label: "Economy and market" },
];

function on(pathname: string, href: string) {
  return href === "/casino" ? pathname === "/casino" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The Casino section: today's operator pages, unchanged, under one heading with sub-tabs.
 * They keep talking to the casino API, which checks its own staff list.
 */
export default function CasinoLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: me, error, reload } = useAdmin<StaffMe>("/me");
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useBusy(!me && !error);

  return (
    <>
      <PageHead title="Casino">
        <div ref={setSlot} style={{ display: "contents" }} />
      </PageHead>
      <nav className="tabbar subnav" aria-label="Casino">
        {TABS.filter((t) => !t.needs || me?.permissions.includes(t.needs)).map((t) => {
          const cur = on(pathname, t.href);
          return (
            <Link key={t.href} className={`tab${cur ? " on" : ""}`} href={t.href} aria-current={cur ? "page" : undefined}>
              {t.label}
            </Link>
          );
        })}
      </nav>
      {error ? (
        error.status === 403 ? (
          <div className="err-pg" role="alert">
            <h2>No Casino role</h2>
            <p>The Casino keeps its own staff list, and this account isn’t on it. An Owner can add it under Staff and roles.</p>
          </div>
        ) : (
          <ErrorCard title="The Casino didn’t load" error={new OrgError(error.message, error.status, error.code, undefined, 0)} onRetry={reload} />
        )
      ) : me ? (
        <CasinoStaffProvider me={me}>
          <CasinoHeadSlot.Provider value={slot}>
            <div className="casino-pg">{children}</div>
          </CasinoHeadSlot.Provider>
        </CasinoStaffProvider>
      ) : (
        <div className="kpis" aria-hidden="true">
          <Sk h={96} />
          <Sk h={96} />
          <Sk h={96} />
          <Sk h={96} />
        </div>
      )}
    </>
  );
}
