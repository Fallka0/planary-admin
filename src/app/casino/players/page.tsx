"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Chip, Label, ListBox, SearchField, Select, Skeleton, Table } from "@heroui/react";
import { Empty, StatusChip, Who } from "@/components/ui";
import { type Badge, useAdmin } from "@/lib/api";
import { ago, chips, date } from "@/lib/format";

interface Row extends Badge {
  balance: number;
  status: string;
  muted: boolean;
  online: boolean;
  lastSeen: number | null;
  joinedAt: number;
}

const FILTERS: [string, string][] = [
  ["all", "All"],
  ["online", "Online"],
  ["restricted", "Restricted"],
  ["muted", "Muted"],
];

const SORTS: [string, string][] = [
  ["recent", "Last seen"],
  ["balance", "Balance"],
  ["joined", "Newest"],
  ["name", "Name"],
];

function Players() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(0);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const next = params.get("q") ?? "";
    setQ(next);
    setQuery(next);
    setPage(0);
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(q.trim());
      setPage(0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  const { data } = useAdmin<{ players: Row[]; more: boolean; page: number }>(
    `/players?q=${encodeURIComponent(query)}&status=${status}&sort=${sort}&page=${page}`,
    30_000,
  );

  return (
    <>
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Players</h2>
        <p className="text-default-500">Search, then open a player to see their history, adjust chips or restrict the account.</p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <SearchField aria-label="Search players" value={q} onChange={setQ} className="min-w-56 flex-1">
          <Label className="sr-only">Search players</Label>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Name or player ID" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <div role="group" aria-label="Filter" className="bg-default-100 flex gap-0.5 rounded-lg p-0.5">
          {FILTERS.map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={status === value ? "secondary" : "ghost"}
              aria-pressed={status === value}
              onPress={() => {
                setStatus(value);
                setPage(0);
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        <Select
          className="w-44"
          value={sort}
          onChange={(value) => {
            setSort(String(value));
            setPage(0);
          }}
        >
          <Label className="sr-only">Sort by</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {SORTS.map(([value, label]) => (
                <ListBox.Item key={value} id={value} textValue={label}>
                  {label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {!data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : data.players.length === 0 ? (
        <Empty>No players match.</Empty>
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Players" className="min-w-[720px]">
              <Table.Header>
                <Table.Column isRowHeader>Player</Table.Column>
                <Table.Column>Status</Table.Column>
                <Table.Column>Balance</Table.Column>
                <Table.Column>Last seen</Table.Column>
                <Table.Column>Joined</Table.Column>
              </Table.Header>
              <Table.Body>
                {data.players.map((p) => (
                  <Table.Row key={p.id}>
                    <Table.Cell>
                      <Link href={`/casino/players/${p.id}`} className="rounded-lg outline-offset-4">
                        <Who player={p} sub={p.title ?? p.id.slice(0, 8)} />
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusChip status={p.status} />
                        {p.muted ? <StatusChip status="muted" /> : null}
                        {p.online ? <Chip color="success">Online</Chip> : null}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="num font-medium">{chips(p.balance)}</Table.Cell>
                    <Table.Cell className="text-default-500">{ago(p.lastSeen, now)}</Table.Cell>
                    <Table.Cell className="text-default-500">{date(p.joinedAt)}</Table.Cell>
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
    </>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={null}>
      <Players />
    </Suspense>
  );
}
