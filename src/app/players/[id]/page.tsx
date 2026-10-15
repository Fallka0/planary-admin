"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Alert, Button, Card, Chip, Description, Input, Label, Link as HeroLink, Separator, Skeleton, Table, Tabs, TextArea, TextField, toast } from "@heroui/react";
import { ArrowLeft, Copy } from "lucide-react";
import { useStaff } from "@/components/Shell";
import { ActionModal, Avatar, Empty, Loading, Segmented, StatusChip, useRun } from "@/components/ui";
import { ProgressPanel, ResetDialog } from "./progress";
import { ApiError, type Badge, type LedgerRow, useAdmin, useAdminAction } from "@/lib/api";
import { chips, dateTime, KIND_LABEL, signed } from "@/lib/format";

interface Detail extends Badge {
  /** Whether the casino name is their own (or staff's) pick, how often they picked one, and what the next costs them. */
  naming: { custom: boolean; changes: number; nextPrice: number };
  balance: number;
  bio: string | null;
  joinedAt: number;
  presence: { online: boolean; where: string | null; table: string | null };
  lastSeen: number | null;
  status: string;
  blockedReason: string | null;
  account: { status: string; until: number | null; reason: string | null };
  mutedUntil: number | null;
  limits: { lossLimit: number | null; excludedUntil: number | null; lossToday: number };
  lifetime: Record<string, number>;
  stats: Record<string, number>;
  achievements: number;
  friends: number;
  items: number;
  notes: { id: number; staff_name: string; body: string; created_at: number }[];
  ledger: LedgerRow[];
  audit: { id: number; staff_name: string; action: string; details: string; created_at: number }[];
}

type Sheet = "adjust" | "status" | "mute" | "limits" | "reset" | "name" | "password" | null;

const DAY = 86_400_000;

function describe(row: LedgerRow) {
  const base = KIND_LABEL[row.kind] ?? row.kind;
  if (row.kind === "game") return `${row.game === "roulette" ? "Roulette" : "Blackjack"} ${row.amount < 0 ? "bet" : "payout"}`;
  if (row.kind === "transfer_in") return `From ${row.counterparty_name ?? "a player"}`;
  if (row.kind === "transfer_out") return `To ${row.counterparty_name ?? "a player"}`;
  if (row.kind === "adjustment" || row.kind === "shop") return `${base}${row.ref ? ` · ${row.ref}` : ""}`;
  return base;
}

const toMs = (value: string) => (value ? new Date(`${value}T23:59:59`).getTime() : null);
const inDays = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

function AdjustDialog({ p, onClose }: { p: Detail; onClose: () => void }) {
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const { run, error, busy } = useRun(onClose);
  const value = Number(amount) || 0;

  return (
    <ActionModal
      title="Adjust chips"
      onClose={onClose}
      error={error}
      action={
        <Button
          isPending={busy}
          isDisabled={!value || reason.trim().length < 3}
          onPress={() => void run(`/players/${p.id}/adjust`, { amount: direction === "credit" ? value : -value, reason }, "Balance adjusted")}
        >
          {direction === "credit" ? `Credit ${chips(value)}` : `Debit ${chips(value)}`}
        </Button>
      }
    >
      <p className="text-default-500">
        {p.name} has {chips(p.balance)} chips. The change is recorded in their history and the audit log, and they get a notification.
      </p>
      <Segmented
        label="Direction"
        value={direction}
        onChange={setDirection}
        options={[
          ["credit", "Credit"],
          ["debit", "Debit"],
        ]}
      />
      <TextField value={amount} onChange={(v) => setAmount(v.replace(/\D/g, ""))} inputMode="numeric">
        <Label>Chips</Label>
        <Input placeholder="e.g. 1000" />
      </TextField>
      <TextField value={reason} onChange={setReason} maxLength={200}>
        <Label>Reason</Label>
        <Input placeholder="e.g. Refund for a lost connection mid-round" />
        <Description>The player sees this.</Description>
      </TextField>
    </ActionModal>
  );
}

