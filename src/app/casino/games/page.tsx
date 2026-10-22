"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, Chip, Description, Input, Label, Link as HeroLink, Modal, Skeleton, Table, TextField, toast } from "@heroui/react";
import { useStaff } from "@/components/CasinoStaff";
import { Avatar, StatusChip } from "@/components/ui";
import { ApiError, type Badge, type Figures, useAdmin, useAdminAction } from "@/lib/api";
import { chips, pct, signed } from "@/lib/format";

interface Game {
  game: string;
  status: "open" | "maintenance";
  note: string | null;
  theoretical: number;
  today: Figures;
  week: Figures;
  month: Figures;
  tables: { id: string; players: Badge[] }[];
}

const NAME: Record<string, string> = { blackjack: "Blackjack", roulette: "Roulette" };
const HOST: Record<string, string> = { blackjack: "https://21.planary.ch", roulette: "https://roulette.planary.ch" };
const RULES: Record<string, string> = {
  blackjack: "6 decks, dealer stands on all 17s, blackjack 3:2, insurance 2:1, split to 4 hands.",
  roulette: "European single zero. Straight 35:1 down to even money 1:1.",
};

function StatusDialog({ g, onClose }: { g: Game; onClose: () => void }) {
  const act = useAdminAction();
  const closing = g.status === "open";
  const [note, setNote] = useState(g.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await act(`/games/${g.game}`, { status: closing ? "maintenance" : "open", note: closing ? note : "" });
      toast(closing ? `${NAME[g.game]} closed` : `${NAME[g.game]} reopened`, { variant: "success" });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "That didn't work.");
      setBusy(false);
    }
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(open: boolean) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[440px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{closing ? `Close ${NAME[g.game]}` : `Reopen ${NAME[g.game]}`}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="grid gap-4">
            {closing ? (
              <>
                <p className="text-default-500">Rounds already dealt finish normally. After that, new bets are refused with the message below.</p>
                <TextField value={note} onChange={setNote} maxLength={200}>
                  <Label>Message for players</Label>
                  <Input placeholder="This game is closed for maintenance. Try again soon." />
                  <Description>Leave empty to use the default message.</Description>
                </TextField>
              </>
            ) : (
              <p className="text-default-500">Players can bet again right away.</p>
            )}
            {error ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={onClose}>
              Cancel
            </Button>
            <Button variant={closing ? "danger" : "primary"} isPending={busy} onPress={() => void save()}>
              {closing ? "Close for maintenance" : "Reopen"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function Row({ label, f }: { label: string; f: Figures }) {
  return (
    <Table.Row>
      <Table.Cell>{label}</Table.Cell>
      <Table.Cell className="num">{chips(f.handle)}</Table.Cell>
      <Table.Cell className="num">{chips(f.bets)}</Table.Cell>
      <Table.Cell className="num">{chips(f.players)}</Table.Cell>
      <Table.Cell className={`num font-medium ${f.ggr >= 0 ? "text-success" : "text-danger"}`}>{signed(f.ggr)}</Table.Cell>
      <Table.Cell className="num">{pct(f.rtp)}</Table.Cell>
    </Table.Row>
  );
}

export default function GamesPage() {
  const staff = useStaff();
  const { data } = useAdmin<{ games: Game[] }>("/games", 15_000);
  const [editing, setEditing] = useState<Game | null>(null);

  return (
    <>
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Games</h2>
        <p className="text-default-500">Status, results against the expected return, and who is at a table right now.</p>
      </header>

      {!data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        data.games.map((g) => (
          <Card key={g.game}>
            <Card.Header>
              <div className="flex w-full flex-wrap items-start justify-between gap-3">
              <div>
                <Card.Title className="flex items-center gap-2">
                  {NAME[g.game]} <StatusChip status={g.status} />
                </Card.Title>
                <Card.Description>{g.status === "maintenance" && g.note ? `Players see: “${g.note}”` : RULES[g.game]}</Card.Description>
              </div>
              <div className="flex items-center gap-3">
                <HeroLink href={HOST[g.game]} target="_blank" rel="noreferrer" className="text-default-600 text-sm">
                  Open game
                  <HeroLink.Icon />
                </HeroLink>
                {staff.can("games") ? (
                  <Button size="sm" variant={g.status === "open" ? "danger-soft" : "primary"} onPress={() => setEditing(g)}>
                    {g.status === "open" ? "Close for maintenance" : "Reopen"}
                  </Button>
                ) : null}
              </div>
              </div>
            </Card.Header>
            <Card.Content className="px-0">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label={`${NAME[g.game]} figures`} className="min-w-[640px]">
                    <Table.Header>
                      <Table.Column isRowHeader>Period</Table.Column>
                      <Table.Column>Wagered</Table.Column>
                      <Table.Column>Bets</Table.Column>
                      <Table.Column>Players</Table.Column>
                      <Table.Column>House result</Table.Column>
                      <Table.Column>RTP (expected {pct(g.theoretical)})</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      <Row label="Today" f={g.today} />
                      <Row label="7 days" f={g.week} />
                      <Row label="30 days" f={g.month} />
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </Card.Content>
            <Card.Footer className="grid w-full gap-2">
              <h3 className="text-default-500 text-xs font-semibold tracking-wide uppercase">Live now</h3>
              {g.tables.length === 0 ? (
                <p className="text-default-500 text-sm">Nobody is playing right now.</p>
              ) : (
                <ul className="grid gap-2">
                  {g.tables.map((t) => (
                    <li key={t.id} className="bg-default-100 grid gap-1.5 rounded-lg p-3">
                      <span className="text-default-500 text-xs">
                        {t.id === "lobby" ? "In the lobby" : `Table ${t.id}${t.id.startsWith("p-") ? " (private)" : ""}`}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        {t.players.map((pl) => (
                          <Link key={pl.id} href={`/casino/players/${pl.id}`}>
                            <Chip>
                              <Avatar player={pl} size="xs" /> {pl.name}
                            </Chip>
                          </Link>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Footer>
          </Card>
        ))
      )}
      {editing ? <StatusDialog g={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}
