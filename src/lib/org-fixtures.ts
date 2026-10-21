// planary-org answered from the handoff's sample data (content/fixtures/console.json), shaped like
// the real API (org-contract.ts). Only used when NEXT_PUBLIC_CONSOLE_DATA=fixtures.

import { CONSOLE_FIXTURES as F } from "./console-fixtures";
import type {
  Access,
  Area,
  AuditEntry,
  ConsoleMe,
  CustomerDetail,
  CustomerRow,
  IncidentDetail,
  IncidentSummary,
  OrganiserRow,
  OverviewResponse,
  PlanId,
  RequestDetail,
  RequestSummary,
  ServiceStatus,
  StaffRole,
  StaffRow,
  StatusResponse,
  TournamentSummary,
  WishlistTotals,
} from "./org-contract";

const NOW = Date.parse("2026-10-20T20:11:00+02:00");
const MIN = 60_000;
const DAY = 86_400_000;

/** 20.10. 20:09 (2026, Zurich summer time) */
function at(s: string) {
  const m = /^(\d\d)\.(\d\d)\.(?:(\d{4}))?\s*(?:(\d\d):(\d\d))?$/.exec(s.trim());
  if (!m) return NOW;
  const [, d, mo, y = "2026", h = "12", mi = "00"] = m;
  return Date.parse(`${y}-${mo}-${d}T${h}:${mi}:00+02:00`);
}

/** "20:02" today, "gestern" / "yesterday", "18.10." */
function when(s: string) {
  if (/^\d\d:\d\d$/.test(s)) return at(`20.10. ${s}`);
  if (s === "gestern" || s === "yesterday") return NOW - DAY;
  return at(s);
}

