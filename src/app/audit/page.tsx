"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Code, Label, ListBox, Select, Skeleton, Table } from "@heroui/react";
import { useStaff } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { useAdmin } from "@/lib/api";
import { dateTime } from "@/lib/format";

interface Entry {
  id: number;
  staff_name: string;
  action: string;
  target_id: string | null;
  target_name: string | null;
  details: Record<string, unknown> | null;
  created_at: number;
}

const GROUPS: [string, string][] = [
  ["all", "Everything"],
  ["chips", "Chips"],
  ["account", "Accounts"],
  ["chat", "Mutes"],
  ["limits", "Limits"],
  ["messages", "Message reads"],
  ["game", "Games"],
  ["settings", "Settings"],
  ["shop", "Shop"],
  ["announcement", "Announcements"],
  ["staff", "Staff"],
  ["progress", "Achievements and counters"],
  ["rounds", "Record retention"],
];

function detail(d: Record<string, unknown> | null) {
  if (!d) return "";
  return Object.entries(d)
    .filter(([k, v]) => v !== null && v !== "" && k !== "before" && k !== "after")
    .map(([k, v]) => `${k}: ${typeof v === "number" && v > 1e12 ? new Date(v).toLocaleDateString("de-CH") : typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

export default function AuditPage() {
  const staff = useStaff();
  const [action, setAction] = useState("all");
  const [stack, setStack] = useState<number[]>([]);
  const cursor = stack[stack.length - 1];
  const { data } = useAdmin<{ entries: Entry[]; more: boolean }>(
    staff.can("audit") ? `/audit?${new URLSearchParams({ ...(action !== "all" ? { action } : {}), ...(cursor ? { before: String(cursor) } : {}) })}` : null,
  );

  if (!staff.can("audit")) return <Empty>Your role can&apos;t see the audit log.</Empty>;

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="text-default-500">
          Every action that changes something, who did it and when — including the weekly sweep that deletes game records past their
          retention. Entries can&apos;t be edited or removed.
        </p>
      </header>

      <Select
        className="w-52"
        value={action}
        onChange={(v) => {
          setAction(String(v));
          setStack([]);
        }}
      >
        <Label>Filter</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {GROUPS.map(([value, label]) => (
              <ListBox.Item key={value} id={value} textValue={label}>
                {label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      {!data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : data.entries.length === 0 ? (
        <Empty>Nothing logged yet.</Empty>
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Audit log" className="min-w-[760px]">
              <Table.Header>
                <Table.Column isRowHeader>When</Table.Column>
                <Table.Column>Staff</Table.Column>
                <Table.Column>Action</Table.Column>
                <Table.Column>On</Table.Column>
                <Table.Column>Details</Table.Column>
              </Table.Header>
              <Table.Body>
                {data.entries.map((e) => (
                  <Table.Row key={e.id}>
                    <Table.Cell className="num text-default-500">{dateTime(e.created_at)}</Table.Cell>
                    <Table.Cell>{e.staff_name}</Table.Cell>
                    <Table.Cell>
                      <Code>{e.action}</Code>
                    </Table.Cell>
                    <Table.Cell>
                      {e.target_name ? (
                        <Link href={`/players/${e.target_id}`} className="text-accent font-medium hover:underline">
                          {e.target_name}
                        </Link>
                      ) : (
                        <span className="text-default-500">{e.target_id ?? "—"}</span>
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-default-500 text-sm">{detail(e.details)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          <Table.Footer className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" isDisabled={!stack.length} onPress={() => setStack(stack.slice(0, -1))}>
              Newer
            </Button>
            <Button size="sm" variant="secondary" isDisabled={!data.more} onPress={() => setStack([...stack, data.entries[data.entries.length - 1].id])}>
              Older
            </Button>
          </Table.Footer>
        </Table>
      )}
    </>
  );
}