function StatusDialog({ p, onClose }: { p: Detail; onClose: () => void }) {
  const [status, setStatus] = useState<"active" | "suspended" | "banned">(
    p.account.status === "banned" ? "banned" : p.status === "suspended" ? "suspended" : "active",
  );
  const [until, setUntil] = useState(inDays(7));
  const [reason, setReason] = useState(p.account.reason ?? "");
  const { run, error, busy } = useRun(onClose);

  return (
    <ActionModal
      title="Account status"
      onClose={onClose}
      error={error}
      action={
        <Button
          isPending={busy}
          variant={status === "active" ? "primary" : "danger"}
          onPress={() => void run(`/players/${p.id}/status`, { status, until: status === "suspended" ? toMs(until) : null, reason }, "Account updated")}
        >
          {status === "active" ? "Reactivate account" : status === "suspended" ? "Suspend account" : "Close account"}
        </Button>
      }
    >
      <Segmented
        label="Status"
        value={status}
        onChange={setStatus}
        options={[
          ["active", "Active"],
          ["suspended", "Suspended"],
          ["banned", "Closed"],
        ]}
      />
      <p className="text-default-500 text-sm">
        {status === "active"
          ? "The player can use the casino normally."
          : status === "suspended"
            ? "Blocks the casino and the tables until the date below. Chips are kept."
            : "Blocks the account until you reactivate it. Chips are kept."}
      </p>
      {status === "suspended" ? (
        <TextField value={until} onChange={setUntil} type="date">
          <Label>Until</Label>
          <Input min={inDays(1)} />
        </TextField>
      ) : null}
      {status !== "active" ? (
        <TextField value={reason} onChange={setReason} maxLength={200}>
          <Label>Reason</Label>
          <Input placeholder="e.g. Abusive chat" />
          <Description>The player sees this when they open the casino.</Description>
        </TextField>
      ) : null}
    </ActionModal>
  );
}

function MuteDialog({ p, onClose }: { p: Detail; onClose: () => void }) {
  const [until, setUntil] = useState(inDays(1));
  const [reason, setReason] = useState("");
  const { run, error, busy } = useRun(onClose);

  return (
    <ActionModal
      title={p.mutedUntil ? "Chat mute" : "Mute chat"}
      onClose={onClose}
      error={error}
      action={
        <>
          {p.mutedUntil ? (
            <Button variant="secondary" isPending={busy} onPress={() => void run(`/players/${p.id}/mute`, { until: null }, "Mute lifted")}>
              Lift mute
            </Button>
          ) : null}
          <Button isPending={busy} onPress={() => void run(`/players/${p.id}/mute`, { until: toMs(until), reason }, "Player muted")}>
            {p.mutedUntil ? "Change end date" : "Mute"}
          </Button>
        </>
      }
    >
      <p className="text-default-500 text-sm">Stops table chat and direct messages. Playing is not affected.</p>
      {p.mutedUntil ? <p className="text-sm">Muted until {dateTime(p.mutedUntil)}.</p> : null}
      <TextField value={until} onChange={setUntil} type="date">
        <Label>Until</Label>
        <Input />
      </TextField>
      <TextField value={reason} onChange={setReason} maxLength={200}>
        <Label>Note for the audit log</Label>
        <Input />
      </TextField>
    </ActionModal>
  );
}

function LimitsDialog({ p, onClose }: { p: Detail; onClose: () => void }) {
  const [limit, setLimit] = useState(p.limits.lossLimit?.toString() ?? "");
  const [excluded, setExcluded] = useState(p.limits.excludedUntil ? new Date(p.limits.excludedUntil).toISOString().slice(0, 10) : "");
  const [reason, setReason] = useState("");
  const { run, error, busy } = useRun(onClose);

  return (
    <ActionModal
      title="Responsible play"
      onClose={onClose}
      error={error}
      action={
        <Button
          isPending={busy}
          onPress={() =>
            void run(
              `/players/${p.id}/limits`,
              { lossLimit: limit === "" ? null : Number(limit), excludedUntil: excluded ? toMs(excluded) : null, reason },
              "Limits saved",
            )
          }
        >
          Save limits
        </Button>
      }
    >
      <TextField value={limit} onChange={(v) => setLimit(v.replace(/\D/g, ""))} inputMode="numeric">
        <Label>Daily loss limit (chips)</Label>
        <Input placeholder="No limit" />
        <Description>Bets that would take today&apos;s losses past this are refused. Lost today: {chips(p.limits.lossToday)}.</Description>
      </TextField>
      <TextField value={excluded} onChange={setExcluded} type="date">
        <Label>Break from play until</Label>
        <Input min={inDays(1)} />
        <Description>No bets until then. They can still sign in, chat and see their profile. Leave empty for none.</Description>
      </TextField>
      <TextField value={reason} onChange={setReason} maxLength={200}>
        <Label>Note for the audit log</Label>
        <Input placeholder="e.g. Requested by the player" />
      </TextField>
    </ActionModal>
  );
}