const n = (s: string) => Number(String(s).replace(/[’'%\s]/g, "").replace("–", "")) || 0;

/** ?state=down|viewer|error|empty|loading, remembered for the tab. */
export function fixtureState(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("state");
  try {
    if (q !== null) sessionStorage.setItem("console:state", q);
    return sessionStorage.getItem("console:state") ?? "";
  } catch {
    return q ?? "";
  }
}

const MATRIX: Record<Area, [Access, Access, Access, Access]> = {
  overview: ["edit", "edit", "read", "read"],
  incidents: ["edit", "edit", "read", "read"],
  customers: ["edit", "edit", "read", "read"],
  notes: ["edit", "edit", "edit", "read"],
  support: ["edit", "edit", "edit", "read"],
  tournament: ["edit", "edit", "read", "read"],
  casino: ["edit", "edit", "none", "none"],
  casino_moderation: ["edit", "edit", "edit", "read"],
  wishlist: ["read", "read", "read", "read"],
  audit: ["read", "read", "none", "none"],
  staff: ["edit", "none", "none", "none"],
};
const ROLE_INDEX: Record<StaffRole, number> = { owner: 0, manager: 1, support: 2, viewer: 3 };

function me(): ConsoleMe {
  const viewer = fixtureState() === "viewer";
  const role: StaffRole = viewer ? "viewer" : "owner";
  const access = Object.fromEntries(Object.entries(MATRIX).map(([a, v]) => [a, v[ROLE_INDEX[role]]])) as Record<Area, Access>;
  const p = viewer ? F.viewer : F.me;
  return { id: viewer ? "u_tim" : "u_mykyta", name: p.name, email: viewer ? "tim@planary.ch" : "mykyta@planary.ch", role, access };
}

const STAFF_IDS: Record<string, { id: string; name: string }> = {
  MP: { id: "u_mykyta", name: "Mykyta Pantelei" },
  LG: { id: "u_lea", name: "Lea Graf" },
  SH: { id: "u_sven", name: "Sven Huber" },
  TR: { id: "u_tim", name: "Tim Roth" },
};

const TOPIC: Record<string, RequestSummary["topic"]> = { Tournament: "tournament", Billing: "billing", Plan: "plan" };

function requests(): RequestSummary[] {
  if (fixtureState() === "empty") return [];
  return F.support.map((r) => ({
    id: r.id.toLowerCase(),
    code: r.id,
    subject: r.s,
    topic: TOPIC[r.app] ?? "other",
    status: r.st as RequestSummary["status"],
    urgent: "urgent" in r ? !!r.urgent : false,
    organisation: { id: F.customers.find((c) => c.n === r.org)?.id ?? r.org, name: r.org },
    from: { id: `u_${r.who.split(" ")[0].toLowerCase()}`, name: r.who, email: `${r.who.split(" ")[0].toLowerCase()}@example.ch` },
    tournament: r.id === "REQ-1184" ? { id: "t_0", name: "Gurten LAN" } : null,
    assignee: r.as ? STAFF_IDS[r.as] : null,
    createdAt: when(r.t),
    updatedAt: when(r.t),
    unread: "unread" in r ? !!r.unread : false,
  }));
}

function down() {
  return fixtureState() === "down";
}

function services(): ServiceStatus[] {
  return F.services.map((s) => {
    const isDown = down() && s.id === "tournament";
    return {
      id: s.id as ServiceStatus["id"],
      name: s.n,
      host: s.host,
      state: isDown ? "down" : (s.st as ServiceStatus["state"]),
      downSince: isDown ? at("20.10. 19:58") : null,
      medianMs: isDown ? null : s.ms,
      spark: isDown ? s.spark.map((v, i) => (i > 26 ? null : v)) : [...s.spark],
      uptime30: n(s.up) / 100,
      errors24h: isDown ? 565 : n(s.errs),
      deploy: { at: at(s.dep), commit: s.commit, author: s.by, message: null, url: null },
    };
  });
}

const OPEN_INCIDENT: IncidentSummary = {
  id: "inc_0042",
  code: "INC-0042",
  title: "Tournament: live API not responding",
  severity: "major",
  status: "identified",
  services: ["tournament"],
  startedAt: at("20.10. 19:58"),
  resolvedAt: null,
  showToOrganisers: true,
};

function recentIncidents(): IncidentSummary[] {
  return F.incidents.map((i, k) => {
    const start = at(i.when);
    const [h, m] = /(\d+) h (\d+) min/.exec(i.dur)?.slice(1).map(Number) ?? [0, parseInt(i.dur, 10)];
    return {
      id: `inc_00${41 - k}`,
      code: i.id,
      title: i.t,
      severity: "minor",
      status: "resolved",
      services: [i.t.startsWith("Wishlist") ? "wishlist" : "auth"],
      startedAt: start,
      resolvedAt: start + (h * 60 + m) * MIN,
      showToOrganisers: false,
    };
  });
}

function tournaments(): TournamentSummary[] {
  return F.tournaments.map((t, i) => {
    const [teams, max] = t.teams.includes("/") ? t.teams.split("/").map(n) : [0, 16];
    const live = F.live.find((l) => l.n === t.n);
    const start = t.d === "Today" ? at(`20.10. ${live?.since ?? "10:00"}`) : t.d === "–" ? null : at(t.d);
    return {
      id: `t_${i}`,
      slug: t.n.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: t.n,
      game: t.g,
      startsAt: start,
      endsAt: null,
      state: t.st as TournamentSummary["state"],
      phase: live?.ph ?? null,
      teams,
      maxTeams: max,
      waiting: 0,
      organisationId: F.customers.find((c) => c.n === t.org)?.id ?? null,
      organisationName: t.org,
      ownerId: "u_owner",
      plan: t.plan.toLowerCase() as PlanId,
      viewers: live ? n(live.viewers) : 0,
      updatedAt: NOW,
    };
  });
}

function customers(): CustomerRow[] {
  return F.customers.map((c) => ({
    id: c.id,
    name: c.n,
    initials: c.ini,
    plan: c.plan.toLowerCase() as PlanId,
    members: n(c.mem),
    tournamentsThisYear: n(c.tour),
    revenueYear: n(c.rev) * 100,
    billing: c.st === "overdue" ? "overdue" : c.st === "free" ? "free" : c.st === "warn" ? "card_expires" : "paid",
    overdueDays: c.st === "overdue" ? 12 : 0,
    since: at(c.since),
  }));
}

function customer(id: string): CustomerDetail {
  const row = customers().find((c) => c.id === id) ?? customers()[0];
  const g = F.gurten;
  const isG = row.id === "gurten";
  return {
    ...row,
    slug: row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    renewsAt: isG ? at(g.renews) : null,
    paymentMethod: isG ? { brand: "Visa", last4: "4242", expMonth: 8, expYear: 2028, kind: "card" } : null,
    provider: "stripe",
    contact: isG ? { email: g.contact, phone: "+41 31 000 00 00", address: ["Verein Gurten LAN", "Postfach 123", "3000 Bern"] } : null,
    invoices: isG
      ? g.invoices.map((i, k) => ({
          id: `in_${k}`,
          number: i.n,
          createdAt: at(i.d),
          dueAt: at(i.d) + 14 * DAY,
          amount: Math.round(n(i.a.replace("CHF", "")) * 100),
          currency: "CHF" as const,
          status: i.st === "err" ? ("open" as const) : ("paid" as const),
          description: k === 0 ? "Plan Verein, 3.2.2026 bis 2.2.2027" : "Plan Event, Gurten LAN Warm-up",
          overdueDays: i.st === "err" ? 12 : 0,
          pdfUrl: "#",
          payUrl: "#",
        }))
      : [],
    memberList: (isG ? g.members : []).map((m, k) => ({
      id: `m_${k}`,
      name: m.n,
      email: `${m.n.split(" ")[0].toLowerCase()}@example.ch`,
      role: m.r === "Owner" ? ("owner" as const) : ("member" as const),
      lastActive: m.last === "today" ? NOW - 3 * 3600_000 : at(m.last),
    })),
    tournaments: tournaments().filter((t) => t.organisationId === row.id),
    notes: isG ? g.notes.map((x, k) => ({ id: `n_${k}`, by: x.who, body: x.b, at: at(x.t) })) : [],
    requests: requests().filter((r) => r.organisation?.id === row.id),
  };
}

function organisers(): OrganiserRow[] {
  return F.organisers.map((o, i) => {
    const [latestName, latestWhen = ""] = o.last.split(" · ");
    const state: TournamentSummary["state"] = latestWhen === "today" ? "live" : latestWhen === "draft" ? "draft" : "open";
    return {
      id: `o_${i}`,
      kind: o.stl.includes("no organisation") ? "person" : "organisation",
      name: o.n,
      initials: o.ini,
      plan: o.plan.toLowerCase() as PlanId,
      organisers: n(o.orgs),
      tournaments: n(o.tour),
      latest: { name: latestName, at: latestWhen === "today" ? NOW : latestWhen === "draft" ? null : at(latestWhen), state },
      status: o.st === "overdue" ? "overdue" : o.st === "free" ? "free" : "active",
    };
  });
}

const AUDIT_ACTION: Record<string, [AuditEntry["area"], string]> = {
  "Posted an incident update": ["incidents", "incident.update"],
  "Replied to a support request": ["support", "support.reply"],
  "Rolled back a deploy": ["incidents", "deploy.rollback"],
  "Sent a payment reminder": ["customers", "invoice.reminder"],
  "Muted a player in chat": ["casino_moderation", "player.mute"],
  "Changed a plan": ["customers", "plan.change"],
  "Changed a role": ["staff", "staff.role"],
  "Added a customer note": ["notes", "note.add"],
  "Adjusted chips": ["casino", "player.adjust"],
  "Disabled a share link": ["wishlist", "share.disable"],
};

function audit(area?: string | null): AuditEntry[] {
  const names: Record<string, string> = { "Mykyta P.": "u_mykyta", "Lea Graf": "u_lea", "Sven Huber": "u_sven" };
  return F.audit
    .map((a, i) => {
      const [ar, action] = AUDIT_ACTION[a.a] ?? (["system", "other"] as const);
      return { id: `a_${i}`, at: at(a.t), area: ar, actor: { id: names[a.who] ?? a.who, name: a.who }, action, sentence: a.a, target: a.tg, details: a.d };
    })
    .filter((e) => !area || e.area === area || (area === "casino" && e.area === "casino_moderation"));
}

function staff(): StaffRow[] {
  const last: Record<string, number> = { now: NOW, "5 min ago": NOW - 5 * MIN, "2 h ago": NOW - 2 * 3600_000, yesterday: NOW - DAY };
  return F.staff.map((s) => ({
    id: STAFF_IDS[s.ini].id,
    name: s.n,
    email: s.e,
    role: s.role.toLowerCase() as StaffRole,
    lastActive: last[s.last] ?? null,
    since: at("05.01.2026"),
  }));
}

function overview(days: number): OverviewResponse {
  const reqs = requests().filter((r) => r.status === "open");
  const pick = (a: readonly number[]) => (days <= 30 ? a.slice(-days) : [...a, ...a, ...a].slice(-days));
  const apps = F.apps.map((a) => ({
    app: a.app.toLowerCase() as "tournament" | "casino" | "wishlist",
    today: n(a.d),
    d7: n(a.w),
    d30: n(a.m),
    spark: [...a.spark],
    state: (down() && a.app === "Tournament" ? "down" : "ok") as ServiceStatus["state"],
  }));
  return {
    days: days as 7 | 30 | 90,
    accounts: 12480,
    accountsNew7: 312,
    activeToday: 1906,
    organisations: 252,
    paidOrganisations: 38,
    openRequests: reqs.length,
    unassignedRequests: reqs.filter((r) => !r.assignee).length,
    signups: pick(F.signups),
    active: pick(F.active),
    signupsPrev: Math.round(pick(F.signups).reduce((a, b) => a + b, 0) / 1.18),
    requests: [...reqs].sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.createdAt - a.createdAt).slice(0, 5),
    apps,
    services: services().map(({ id, name, state, medianMs, uptime30 }) => ({ id, name, state, medianMs, uptime30 })),
  };
}

function incident(id: string): IncidentDetail {
  const base = id === OPEN_INCIDENT.id ? OPEN_INCIDENT : (recentIncidents().find((i) => i.id === id) ?? OPEN_INCIDENT);
  const live = tournaments().filter((t) => t.state === "live");
  const errs = [3, 2, 4, 3, 2, 3, 5, 2, 3, 4, 2, 3, 3, 4, 2, 3, 9, 38, 52, 64, 61, 57, 48, 40, 22, 14, 9, 6, 4, 3];
  return {
    ...base,
    updates: [
      { id: "u4", status: "identified", message: "Database connection pool runs out since deploy 4f1e2a9 (schedule-sync). Lea is rolling back.", showToOrganisers: true, by: "Mykyta Pantelei", at: at("20.10. 20:09") },
      { id: "u3", status: "investigating", message: "Rolled back to 9b03c11. Errors are dropping.", showToOrganisers: false, by: "Lea Graf", at: at("20.10. 20:04") },
      { id: "u2", status: "investigating", message: "Live scores and the beamer view stopped updating. Sign-up and tournament pages still load.", showToOrganisers: true, by: "Lea Graf", at: at("20.10. 20:01") },
      { id: "u1", status: "investigating", message: "Two failed checks in a row on tournament.planary.ch.", showToOrganisers: false, by: "Status checks", at: at("20.10. 19:58") },
    ],
    liveEvents: live,
    errorsPerMinute: errs.map((v, i) => ({ at: NOW - (29 - i) * MIN, n: v })),
    deploys: [
      { service: "tournament", at: at("20.10. 20:04"), commit: "9b03c11", author: "Lea Graf", message: "Roll back to 9b03c11", running: true, suspect: false },
      { service: "tournament", at: at("20.10. 19:54"), commit: "4f1e2a9", author: "Lea Graf", message: "Schedule: batch delay updates", running: false, suspect: true },
    ],
  };
}

function status(): StatusResponse {
  return {
    services: services(),
    open: down() ? [OPEN_INCIDENT] : [],
    recent: recentIncidents(),
    errorGroups: down()
      ? { tournament: F.errors.map((e) => ({ message: e.t, route: e.p, count: n(e.n), lastAt: NOW - 2 * MIN })) }
      : {},
  };
}

function wishlist(): WishlistTotals {
  return {
    lists: 9812,
    listsNewWeek: 214,
    items: 61204,
    sharedLists: 3140,
    reservationsMonth: 2231,
    newPerWeek: [...F.wishBars],
    shops: F.shops.map(([d, s]) => [d as string, (s as number) / 100]),
  };
}

function detail(id: string): RequestDetail {
  const r = requests().find((x) => x.id === id) ?? requests()[0];
  const kind = { them: "customer", us: "staff", int: "internal" } as const;
  return {
    ...r,
    plan: "verein",
    messages: (r?.code === "REQ-1184" ? F.thread : []).map((m, i) => ({
      id: `m${i}`,
      kind: kind[m.kind as keyof typeof kind],
      author: { id: m.ini, name: m.who },
      body: m.b.join("\n\n"),
      attachments: "att" in m && m.att ? [{ id: "f1", name: m.att as string, size: 812_000, type: "image/jpeg", url: "#" }] : [],
      at: at(`20.10. ${m.t}`),
    })),
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fixtureCall<T>(method: "GET" | "POST", path: string): Promise<T> {
  const state = fixtureState();
  await wait(30);
  const url = new URL(path, "https://org.fixtures");
  // The loading state: the shell is there, the page's own data never arrives.
  if (state === "loading" && !/^\/console\/(me|status|support)$/.test(url.pathname)) await new Promise(() => {});
  const p = url.pathname;
  const q = url.searchParams;
  if (method === "POST") return { ok: true, id: "inc_0043", organisations: 3 } as T;
  if (state === "error" && p.startsWith("/console/customers")) {
    throw Object.assign(new Error("The billing service didn’t answer in time (503). Everything else in the Console still works."), {
      status: 503,
      code: "billing_timeout",
      requestId: "req_7Hk2Qd91",
      at: Date.parse("2026-10-20T20:11:42+02:00"),
    });
  }
  let m: RegExpExecArray | null;
  const routes: [RegExp, () => unknown][] = [
    [/^\/console\/me$/, me],
    [/^\/console\/overview$/, () => overview(Number(q.get("days")) || 30)],
    [/^\/console\/status$/, status],
    [/^\/console\/incidents\/([^/]+)$/, () => incident(m![1])],
    [/^\/console\/customers$/, () => ({ customers: customers().filter((c) => (!q.get("plan") || c.plan === q.get("plan")) && (!q.get("overdue") || c.billing === "overdue")) })],
    [/^\/console\/customers\.csv$/, () => "id,name\n"],
    [/^\/console\/customers\/([^/]+)$/, () => customer(m![1])],
    [
      /^\/console\/support$/,
      () => {
        const all = requests();
        const st = q.get("status") ?? "open";
        const who = q.get("who") ?? "all";
        return {
          requests: all.filter((r) => r.status === st && (who === "all" || (who === "mine" ? r.assignee?.id === me().id : !r.assignee))),
          counts: { open: all.filter((r) => r.status === "open").length, waiting: all.filter((r) => r.status === "waiting").length, done: 0 },
          assignable: Object.values(STAFF_IDS).filter((x) => x.id !== "u_tim"),
        };
      },
    ],
    [/^\/console\/support\/([^/]+)$/, () => detail(m![1])],
    [/^\/console\/tournaments$/, () => ({ tournaments: tournaments() })],
    [/^\/console\/organisers$/, () => ({ organisers: organisers() })],
    [/^\/console\/wishlist$/, wishlist],
    [/^\/console\/audit$/, () => ({ entries: audit(q.get("area")), more: true })],
    [/^\/console\/staff$/, () => ({ staff: staff() })],
    [/^\/console\/search$/, () => ({ results: customers().filter((c) => c.name.toLowerCase().includes((q.get("q") ?? "").toLowerCase())).slice(0, 5).map((c) => ({ kind: "organisation", id: c.id, label: c.name, sub: "Organisation", href: `/customers/${c.id}` })) })],
  ];
  for (const [re, fn] of routes) {
    m = re.exec(p);
    if (m) return fn() as T;
  }
  throw Object.assign(new Error("Not found."), { status: 404, code: "not_found", requestId: "req_fixture", at: NOW });
}
