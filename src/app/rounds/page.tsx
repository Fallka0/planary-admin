"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Input, Label, ListBox, Modal, Select, Skeleton, Table } from "@heroui/react";
import { ExternalLink, Lock, LockOpen } from "lucide-react";
import { Empty } from "@/components/ui";
import { type RoundDetail, type RoundRow, useAdmin } from "@/lib/api";
import { chips, dateTime, signed } from "@/lib/format";

const CASINO = "https://casino.planary.ch";
const dayStart = (value: string) => (value ? new Date(`${value}T00:00:00`).getTime() : 0);
const GAME_NAME: Record<string, string> = { blackjack: "Blackjack", roulette: "Roulette" };

function Picker({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <Select className="w-44" value={value} onChange={(v) => onChange(String(v))}>
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map(([id, text]) => (
            <ListBox.Item key={id} id={id} textValue={text}>
              {text}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/** Long hex is unreadable in a table; the ends are enough to compare two by eye. */
function short(hex: string | null) {
  if (!hex) return "—";
  return hex.length > 20 ? `${hex.slice(0, 8)}…${hex.slice(-8)}` : hex;
}

/** Cards come out of the archive as "Kspade"; a console should show K♠. */
const PIPS: Record<string, string> = { spade: "♠", heart: "♥", diamond: "♦", club: "♣" };
function card(raw: string) {
  const match = /^(\w+?)(spade|heart|diamond|club)$/.exec(raw);
  return match ? `${match[1]}${PIPS[match[2]]}` : raw;
}

const RESULT_TONE: Record<string, string> = { win: "text-success", blackjack: "text-success", push: "text-default-500", lose: "text-danger", bust: "text-danger" };

/**
 * One player's side of a round, in words rather than JSON.
 *
 * Support reads this far more often than anyone reads the raw log, and "K♠ Q♣
 * — 20, won" answers the question that raw JSON only contains. The JSON stays
 * one click away, because the readable version is a summary and a record is not.
 */
function PlayerSide({ game, detail }: { game: string; detail: Record<string, unknown> }) {
  if (game === "blackjack" && Array.isArray(detail.hands)) {
    const hands = detail.hands as { cards: string[]; bet: number; result: string; net: number; doubled: boolean }[];
    return (
      <ul className="grid gap-1">
        {hands.map((h, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            <span className="font-mono">{h.cards.map(card).join(" ")}</span>
            <span className="text-default-500">·</span>
            <span className={RESULT_TONE[h.result] ?? ""}>{h.result}</span>
            {h.doubled ? <span className="text-default-500">doubled</span> : null}
            <span className="text-default-500 num ml-auto">
              bet {chips(h.bet)} → {signed(h.net)}
            </span>
          </li>
        ))}
        {Number(detail.insurance) > 0 ? <li className="text-default-500 text-xs">Insurance {chips(Number(detail.insurance))}</li> : null}
      </ul>
    );
  }
  if (game === "roulette" && Array.isArray(detail.bets)) {
    const bets = detail.bets as { type: string; target: number[]; won: boolean }[];
    return (
      <ul className="flex flex-wrap gap-1.5">
        {bets.map((b, i) => (
          <li key={i} className={`rounded px-1.5 py-0.5 text-xs ${b.won ? "bg-success/15 text-success" : "bg-default-200 text-default-500"}`}>
            {b.type}
            {b.target.length > 0 ? ` ${b.target.join("/")}` : ""}
          </li>
        ))}
      </ul>
    );
  }
  return <pre className="text-default-600 overflow-x-auto text-xs whitespace-pre-wrap">{JSON.stringify(detail, null, 1)}</pre>;
}

function Seal({ proof }: { proof: RoundRow["proof"] }) {
  const open = Boolean(proof.serverSeed);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${open ? "text-success" : "text-default-500"}`}>
      {open ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
      {open ? "Open" : proof.kind === "shoe" ? "Shoe in play" : "Sealed"}
    </span>
  );
}

/** Everything the archive holds about one round, laid out for someone answering a question about it. */
function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useAdmin<RoundDetail>(`/rounds/${id}`);
  return (
    <Modal.Backdrop isOpen onOpenChange={(o) => !o && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[680px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{data ? `${GAME_NAME[data.game] ?? data.game} · ${data.outcome}` : "Round"}</Modal.Heading>
            <p className="text-default-500 font-mono text-xs">{id}</p>
          </Modal.Header>
          <Modal.Body className="grid gap-5">
            {!data ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <>
                <section className="grid gap-2">
                  <h3 className="text-default-500 text-xs font-semibold tracking-wide uppercase">At the table</h3>
                  <dl className="divide-default-200 divide-y text-sm">
                    {[
                      ["Table", data.tableId],
                      ["Started", dateTime(data.startedAt)],
                      ["Lasted", `${Math.max(1, Math.round((data.endedAt - data.startedAt) / 1000))} s`],
                      ["Wagered", chips(data.staked)],
                      ["Paid out", chips(data.returned)],
                      ["House result", signed(data.staked - data.returned)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 py-1.5">
                        <dt className="text-default-600">{k}</dt>
                        <dd className="num font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="grid gap-2">
                  <h3 className="text-default-500 text-xs font-semibold tracking-wide uppercase">Players</h3>
                  {data.players.length === 0 ? (
                    <p className="text-default-500 text-sm">Nobody was staked on this round.</p>
                  ) : (
                    <ul className="grid gap-2">
                      {data.players.map((p) => (
                        <li key={`${p.userId}-${p.seat}`} className="bg-default-100 grid gap-1 rounded-lg p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Link href={`/players/${p.userId}`} className="font-medium underline-offset-4 hover:underline">
                              {p.name ?? p.userId.slice(0, 8)}
                            </Link>
                            <span className={`num font-semibold ${p.returned - p.staked >= 0 ? "text-success" : "text-danger"}`}>
                              {signed(p.returned - p.staked)}
                            </span>
                          </div>
                          <PlayerSide game={data.game} detail={p.detail} />
                          <details className="text-default-500 text-xs">
                            <summary className="cursor-pointer">As recorded</summary>
                            <pre className="overflow-x-auto pt-1 whitespace-pre-wrap">{JSON.stringify(p.detail, null, 1)}</pre>
                          </details>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="grid gap-2">
                  <h3 className="text-default-500 text-xs font-semibold tracking-wide uppercase">How it was decided</h3>
                  <dl className="divide-default-200 divide-y text-sm">
                    {[
                      ["Commitment", short(data.proof.hash)],
                      ["Server seed", data.proof.serverSeed ? short(data.proof.serverSeed) : "sealed until the shoe is finished"],
                      ["Player seeds", data.proof.clientSeed || "none offered"],
                      [data.proof.kind === "shoe" ? "Shoe number" : "Spin number", String(data.proof.nonce)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 py-1.5">
                        <dt className="text-default-600">{k}</dt>
                        <dd className="font-mono text-xs break-all">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {data.log ? (
                    <pre className="bg-default-100 text-default-600 overflow-x-auto rounded-lg p-3 text-xs whitespace-pre-wrap">
                      {JSON.stringify(data.log, null, 1)}
                    </pre>
                  ) : null}
                </section>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex w-full flex-wrap items-center gap-2">
              {data?.proof.serverSeed ? (
                <a className="text-accent inline-flex items-center gap-1.5 text-sm underline underline-offset-4" href={`${CASINO}/verify?round=${id}`} target="_blank" rel="noreferrer">
                  Check it in the verifier <ExternalLink className="size-3.5" />
                </a>
              ) : (
                <span className="text-default-500 text-sm">The seed is published when the shoe is finished.</span>
              )}
              <Button variant="secondary" className="ml-auto" onPress={onClose}>
                Close
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function Rounds() {
  const params = useSearchParams();
  const [game, setGame] = useState("all");
  const [player, setPlayer] = useState(params.get("player") ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const query = new URLSearchParams({
    ...(game !== "all" ? { game } : {}),
    ...(player ? { player } : {}),
    ...(from ? { since: String(dayStart(from)) } : {}),
    ...(to ? { until: String(dayStart(to) + 86_400_000) } : {}),
    page: String(page),
  });
  const { data } = useAdmin<{ rounds: RoundRow[]; more: boolean }>(`/rounds?${query}`, 30_000);
  const reset = () => setPage(0);

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Game rounds</h1>
        <p className="text-default-500">
          Every hand and every spin, exactly as it was played. Records are written once and cannot be edited — a correction is a
          new record, never a changed one.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <Picker
          label="Game"
          value={game}
          onChange={(v) => {
            setGame(v);
            reset();
          }}
          options={[
            ["all", "All games"],
            ["blackjack", "Blackjack"],
            ["roulette", "Roulette"],
          ]}
        />
        <label className="grid gap-1.5 text-sm">
          <span className="text-default-600 font-medium">Player ID</span>
          <Input
            value={player}
            onChange={(e) => {
              setPlayer(e.target.value.trim());
              reset();
            }}
            placeholder="Paste a player ID"
            className="w-64"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-default-600 font-medium">From</span>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              reset();
            }}
            className="w-40"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-default-600 font-medium">To</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              reset();
            }}
            className="w-40"
          />
        </label>
      </div>

      {!data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : data.rounds.length === 0 ? (
        <Empty>No rounds match. Games archive a round the moment it is paid.</Empty>
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Game rounds" className="min-w-[860px]">
              <Table.Header>
                <Table.Column isRowHeader>When</Table.Column>
                <Table.Column>Game</Table.Column>
                <Table.Column>Outcome</Table.Column>
                <Table.Column>Players</Table.Column>
                <Table.Column>Wagered</Table.Column>
                <Table.Column>House</Table.Column>
                <Table.Column>Proof</Table.Column>
              </Table.Header>
              <Table.Body>
                {data.rounds.map((r) => (
                  <Table.Row key={r.id} onAction={() => setOpenId(r.id)} className="cursor-pointer">
                    <Table.Cell className="text-default-500 whitespace-nowrap">{dateTime(r.startedAt)}</Table.Cell>
                    <Table.Cell>{GAME_NAME[r.game] ?? r.game}</Table.Cell>
                    <Table.Cell className="font-medium">{r.outcome}</Table.Cell>
                    <Table.Cell className="num">{r.seats}</Table.Cell>
                    <Table.Cell className="num">{chips(r.staked)}</Table.Cell>
                    <Table.Cell className={`num ${r.staked - r.returned >= 0 ? "text-success" : "text-danger"}`}>{signed(r.staked - r.returned)}</Table.Cell>
                    <Table.Cell>
                      <Seal proof={r.proof} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          {page > 0 || data.more ? (
            <Table.Footer className="flex items-center justify-end gap-2">
              <span className="text-default-500 mr-auto text-sm">Page {page + 1}</span>
              <Button size="sm" variant="secondary" isDisabled={page === 0} onPress={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" isDisabled={!data.more} onPress={() => setPage(page + 1)}>
                Next
              </Button>
            </Table.Footer>
          ) : null}
        </Table>
      )}

      {openId ? <Detail id={openId} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}

export default function RoundsPage() {
  return (
    <Suspense fallback={null}>
      <Rounds />
    </Suspense>
  );
}
