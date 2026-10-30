"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import { CONSOLE } from "@/design/console-copy";
import type { IconName } from "@/design/icons";
import { useAuth } from "@/components/AuthProvider";
import { initials, time } from "@/lib/fmt";
import { now, orgCall, useOrg } from "@/lib/org";
import type { Access, Area, ConsoleApi, ConsoleMe, IncidentDetail, StatusResponse } from "@/lib/org-contract";
import { Ic, MarkSprite } from "./ui";

type SearchResult = ConsoleApi["GET /console/search"]["R"]["results"][number];

interface ConsoleState {
  me: ConsoleMe;
  /** Can this person read (or edit) an area? */
  can: (area: Area, level?: Exclude<Access, "none">) => boolean;
  viewer: boolean;
  status: StatusResponse | null;
  /** Shows the 2 px progress line under the top bar while true. */
  setBusy: (busy: boolean) => void;
}

const ConsoleContext = createContext<ConsoleState | null>(null);

export function useConsole() {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error("useConsole outside the Console shell");
  return ctx;
}

/** Pages report their loading state; the shell draws the progress line. */
export function useBusy(busy: boolean) {
  const { setBusy } = useConsole();
  useEffect(() => {
    setBusy(busy);
    return () => setBusy(false);
  }, [busy, setBusy]);
}

/** Pages a role can't open say so instead of failing with a 403 from the API. */
export function Gate({ areas, children }: { areas: Area[]; children: ReactNode }) {
  const { can } = useConsole();
  if (areas.some((a) => can(a))) return <>{children}</>;
  return (
    <div className="err-pg" role="alert">
      <span className="ic-b">
        <Ic name="lock" />
      </span>
      <h2>Not for your role</h2>
      <p>Your role can’t open this page. An Owner can change your role under Staff and roles.</p>
    </div>
  );
}

const NAV_AREA: Record<string, Area[]> = {
  overview: ["overview"],
  status: ["overview"],
  customers: ["customers"],
  support: ["support"],
  tournament: ["tournament"],
  casino: ["casino", "casino_moderation"],
  wishlist: ["wishlist"],
  vault: ["vault"],
  audit: ["audit"],
  staff: ["staff"],
};
const NAV_HREF: Record<string, string> = { overview: "/", status: "/status", customers: "/customers", support: "/support", tournament: "/tournament", casino: "/casino", wishlist: "/wishlist", vault: "/vault", audit: "/audit", staff: "/staff" };

function active(pathname: string, id: string) {
  const href = NAV_HREF[id];
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known in the browser; render the light icon on the server.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button className="ib" type="button" aria-label={dark ? CONSOLE.theme.light : CONSOLE.theme.dark} onClick={() => setTheme(dark ? "light" : "dark")}>
      <Ic name={dark ? "sun" : "moon"} />
    </button>
  );
}

