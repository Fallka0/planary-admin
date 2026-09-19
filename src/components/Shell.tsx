"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import {
  Coins,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ReceiptText,
  ScrollText,
  Search,
  ShieldAlert,
  UserCog,
  Users,
} from "lucide-react";
import { type Permission, type StaffMe, useAdmin } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { StatusPill, ToastProvider } from "./ui";

const StaffContext = createContext<StaffMe | null>(null);

export function useStaff() {
  const staff = useContext(StaffContext);
  if (!staff) throw new Error("useStaff outside the admin shell");
  return { ...staff, can: (p: Permission) => staff.permissions.includes(p) };
}

const NAV: { label: string; items: { href: string; label: string; icon: typeof Users; needs?: Permission }[] }[] = [
  {
    label: "Monitor",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/games", label: "Games", icon: Gamepad2 },
      { href: "/transactions", label: "Transactions", icon: ReceiptText },
    ],
  },
  {
    label: "Players",
    items: [
      { href: "/players", label: "Players", icon: Users },
      { href: "/moderation", label: "Moderation", icon: ShieldAlert, needs: "moderate" },
      { href: "/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    label: "Operate",
    items: [
      { href: "/economy", label: "Economy & shop", icon: Coins },
      { href: "/staff", label: "Staff", icon: UserCog },
      { href: "/audit", label: "Audit log", icon: ScrollText, needs: "audit" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NoAccess({ message }: { message: string }) {
  const { user, signOut } = useAuth();
  return (
    <div className="no-access">
      <div className="card">
        <h1>No access</h1>
        <p className="muted">{message}</p>
        <p className="small muted">Signed in as {user.email}.</p>
        <button className="btn" onClick={signOut}>
          Sign in with another account
        </button>
      </div>
    </div>
  );
}

function PlayerSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className="topbar-search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/players?q=${encodeURIComponent(q.trim())}` : "/players");
      }}
    >
      <Search size={15} aria-hidden="true" />
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a player by name or ID" aria-label="Find a player" />
    </form>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { data: me, error } = useAdmin<StaffMe>("/me");
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  if (error) return <NoAccess message={error.status === 403 ? "This account isn't on the Planary Casino staff list. Ask the owner to add you." : error.message} />;
  if (!me) return <div className="loading">Loading…</div>;

  return (
    <StaffContext.Provider value={me}>
      <ToastProvider>
        <div className={`shell${open ? " nav-open" : ""}`}>
          <aside className="nav" aria-label="Admin">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden="true">
                P
              </span>
              <span className="brand-copy">
                <strong>Planary Casino</strong>
                <span>Operator console</span>
              </span>
            </Link>
            {NAV.map((group) => (
              <nav key={group.label} className="nav-group" aria-label={group.label}>
                <span className="nav-label">{group.label}</span>
                {group.items
                  .filter((item) => !item.needs || me.permissions.includes(item.needs))
                  .map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} className="nav-link" aria-current={isActive(pathname, href) ? "page" : undefined}>
                      <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                      {label}
                    </Link>
                  ))}
              </nav>
            ))}
            <div className="nav-foot">
              <div className="me">
                <span className="me-copy">
                  <strong>{me.name}</strong>
                  <span>
                    <StatusPill status={me.role} />
                  </span>
                </span>
              </div>
              <button className="btn btn-ghost" onClick={signOut}>
                <LogOut size={15} aria-hidden="true" /> Sign out
              </button>
            </div>
          </aside>
          {open ? <div className="nav-scrim" onClick={() => setOpen(false)} aria-hidden="true" /> : null}
          <div className="main">
            <header className="topbar">
              <button className="btn btn-ghost icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
                <Menu size={18} aria-hidden="true" />
              </button>
              <PlayerSearch />
              <a className="btn btn-ghost hide-sm" href="https://casino.planary.ch" target="_blank" rel="noreferrer">
                Open casino
              </a>
            </header>
            <main className="content">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </StaffContext.Provider>
  );
}
