"use client";

// Granting progress by hand, and clearing an account down to a clean slate.
//
// The rest of the player page reports what happened. This part writes it, which
// is why it is the only part behind the owner-only "reset" permission and the
// only one that makes you type a name out before it does anything.

import { useMemo, useState } from "react";
import { Button, Chip, Description, Input, Label, Separator, Switch, TextField } from "@heroui/react";
import { RotateCcw, Trash2 } from "lucide-react";
import { ActionModal, Check, Empty, Loading, Segmented, useRun } from "@/components/ui";
import { type AchievementRow, type Progress, type ResetArea, useAdmin } from "@/lib/api";
import { chips, dateTime } from "@/lib/format";

const CATEGORY: Record<string, string> = {
  blackjack: "Blackjack",
  roulette: "Roulette",
  grimoire: "Grimoire",
  chips: "Chips",
  social: "Social",
  collector: "Collector",
};

/** The badge's own weight, as the casino draws it. Grade 4 is the rare end. */
const GRADE = ["bg-default-300", "bg-default-400", "bg-accent", "bg-warning"];

type Pending = Record<string, boolean>;

// ── Achievements ─────────────────────────────────────

function AchievementRowView({ a, pending, onToggle }: { a: AchievementRow; pending: boolean | undefined; onToggle: () => void }) {
  const held = a.unlockedAt !== null;
  const granting = pending === true;
  const taking = pending === false;
  const ring = granting ? "ring-2 ring-success" : taking ? "ring-2 ring-danger" : "ring-0";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={pending !== undefined}
      className={`bg-default-50 hover:bg-default-100 flex w-full items-start gap-3 rounded-lg p-2.5 text-left ${ring}`}
    >
      <span className={`mt-1 size-2.5 shrink-0 rounded-full ${held ? GRADE[a.grade - 1] : "bg-default-200"}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{a.name}</span>
          {a.secret ? <Chip size="sm">Secret</Chip> : null}
          {a.rewards.map((r) => (
            <Chip key={r.id} size="sm" color="accent">
              {r.name}
            </Chip>
          ))}
        </span>
        <span className="text-default-500 block text-xs">{a.description}</span>
        {held ? <span className="text-default-400 block text-xs">Unlocked {dateTime(a.unlockedAt)}</span> : null}
      </span>
      <span className="shrink-0 text-xs font-medium">
        {granting ? <span className="text-success">Granting</span> : taking ? <span className="text-danger">Taking back</span> : held ? "Held" : "—"}
      </span>
    </button>
  );
}

function Achievements({ playerId, list, reload }: { playerId: string; list: AchievementRow[]; reload: () => void }) {
  const [pending, setPending] = useState<Pending>({});
  const [rewards, setRewards] = useState(true);
  const [silent, setSilent] = useState(false);
  const { run, error, busy } = useRun(() => {
    setPending({});
    reload();
  });

  const grant = Object.keys(pending).filter((id) => pending[id]);
  const revoke = Object.keys(pending).filter((id) => !pending[id]);
  const groups = useMemo(() => {
    const byCategory = new Map<string, AchievementRow[]>();
    for (const a of list) byCategory.set(a.category, [...(byCategory.get(a.category) ?? []), a]);
    return [...byCategory];
  }, [list]);

  /** Click once to flip it, twice to put it back. */
  function toggle(a: AchievementRow) {
    setPending((was) => {
      const next = { ...was };
      if (a.id in next) delete next[a.id];
      else next[a.id] = a.unlockedAt === null;
      return next;
    });
  }

  const all = (want: boolean) =>
    setPending(Object.fromEntries(list.filter((a) => (a.unlockedAt === null) === want).map((a) => [a.id, want])));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-default-500 flex-1 text-sm">
          Click an achievement to grant it or take it back. Nothing happens until you apply.
        </p>
        <Button size="sm" variant="secondary" onPress={() => all(true)}>
          Grant every locked one
        </Button>
        <Button size="sm" variant="secondary" onPress={() => all(false)}>
          Take them all back
        </Button>
      </div>

      {groups.map(([category, rows]) => (
        <section key={category} className="grid gap-1.5">
          <h3 className="text-default-500 text-xs font-semibold tracking-wide uppercase">{CATEGORY[category] ?? category}</h3>
          <div className="grid gap-1.5 md:grid-cols-2">
            {rows.map((a) => (
              <AchievementRowView key={a.id} a={a} pending={pending[a.id]} onToggle={() => toggle(a)} />
            ))}
          </div>
        </section>
      ))}

      <Separator />
      <div className="grid gap-3">
        <Switch isSelected={rewards} onChange={setRewards}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            Move the cosmetics with the badge
          </Switch.Content>
          <Description>
            A granted achievement hands out the cosmetic it unlocks; one taken back removes it again, unless the player also bought it in the shop.
          </Description>
        </Switch>
        <Switch isSelected={silent} onChange={setSilent}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            Don&apos;t notify the player
          </Switch.Content>
          <Description>Grants normally ring the bell in the casino, the same as earning one.</Description>
        </Switch>
      </div>

      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          isPending={busy}
          isDisabled={!grant.length && !revoke.length}
          onPress={() => void run(`/players/${playerId}/achievements`, { grant, revoke, rewards, silent }, "Achievements updated")}
        >
          {grant.length && revoke.length
            ? `Grant ${grant.length}, take back ${revoke.length}`
            : grant.length
              ? `Grant ${grant.length}`
              : revoke.length
                ? `Take back ${revoke.length}`
                : "Nothing selected"}
        </Button>
        {grant.length || revoke.length ? (
          <Button variant="tertiary" onPress={() => setPending({})}>
            Clear selection
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ── Counters ─────────────────────────────────────────

const NEW_KEY = /^[a-z][a-z0-9_]{1,38}$/;

function Counters({ playerId, data, reload }: { playerId: string; data: Progress; reload: () => void }) {
  const { fields, values, extra, computed, refused } = data.stats;
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<string[]>([]);
  const [newKey, setNewKey] = useState("");
  const [unlock, setUnlock] = useState(true);
  const { run, error, busy } = useRun(() => {
    setDraft({});
    setAdded([]);
    reload();
  });

  /** What the counter reads now. Empty means there is no row, which reads as zero everywhere. */
  const current = (key: string) => (key in values ? String(values[key]) : "");
  const shown = (key: string) => draft[key] ?? current(key);
  const set = (key: string, value: string) => setDraft((was) => ({ ...was, [key]: value.replace(/[^\d]/g, "") }));

  const changed = Object.keys(draft).filter((key) => draft[key] !== current(key));
  const changes = Object.fromEntries(changed.map((key) => [key, draft[key] === "" ? null : Number(draft[key])]));

  const row = (key: string, label: React.ReactNode, hint?: React.ReactNode) => (
    <div key={key} className="grid gap-1">
      <TextField value={shown(key)} onChange={(v) => set(key, v)} inputMode="numeric">
        <Label>{label}</Label>
        <Input placeholder="not set" aria-label={typeof label === "string" ? label : key} />
        {hint ? <Description>{hint}</Description> : null}
      </TextField>
    </div>
  );

  function addKey() {
    const key = newKey.trim().toLowerCase();
    if (!NEW_KEY.test(key) || refused[key]) return;
    setAdded((was) => (was.includes(key) || extra.includes(key) || fields.some((f) => f.key === key) ? was : [...was, key]));
    setDraft((was) => ({ ...was, [key]: was[key] ?? "" }));
    setNewKey("");
  }

  const others = [...extra, ...added];

  return (
    <div className="grid gap-5">
      <p className="text-default-500 text-sm">
        The counters behind every achievement&apos;s progress bar. Leave one empty to clear it; an absent counter reads as zero everywhere.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{fields.map((f) => row(f.key, f.label, f.hint))}</div>

      <section className="grid gap-2">
        <h3 className="text-default-500 text-xs font-semibold tracking-wide uppercase">Other counters</h3>
        <p className="text-default-500 text-sm">Anything a game server writes that this panel has no label for yet.</p>
        {others.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{others.map((key) => row(key, <code>{key}</code>))}</div> : null}
        <div className="flex flex-wrap items-end gap-2">
          <TextField className="w-64" value={newKey} onChange={(v) => setNewKey(v.replace(/[^a-z0-9_]/gi, "").toLowerCase())}>
            <Label>Counter name</Label>
            <Input placeholder="e.g. slots_spins" />
          </TextField>
          <Button size="sm" variant="secondary" isDisabled={!NEW_KEY.test(newKey.trim())} onPress={addKey}>
            Add
          </Button>
        </div>
      </section>

      <section className="grid gap-2">
        <h3 className="text-default-500 text-xs font-semibold tracking-wide uppercase">Counted live, not stored</h3>
        <dl className="divide-default-200 divide-y">
          {(
            [
              ["balance", "Balance", computed.balance],
              ["friends", "Friends", computed.friends],
              ["items", "Cosmetics owned", computed.items],
            ] as const
          ).map(([key, label, value]) => (
            <div key={key} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-sm">
                {label}
                <span className="text-default-500 block text-xs">{refused[key]}</span>
              </dt>
              <dd className="num text-sm font-semibold">{chips(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Separator />
      <Switch isSelected={unlock} onChange={setUnlock}>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          Unlock whatever these counters now earn
        </Switch.Content>
        <Description>
          Only achievements with a progress bar can be worked out from a counter. The rest are things that happened at a table — grant those on the
          Achievements tab.
        </Description>
      </Switch>

      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button isPending={busy} isDisabled={!changed.length} onPress={() => void run(`/players/${playerId}/stats`, { changes, unlock }, "Counters saved")}>
          {changed.length ? `Save ${changed.length} counter${changed.length === 1 ? "" : "s"}` : "Nothing changed"}
        </Button>
        {changed.length ? (
          <Button
            variant="tertiary"
            onPress={() => {
              setDraft({});
              setAdded([]);
            }}
          >
            <RotateCcw className="size-4" /> Discard changes
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ── The tab ──────────────────────────────────────────

export function ProgressPanel({ playerId }: { playerId: string }) {
  const { data, error, reload } = useAdmin<Progress>(`/players/${playerId}/progress`);
  const [tab, setTab] = useState<"achievements" | "counters">("achievements");
  if (error) return <Empty>{error.message}</Empty>;
  if (!data) return <Loading />;
  return (
    <div className="grid gap-5">
      <div className="max-w-sm">
        <Segmented
          label="What to edit"
          value={tab}
          onChange={setTab}
          options={[
            ["achievements", "Achievements"],
            ["counters", "Counters"],
          ]}
        />
      </div>
      {tab === "achievements" ? (
        <Achievements playerId={playerId} list={data.achievements} reload={reload} />
      ) : (
        <Counters playerId={playerId} data={data} reload={reload} />
      )}
    </div>
  );
}

// ── Reset ────────────────────────────────────────────

export function ResetDialog({ playerId, name, onClose }: { playerId: string; name: string; onClose: () => void }) {
  const { data } = useAdmin<Progress>(`/players/${playerId}/progress`);
  const areas = data?.reset.areas ?? [];
  const [picked, setPicked] = useState<Record<string, boolean> | null>(null);
  const [opening, setOpening] = useState<"starter" | "zero" | "keep">("starter");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tell, setTell] = useState(true);
  const { run, error, busy } = useRun(onClose);

  // Pre-ticked the first time the areas arrive: the three that make up a cooked history.
  const chosen = picked ?? Object.fromEntries(areas.map((a: ResetArea) => [a.id, a.recommended]));
  const selected = Object.keys(chosen).filter((id) => chosen[id]);
  const ready = selected.length > 0 && reason.trim().length >= 3 && confirm.trim().toLowerCase() === name.toLowerCase();

  return (
    <ActionModal
      title="Reset account"
      wide
      onClose={onClose}
      error={error}
      action={
        <Button
          variant="danger"
          isPending={busy}
          isDisabled={!ready}
          onPress={() => void run(`/players/${playerId}/reset`, { areas: selected, opening, reason, confirm, notifyPlayer: tell }, "Account reset")}
        >
          <Trash2 className="size-4" /> Reset account
        </Button>
      }
    >
      {!data ? (
        <Loading />
      ) : (
        <>
          <p className="text-default-500 text-sm">
            Clears what the casino says about {name} and cannot be undone. The game round archive is never touched: those records are written once, and a
            blackjack round belongs to everyone who sat at the table.
          </p>

          <div className="grid gap-2.5">
            {areas.map((a: ResetArea) => (
              <Check
                key={a.id}
                isSelected={Boolean(chosen[a.id])}
                onChange={(v) => setPicked({ ...chosen, [a.id]: v })}
                label={a.label}
                hint={a.detail}
              />
            ))}
          </div>

          {chosen.chips ? (
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Balance afterwards</h3>
              <Segmented
                label="Balance afterwards"
                value={opening}
                onChange={setOpening}
                options={[
                  ["starter", `Starter (${chips(data.reset.starterChips)})`],
                  ["zero", "Nothing"],
                  ["keep", `Keep (${chips(data.reset.balance)})`],
                ]}
              />
              <p className="text-default-500 text-xs">
                Whatever is left is written as one opening row in the chip history, so the figures still add up.
              </p>
            </div>
          ) : null}

          <TextField value={reason} onChange={setReason} maxLength={200}>
            <Label>Reason</Label>
            <Input placeholder="e.g. Clearing out test chip adjustments" />
            <Description>Kept with the reset in the audit log, and shown to the player if you tell them.</Description>
          </TextField>

          <Check isSelected={tell} onChange={setTell} label="Tell the player" hint="A notification in the casino, with the reason." />

          <TextField value={confirm} onChange={setConfirm}>
            <Label>Type {name} to confirm</Label>
            <Input placeholder={name} autoComplete="off" />
          </TextField>
        </>
      )}
    </ActionModal>
  );
}