function Search() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  // Results belong to the term they were found for, so a shorter or newer term never shows stale ones.
  const [found, setFound] = useState<{ term: string; results: SearchResult[] } | null>(null);
  const [sel, setSel] = useState(0);
  const term = q.trim();
  const results = found && term.length >= 2 && found.term === term ? found.results : null;
  const setResults = (r: null) => setFound(r);

  // "/" focuses the search from anywhere outside a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (term.length < 2) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      orgCall<{ results: SearchResult[] }>(accessToken, "GET", `/console/search?q=${encodeURIComponent(term)}`).then(
        (r) => {
          if (!alive) return;
          setFound({ term, results: r.results });
          setSel(0);
        },
        () => alive && setFound({ term, results: [] }),
      );
    }, 200);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [term, accessToken]);

  function go(r: SearchResult) {
    setQ("");
    setResults(null);
    router.push(r.href);
  }

  return (
    <div className="srch" role="search">
      <label className="sr" htmlFor="console-search">
        {CONSOLE.search}
      </label>
      <Ic name="search" small />
      <input
        ref={input}
        id="console-search"
        className="inp"
        type="search"
        placeholder={CONSOLE.search}
        value={q}
        autoComplete="off"
        role="combobox"
        aria-expanded={!!results}
        aria-controls="console-search-r"
        aria-activedescendant={results?.length ? `sr-${sel}` : undefined}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (!results?.length) {
            if (e.key === "Escape") setQ("");
            return;
          }
          if (e.key === "Escape") return setResults(null);
          if (!["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) return;
          e.preventDefault();
          if (e.key === "Enter") go(results[sel]);
          else setSel((s) => (s + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
        }}
        onBlur={() => window.setTimeout(() => setResults(null), 150)}
      />
      <kbd aria-hidden="true">/</kbd>
      {results ? (
        <div className="srch-r" id="console-search-r" role="listbox" aria-label="Results">
          {results.length ? (
            results.map((r, i) => (
              <a key={`${r.kind}${r.id}`} id={`sr-${i}`} role="option" aria-selected={i === sel} href={r.href} onMouseDown={(e) => (e.preventDefault(), go(r))}>
                <b>{r.label}</b>
                <span>{r.sub}</span>
              </a>
            ))
          ) : (
            <p>Nothing found for “{q.trim()}”.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function NoAccess({ message }: { message: string }) {
  const { user, signOut } = useAuth();
  return (
    <div className="pl">
      <div className="site" style={{ display: "grid", placeItems: "center", padding: 16 }}>
        <div className="err-pg" role="alert">
          <span className="ic-b">
            <Ic name="lock" />
          </span>
          <h2>No access</h2>
          <p>{message}</p>
          <p className="box-s">Signed in as {user.email}.</p>
          <div className="acts">
            <button className="btn btn-line btn-s" type="button" onClick={signOut}>
              Sign in with another account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { data: me, error } = useOrg<ConsoleMe>("/console/me");
  const { data: status } = useOrg<StatusResponse>(me ? "/console/status" : null, 60_000);
  const { data: counts } = useOrg<{ counts: { open: number } }>(me && me.access.support !== "none" ? "/console/support?status=open" : null, 60_000);
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const menu = menuAt === pathname;
  const setMenu = (open: boolean) => setMenuAt(open ? pathname : null);
  const [busy, setBusyState] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  const setBusy = useCallback((b: boolean) => setBusyState(b), []);

  // Esc closes the phone menu and hands focus back.
  useEffect(() => {
    if (!menu) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuAt(null);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const downService = status?.services.find((s) => s.state === "down") ?? null;
  const openIncident = status?.open.find((i) => downService && i.services.includes(downService.id)) ?? status?.open[0] ?? null;
  const { data: incident } = useOrg<IncidentDetail>(downService && openIncident ? `/console/incidents/${openIncident.id}` : null, 60_000);

  const value = useMemo<ConsoleState | null>(() => {
    if (!me) return null;
    const rank = { none: 0, read: 1, edit: 2 } as const;
    return {
      me,
      viewer: me.role === "viewer",
      can: (area, level = "read") => rank[me.access[area] ?? "none"] >= rank[level],
      status: status ?? null,
      setBusy,
    };
  }, [me, status, setBusy]);

  if (error) {
    const message =
      error.status === 403
        ? "This account isn’t on the Planary staff list. Ask an Owner to add you under Staff and roles."
        : `The Console service didn’t answer (${error.status || "network"}). ${error.message}`;
    return <NoAccess message={message} />;
  }
  if (!value) {
    return (
      <div className="pl">
        <div className="site">
          <div className="prog" role="progressbar" aria-label="Loading the Console">
            <i />
          </div>
        </div>
      </div>
    );
  }

  const supportCount = counts?.counts.open ?? 0;
  const incidentCount = status?.open.length ?? 0;
  const live = incident?.liveEvents.length ?? 0;
  const nav = CONSOLE.nav
    .map((g) => ({ ...g, items: g.items.filter((n) => NAV_AREA[n.id].some((a) => value.can(a))) }))
    .filter((g) => g.items.length);

  const sidebar = (
    <aside className={`sb${menu ? " open" : ""}`} aria-label="Console" id="console-nav" {...(menu ? { role: "dialog", "aria-modal": true } : {})}>
      <div className="sb-brand">
        <Link className="wm" href="/">
          <svg className="wm-mark" viewBox="0 0 100 100" aria-hidden="true">
            <use href="#pmark" />
          </svg>
          <span>Planary</span>
        </Link>
        <span className="sb-app">{CONSOLE.app}</span>
        {menu ? (
          <button ref={closeRef} className="ib" type="button" style={{ marginLeft: "auto" }} aria-label="Close menu" onClick={() => (setMenu(false), menuBtn.current?.focus())}>
            <Ic name="x" />
          </button>
        ) : null}
      </div>
      <p className="sb-staff">
        <Ic name="shield" />
        {CONSOLE.staffOnly}
      </p>
      {nav.map((g) => (
        <nav key={g.g} aria-label={g.g}>
          <span className="sb-g">{g.g}</span>
          {g.items.map((n) => {
            const on = active(pathname, n.id);
            const down = n.id === "tournament" && downService?.id === "tournament";
            const count = n.id === "support" ? supportCount : n.id === "status" ? incidentCount : 0;
            return (
              <Link key={n.id} className={`nl${on ? " on" : ""}`} href={NAV_HREF[n.id]} aria-current={on ? "page" : undefined}>
                <Ic name={n.ic as IconName} />
                <span>{n.label}</span>
                {count ? (
                  <span className={`n${n.id === "status" ? " err" : ""}`} aria-label={n.id === "status" ? `${count} open incident${count === 1 ? "" : "s"}` : `${count} open`}>
                    {count}
                  </span>
                ) : null}
                {down ? <span className="dot err" role="img" aria-label="Down" /> : null}
              </Link>
            );
          })}
        </nav>
      ))}
      <div className="sb-me">
        <span className="av">{initials(value.me.name)}</span>
        <div>
          <b>{value.me.name}</b>
          <span>{value.me.role[0].toUpperCase() + value.me.role.slice(1)}</span>
        </div>
        <button className="ib" type="button" aria-label={CONSOLE.signOut} onClick={signOut}>
          <Ic name="logout" small />
        </button>
      </div>
    </aside>
  );

  return (
    <ConsoleContext.Provider value={value}>
      <div className="pl" lang="en">
        <MarkSprite />
        <div className="site">
          <div className="shell">
            <a className="skip" href="#main">
              Skip to content
            </a>
            {sidebar}
            {menu ? <div className="sb-scrim" aria-hidden="true" onClick={() => setMenu(false)} /> : null}
            <div className="mn" inert={menu}>
              <header className="tb">
                <button ref={menuBtn} className="ib tb-menu" type="button" aria-label="Open menu" aria-expanded={menu} aria-controls="console-nav" onClick={() => setMenu(true)}>
                  <Ic name="menu" />
                </button>
                <span className="tb-brand">
                  <span className="wm" style={{ fontSize: 16 }}>
                    <svg className="wm-mark" viewBox="0 0 100 100" aria-hidden="true">
                      <use href="#pmark" />
                    </svg>
                  </span>
                  {CONSOLE.app}
                </span>
                <Search />
                <div className="tb-r">
                  {value.viewer ? (
                    <span className="ro">
                      <Ic name="eye" small />
                      <span className="l">{CONSOLE.readOnly}</span>
                    </span>
                  ) : null}
                  <Link className={`sys${downService ? " err" : ""}`} href="/status" aria-label={`Status: ${downService ? `${downService.name} down` : status ? CONSOLE.sysUp : "checking"}`}>
                    <span className={`dot ${downService ? "err" : "ok"}`} />
                    <span className="l">{downService ? `${downService.name} down` : status ? CONSOLE.sysUp : "Checking"}</span>
                  </Link>
                  <ThemeButton />
                </div>
              </header>
              {busy ? (
                <div className="prog" role="progressbar" aria-label="Loading">
                  <i />
                </div>
              ) : null}
              {downService ? (
                <div className="banner" role="status">
                  <Ic name="alert" />
                  <span className="grow">
                    <b>
                      {downService.name} is down since {time(downService.downSince ?? now())}.
                    </b>{" "}
                    {live ? `${live} live event${live === 1 ? " is" : "s are"} affected. Organisers see the last saved state.` : null}
                  </span>
                  {openIncident ? (
                    <Link className="btn btn-ink btn-s" href={`/status/${openIncident.id}`}>
                      {CONSOLE.downBanner.cta}
                    </Link>
                  ) : null}
                </div>
              ) : null}
              {value.viewer ? (
                <div className="banner info">
                  <Ic name="eye" />
                  <span className="grow">{CONSOLE.readOnlyBanner}</span>
                </div>
              ) : null}
              <main className="pg" id="main" tabIndex={-1}>
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </ConsoleContext.Provider>
  );
}