function NameDialog({ p, onClose }: { p: Detail; onClose: () => void }) {
  const [name, setName] = useState(p.name);
  const [reason, setReason] = useState("");
  const { run, error, busy } = useRun(onClose);
  const clean = name.trim();

  return (
    <ActionModal
      title="Casino name"
      onClose={onClose}
      error={error}
      action={
        <>
          {p.naming.custom ? (
            <Button variant="secondary" isPending={busy} onPress={() => void run(`/players/${p.id}/name/reset`, {}, "Name handed back to the account")}>
              Use account name
            </Button>
          ) : null}
          <Button isPending={busy} isDisabled={clean.length < 2 || clean === p.name} onPress={() => void run(`/players/${p.id}/name`, { name: clean, reason }, "Player renamed")}>
            Rename
          </Button>
        </>
      }
    >
      <p className="text-default-500 text-sm">
        {p.naming.custom ? "This name was picked in the casino." : "This is their Planary account name."} They&apos;ve changed it themselves{" "}
        {p.naming.changes} {p.naming.changes === 1 ? "time" : "times"}; their next change costs{" "}
        {p.naming.nextPrice ? `${chips(p.naming.nextPrice)} chips` : "nothing"}. A rename here is free and doesn&apos;t count toward that.
      </p>
      <TextField value={name} onChange={(v) => setName(v.slice(0, 24))} maxLength={24}>
        <Label>New name</Label>
        <Input />
        <Description>2–24 characters, and no other player may have it.</Description>
      </TextField>
      <TextField value={reason} onChange={setReason} maxLength={200}>
        <Label>Reason</Label>
        <Input placeholder="e.g. The old name broke the house rules" />
        <Description>The player sees this.</Description>
      </TextField>
    </ActionModal>
  );
}

