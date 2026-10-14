"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Button, Card, Drawer, Label, Link as HeroLink, SearchField } from "@heroui/react";
import { useTheme } from "next-themes";
import {
  Coins,
  Gamepad2,
  Landmark,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Monitor,
  Moon,
  ReceiptText,
  ScrollText,
  ShieldAlert,
  Sun,
  UserCog,
  Users,
} from "lucide-react";
import { type Permission, type StaffMe, useAdmin } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { Loading, StatusChip } from "./ui";

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
      { href: "/rounds", label: "Game rounds", icon: Layers },
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
      { href: "/bank", label: "Bank", icon: Landmark },
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
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="max-w-md text-center">
        <Card.Header>
          <Card.Title>No access</Card.Title>
          <Card.Description>{message}</Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-default-500 text-sm">Signed in as {user.email}.</p>
        </Card.Content>
        <Card.Footer>
          <Button className="w-full" variant="secondary" onPress={signOut}>
            Sign in with another account
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
  const Icon = !mounted ? Monitor : theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={mounted ? `Theme: ${theme}. Switch to ${next}` : "Theme"}
      onPress={() => setTheme(next)}
    >
      <Icon className="size-4" />
    </Button>
  );
}

function NavContent({ me, onNavigate }: { me: StaffMe; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  return (
    <div className="flex h-full flex-col gap-5 p-3">
      <Link href="/" className="flex items-center gap-2.5 px-2 py-1" onClick={onNavigate}>
        <span className="bg-accent text-accent-foreground grid size-8 place-items-center rounded-lg text-sm font-bold">P</span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">Planary Casino</span>
          <span className="text-default-500 block text-xs">Operator console</span>
        </span>
      </Link>

      {NAV.map((group) => (
        <nav key={group.label} aria-label={group.label} className="grid gap-0.5">
          <span className="text-default-500 px-2 pb-1 text-[11px] font-semibold tracking-wide uppercase">{group.label}</span>
          {group.items
            .filter((item) => !item.needs || me.permissions.includes(item.needs))
            .map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors ${
                    active ? "bg-accent-soft text-accent font-semibold" : "text-default-600 hover:bg-default-100 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.9} />
                  {label}
                </Link>
              );
            })}
        </nav>
      ))}

      <div className="border-default-200 mt-auto grid gap-2 border-t pt-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium">{me.name}</div>
            <StatusChip status={me.role} />
          </div>
          <ThemeToggle />
        </div>
        <Button variant="ghost" className="justify-start" onPress={signOut}>
          <LogOut className="size-4" /> Sign out
        </Button>
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
      className="max-w-md flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/players?q=${encodeURIComponent(q.trim())}` : "/players");
      }}
    >
    <SearchField aria-label="Find a player" value={q} onChange={setQ}>
      <Label className="sr-only">Find a player</Label>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Find a player by name or ID" />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
    </form>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { data: me, error } = useAdmin<StaffMe>("/me");
  const [menu, setMenu] = useState(false);

  if (error) {
    return <NoAccess message={error.status === 403 ? "This account isn't on the Planary Casino staff list. Ask the owner to add you." : error.message} />;
  }
  if (!me) return <Loading />;

  return (
    <StaffContext.Provider value={me}>
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-default-200 bg-content1 sticky top-0 hidden h-screen border-r lg:block">
          <NavContent me={me} />
        </aside>

        <div className="min-w-0">
          <header className="border-default-200 bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6">
            <Drawer isOpen={menu} onOpenChange={setMenu}>
              <Button isIconOnly size="sm" variant="ghost" className="lg:hidden" aria-label="Open menu" onPress={() => setMenu(true)}>
                <Menu className="size-5" />
              </Button>
              <Drawer.Backdrop>
                <Drawer.Content placement="left" className="w-72">
                  <Drawer.Dialog aria-label="Menu">
                    <NavContent me={me} onNavigate={() => setMenu(false)} />
                  </Drawer.Dialog>
                </Drawer.Content>
              </Drawer.Backdrop>
            </Drawer>

            <PlayerSearch />

            <HeroLink href="https://casino.planary.ch" target="_blank" rel="noreferrer" className="text-default-600 ml-auto hidden text-sm sm:flex">
              Open casino
              <HeroLink.Icon />
            </HeroLink>
          </header>

          <main className="mx-auto grid max-w-[1400px] gap-5 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </StaffContext.Provider>
  );
}