function PasswordDialog({ p, onClose }: { p: Detail; onClose: () => void }) {
  const act = useAdminAction();
  const [result, setResult] = useState<{ link: string; expiresAt: number; mailed: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function make() {
    setBusy(true);
    setError(null);
    try {
      setResult(await act<{ link: string; expiresAt: number; mailed: boolean }>(`/players/${p.id}/password-reset`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActionModal
      title="Reset password"
      onClose={onClose}
      error={error}
      action={
        result ? (
          <Button onPress={() => void navigator.clipboard.writeText(result.link).then(() => toast("Link copied"))}>
            <Copy className="size-4" /> Copy link
          </Button>
        ) : (
          <Button isPending={busy} onPress={() => void make()}>
            Make reset link
          </Button>
        )
      }
    >
      {result ? (
        <>
          <p className="text-default-500 text-sm">
            {result.mailed ? "It was also mailed to the player. " : ""}Give this link to {p.name} only. It works once, until {dateTime(result.expiresAt)}, and
            lets them choose a new password. Any older reset link stops working.
          </p>
          <code className="bg-default-100 rounded-lg p-3 text-xs break-all select-all">{result.link}</code>
        </>
      ) : (
        <p className="text-default-500 text-sm">
          Makes a one-time link for {p.name}&apos;s Planary account, valid for 24 hours, where they choose a new password themselves. Nobody on staff sees or
          sets the password. Their current password keeps working until they use the link; then every device is signed out.
        </p>
      )}
    </ActionModal>
  );
}

function Stat({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-default-200 divide-y">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 py-2">
          <dt className="text-default-500 text-sm">{label}</dt>
          <dd className="num text-sm font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Notes({ p }: { p: Detail }) {
  const staff = useStaff();
  const [body, setBody] = useState("");
  const { run, error, busy } = useRun(() => setBody(""));
  return (
    <div className="grid gap-4">
      {staff.can("note") ? (
        <div className="grid gap-2">
          <TextArea
            aria-label="New note"
            className="min-h-24 w-full"
            maxLength={2000}
            placeholder="Internal note, only staff see it"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div>
            <Button size="sm" isPending={busy} isDisabled={!body.trim()} onPress={() => void run(`/players/${p.id}/notes`, { body }, "Note added")}>
              Add note
            </Button>
          </div>
          {error ? <p className="text-danger text-sm">{error}</p> : null}
        </div>
      ) : null}
      {p.notes.length === 0 ? (
        <Empty>No notes yet.</Empty>
      ) : (
        <ul className="grid gap-2">
          {p.notes.map((n) => (
            <li key={n.id} className="bg-default-100 grid gap-1 rounded-lg p-3">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <span className="text-default-500 text-xs">
                {n.staff_name} · {dateTime(n.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Ledger({ p }: { p: Detail }) {
  const [before, setBefore] = useState<number | null>(null);
  const { data } = useAdmin<{ entries: LedgerRow[] }>(before ? `/players/${p.id}/ledger?before=${before}` : null);
  const rows = before ? (data?.entries ?? []) : p.ledger;
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Chip history">
          <Table.Header>
            <Table.Column isRowHeader>When</Table.Column>
            <Table.Column>What</Table.Column>
            <Table.Column>Chips</Table.Column>
          </Table.Header>
          <Table.Body>
            {rows.map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell className="num text-default-500">{dateTime(r.created_at)}</Table.Cell>
                <Table.Cell>{describe(r)}</Table.Cell>
                <Table.Cell className={`num font-medium ${r.amount >= 0 ? "text-success" : ""}`}>{signed(r.amount)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <Table.Footer className="flex justify-end gap-2">
        {before ? (
          <Button size="sm" variant="secondary" onPress={() => setBefore(null)}>
            Newest
          </Button>
        ) : null}
        <Button size="sm" variant="secondary" isDisabled={rows.length < 50} onPress={() => setBefore(rows[rows.length - 1]?.id ?? null)}>
          Older
        </Button>
      </Table.Footer>
    </Table>
  );
}

function Messages({ p }: { p: Detail }) {
  const [partner, setPartner] = useState<Badge | null>(null);
  const { data: convos } = useAdmin<{ conversations: { with: Badge; count: number; last: number }[] }>(`/players/${p.id}/messages`);
  const { data: thread } = useAdmin<{ messages: { id: number; fromPlayer: boolean; body: string; at: number }[] }>(
    partner ? `/players/${p.id}/messages?with=${partner.id}` : null,
  );
  if (!convos) return <Loading />;
  if (!convos.conversations.length) return <Empty>{p.name} hasn&apos;t messaged anyone.</Empty>;
  return (
    <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
      <ul className="border-default-200 grid content-start gap-0.5 md:border-r md:pr-2">
        {convos.conversations.map((c) => (
          <li key={c.with.id}>
            <button
              className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm ${partner?.id === c.with.id ? "bg-default-100" : "hover:bg-default-100"}`}
              onClick={() => setPartner(c.with)}
            >
              <Avatar player={c.with} size="sm" />
              <span className="flex-1 truncate">{c.with.name}</span>
              <span className="text-default-500 text-xs">{c.count}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="grid max-h-[26rem] content-start gap-2 overflow-y-auto">
        {!partner ? (
          <p className="text-default-500">Pick a conversation. Opening one is recorded in the audit log.</p>
        ) : !thread ? (
          <Loading />
        ) : (
          thread.messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-lg p-2.5 ${m.fromPlayer ? "bg-accent-soft justify-self-end" : "bg-default-100"}`}>
              <span className="text-default-500 text-xs">
                {m.fromPlayer ? p.name : partner.name} · {dateTime(m.at)}
              </span>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const ACTION_LABEL: Record<string, string> = {
  "chips.adjust": "adjusted chips",
  "account.active": "reactivated the account",
  "account.suspended": "suspended the account",
  "account.banned": "closed the account",
  "chat.mute": "muted chat",
  "chat.unmute": "lifted the chat mute",
  "limits.set": "set limits",
  "avatar.remove": "removed the picture",
  "bio.remove": "removed the bio",
  "name.set": "renamed the player",
  "name.reset": "handed the name back to the account",
  "password.reset_link": "made a password reset link",
  "note.add": "added a note",
  "progress.achievements": "changed achievements",
  "progress.stats": "set counters",
  "account.reset": "reset the account",
  "messages.read": "read messages",
  "staff.set": "changed a staff role",
  "staff.remove": "removed staff access",
};

function summarise(details: string) {
  try {
    const d = JSON.parse(details) as Record<string, unknown>;
    return Object.entries(d)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => `${k}: ${typeof v === "number" && v > 1e12 ? new Date(v).toLocaleDateString("de-CH") : String(v)}`)
      .join(", ");
  } catch {
    return details;
  }
}

export default function PlayerPage({ params }: PageProps<"/players/[id]">) {
  const { id } = use(params);
  const staff = useStaff();
  const act = useAdminAction();
  const { data: p, error } = useAdmin<Detail>(`/players/${id}`, 30_000);
  const [modal, setModal] = useState<Sheet>(null);
  const [now] = useState(() => Date.now());

  if (error) return <Empty>{error.message}</Empty>;
  if (!p) return <Skeleton className="h-96 rounded-xl" />;

  const s = p.stats;
  const where = p.presence.online
    ? p.presence.where === "lobby"
      ? "In the lobby"
      : `At ${p.presence.where}${p.presence.table ? ` · ${p.presence.table}` : ""}`
    : "Offline";
  const remove = (what: "avatar" | "bio") =>
    void act(`/players/${p.id}/${what}/remove`).then(
      () => toast(what === "avatar" ? "Picture removed" : "Bio removed", { variant: "success" }),
      (e) => toast(e.message, { variant: "danger" }),
    );

  return (
    <>
      <Link href="/players" className="text-default-500 hover:text-foreground flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft className="size-4" /> Players
      </Link>

      <Card>
        <Card.Content className="flex w-full flex-row flex-wrap items-center gap-4 p-5">
          <Avatar player={p} size="lg" />
          <div className="min-w-[14rem] flex-1 grid gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusChip status={p.status} />
              {p.mutedUntil ? <StatusChip status="muted" /> : null}
              <Chip color={p.presence.online ? "success" : "default"}>{where}</Chip>
              {p.title ? <Chip>{p.title}</Chip> : null}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-default-500 w-fit font-mono text-xs"
              onPress={() => void navigator.clipboard.writeText(p.id).then(() => toast("Player ID copied"))}
            >
              <Copy className="size-3" /> {p.id}
            </Button>
          </div>
          <div className="text-right">
            <span className="text-default-500 text-sm">Balance</span>
            <div className="num text-3xl font-bold tracking-tight">{chips(p.balance)}</div>
          </div>
        </Card.Content>
      </Card>

      {p.blockedReason ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{p.blockedReason}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {staff.can("chips") ? <Button onPress={() => setModal("adjust")}>Adjust chips</Button> : null}
        {staff.can("restrict") ? (
          <>
            <Button variant="secondary" onPress={() => setModal("status")}>
              Account status
            </Button>
            <Button variant="secondary" onPress={() => setModal("limits")}>
              Responsible play
            </Button>
            <Button variant="secondary" onPress={() => setModal("password")}>
              Reset password
            </Button>
          </>
        ) : null}
        {staff.can("moderate") ? (
          <>
            <Button variant="secondary" onPress={() => setModal("mute")}>
              {p.mutedUntil ? "Chat mute" : "Mute chat"}
            </Button>
            <Button variant="secondary" onPress={() => setModal("name")}>
              Change name
            </Button>
            {p.avatar ? (
              <Button variant="danger-soft" onPress={() => remove("avatar")}>
                Remove picture
              </Button>
            ) : null}
            {p.bio ? (
              <Button variant="danger-soft" onPress={() => remove("bio")}>
                Remove bio
              </Button>
            ) : null}
          </>
        ) : null}
        {staff.can("reset") ? (
          <Button variant="danger" onPress={() => setModal("reset")}>
            Reset account
          </Button>
        ) : null}
        <HeroLink href={`https://casino.planary.ch/u/${p.id}`} target="_blank" rel="noreferrer" className="text-default-600 ml-auto self-center text-sm">
          Public profile
          <HeroLink.Icon />
        </HeroLink>
      </div>

      <Card>
        <Tabs defaultSelectedKey="summary">
          <Tabs.ListContainer className="px-3">
            <Tabs.List aria-label="Player details">
              <Tabs.Tab id="summary">
                Summary
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="ledger">
                Chip history
                <Tabs.Indicator />
              </Tabs.Tab>
              {staff.can("moderate") ? (
                <Tabs.Tab id="messages">
                  Messages
                  <Tabs.Indicator />
                </Tabs.Tab>
              ) : null}
              <Tabs.Tab id="notes">
                Notes{p.notes.length ? ` (${p.notes.length})` : ""}
                <Tabs.Indicator />
              </Tabs.Tab>
              {staff.can("reset") ? (
                <Tabs.Tab id="progress">
                  Progress
                  <Tabs.Indicator />
                </Tabs.Tab>
              ) : null}
              <Tabs.Tab id="activity">
                Staff activity
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="summary" className="grid gap-6 p-5 lg:grid-cols-3">
            <section>
              <h2 className="text-default-500 mb-1 text-xs font-semibold tracking-wide uppercase">Money in and out</h2>
              <Stat
                rows={[
                  ["Wagered", chips(p.lifetime.wagered)],
                  ["Won back", chips(p.lifetime.won)],
                  ["Net at the tables", <span key="net" className={p.lifetime.net >= 0 ? "text-success" : "text-danger"}>{signed(p.lifetime.net)}</span>],
                  ["Free chips", chips(p.lifetime.free)],
                  ["Received / sent", `${chips(p.lifetime.received)} / ${chips(p.lifetime.sent)}`],
                  ["Spent in shop", chips(p.lifetime.shop)],
                  ["Staff adjustments", signed(p.lifetime.adjustments)],
                ]}
              />
            </section>
            <section>
              <h2 className="text-default-500 mb-1 text-xs font-semibold tracking-wide uppercase">Play</h2>
              <Stat
                rows={[
                  ["Blackjack rounds", chips(s.bj_hands ?? 0)],
                  ["Blackjacks", chips(s.bj_naturals ?? 0)],
                  ["Roulette spins", chips(s.roulette_spins ?? 0)],
                  ["Best round", signed(s.best_round ?? 0)],
                  ["Achievements", p.achievements],
                  ["Friends", p.friends],
                  ["Cosmetics owned", p.items],
                ]}
              />
            </section>
            <section>
              <h2 className="text-default-500 mb-1 text-xs font-semibold tracking-wide uppercase">Account</h2>
              <Stat
                rows={[
                  ["Joined", dateTime(p.joinedAt)],
                  ["Last seen", dateTime(p.lastSeen)],
                  ["Daily loss limit", p.limits.lossLimit === null ? "None" : chips(p.limits.lossLimit)],
                  ["Lost today", chips(p.limits.lossToday)],
                  ["Break until", p.limits.excludedUntil && p.limits.excludedUntil > now ? dateTime(p.limits.excludedUntil) : "—"],
                  ["Chat muted until", p.mutedUntil ? dateTime(p.mutedUntil) : "—"],
                ]}
              />
              {p.bio ? (
                <>
                  <Separator className="my-3" />
                  <p className="text-default-600 border-default-300 border-l-2 pl-3 italic">“{p.bio}”</p>
                </>
              ) : null}
            </section>
          </Tabs.Panel>

          <Tabs.Panel id="ledger">
            <Ledger p={p} />
          </Tabs.Panel>

          {staff.can("moderate") ? (
            <Tabs.Panel id="messages" className="p-5">
              <Messages p={p} />
            </Tabs.Panel>
          ) : null}

          <Tabs.Panel id="notes" className="p-5">
            <Notes p={p} />
          </Tabs.Panel>

          {staff.can("reset") ? (
            <Tabs.Panel id="progress" className="p-5">
              <ProgressPanel playerId={p.id} />
            </Tabs.Panel>
          ) : null}

          <Tabs.Panel id="activity" className="p-5">
            {p.audit.length === 0 ? (
              <Empty>No staff actions on this player yet.</Empty>
            ) : (
              <ul className="divide-default-200 divide-y">
                {p.audit.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span>
                      <strong>{a.staff_name}</strong> {ACTION_LABEL[a.action] ?? a.action}
                      {a.details && a.details !== "null" ? <span className="text-default-500 text-sm"> · {summarise(a.details)}</span> : null}
                    </span>
                    <span className="text-default-500 num text-sm">{dateTime(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Tabs.Panel>
        </Tabs>
      </Card>

      {modal === "adjust" ? <AdjustDialog p={p} onClose={() => setModal(null)} /> : null}
      {modal === "status" ? <StatusDialog p={p} onClose={() => setModal(null)} /> : null}
      {modal === "mute" ? <MuteDialog p={p} onClose={() => setModal(null)} /> : null}
      {modal === "limits" ? <LimitsDialog p={p} onClose={() => setModal(null)} /> : null}
      {modal === "reset" ? <ResetDialog playerId={p.id} name={p.name} onClose={() => setModal(null)} /> : null}
      {modal === "name" ? <NameDialog p={p} onClose={() => setModal(null)} /> : null}
      {modal === "password" ? <PasswordDialog p={p} onClose={() => setModal(null)} /> : null}
    </>
  );
}
