"use client";

import { useState } from "react";
import { Button, Card, Chip, Description, Input, Label, Skeleton, Table, TextField, toast } from "@heroui/react";
import { useStaff } from "@/components/CasinoStaff";
import { ApiError, useAdmin, useAdminAction } from "@/lib/api";
import { chips } from "@/lib/format";

interface Settings {
  starterChips: number;
  dailyBonus: number;
  minTransfer: number;
}
interface Item {
  id: string;
  kind: string;
  name: string;
  tier: string;
  reward: string | null;
  copies: number;
  owners: number;
  listings: number;
  lowest: number | null;
  sales: number;
  volume: number;
  fees: number;
}
interface CaseRow {
  id: string;
  name: string;
  price: number;
  items: number;
  opened: number;
  chips: number;
}

const KIND: Record<string, string> = { border: "Border", banner: "Banner", title: "Title", cardback: "Card back", chipset: "Chips" };
const TIER_COLOR: Record<string, "default" | "accent" | "success" | "warning"> = {
  common: "default",
  rare: "success",
  epic: "accent",
  legendary: "warning",
};
const FIELDS: { key: keyof Settings; label: string; help: string }[] = [
  { key: "starterChips", label: "Welcome chips", help: "Given once when a player first opens the casino." },
  { key: "dailyBonus", label: "Daily bonus", help: "Claimable once per Zurich day." },
  { key: "minTransfer", label: "Smallest transfer", help: "Minimum chips a player can send to a friend." },
];

function SettingsCard({ settings, defaults }: { settings: Settings; defaults: Settings }) {
  const staff = useStaff();
  const act = useAdminAction();
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, String(settings[f.key])])) as Record<keyof Settings, string>);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const changed = FIELDS.some((f) => Number(form[f.key]) !== settings[f.key]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await act("/settings", Object.fromEntries(FIELDS.map((f) => [f.key, Number(form[f.key])])));
      toast("Settings saved", { variant: "success" });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Chip settings</Card.Title>
        <Card.Description>Changes apply to the whole casino within a minute.</Card.Description>
      </Card.Header>
      <Card.Content className="grid w-full gap-4 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <TextField key={f.key} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v.replace(/\D/g, "") })} isDisabled={!staff.can("economy")}>
            <Label>{f.label}</Label>
            <Input inputMode="numeric" className="num" />
            <Description>
              {f.help} Default {chips(defaults[f.key])}.
            </Description>
          </TextField>
        ))}
      </Card.Content>
      {staff.can("economy") ? (
        <Card.Footer className="flex w-full flex-row items-center gap-3">
          <Button isDisabled={!changed} isPending={busy} onPress={() => void save()}>
            Save settings
          </Button>
          {error ? <span className="text-danger text-sm">{error}</span> : null}
        </Card.Footer>
      ) : null}
    </Card>
  );
}

function ItemRow({ item }: { item: Item }) {
  return (
    <Table.Row>
      <Table.Cell>
        <div className="font-medium">{item.name}</div>
        <div className="text-default-500 flex items-center gap-1.5 text-xs">
          {KIND[item.kind]}
          <Chip color={TIER_COLOR[item.tier] ?? "default"}>{item.tier}</Chip>
          {item.reward ? "achievement reward, not tradeable" : null}
        </div>
      </Table.Cell>
      <Table.Cell className="num">
        {chips(item.copies)}
        {item.copies !== item.owners ? <div className="text-default-500 text-xs">{chips(item.owners)} players</div> : null}
      </Table.Cell>
      <Table.Cell className="num">
        {item.listings ? (
          <>
            {chips(item.listings)}
            <div className="text-default-500 text-xs">from {chips(item.lowest)}</div>
          </>
        ) : (
          <span className="text-default-500">—</span>
        )}
      </Table.Cell>
      <Table.Cell className="num">{item.sales ? chips(item.sales) : <span className="text-default-500">—</span>}</Table.Cell>
      <Table.Cell className="num">{item.volume ? chips(item.volume) : <span className="text-default-500">—</span>}</Table.Cell>
    </Table.Row>
  );
}

export default function EconomyPage() {
  const { data } = useAdmin<{ settings: Settings; defaults: Settings; fee: number; cases: CaseRow[]; items: Item[] }>("/economy");
  if (!data) return <Skeleton className="h-96 rounded-xl" />;
  const opened = data.cases.reduce((s, c) => s + c.chips, 0);
  const fees = data.items.reduce((s, i) => s + i.fees, 0);
  const volume = data.items.reduce((s, i) => s + i.volume, 0);

  return (
    <>
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Economy &amp; market</h2>
        <p className="text-default-500">How many free chips come in, and what cases and the market take back out.</p>
      </header>

      <SettingsCard key={JSON.stringify(data.settings)} settings={data.settings} defaults={data.defaults} />

      <Card>
        <Card.Header>
          <Card.Title>Cases</Card.Title>
          <Card.Description>{chips(opened)} chips spent on cases so far, all paid into the bank.</Card.Description>
        </Card.Header>
        <Card.Content className="px-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Cases">
                <Table.Header>
                  <Table.Column isRowHeader>Case</Table.Column>
                  <Table.Column>Price</Table.Column>
                  <Table.Column>Items</Table.Column>
                  <Table.Column>Opened</Table.Column>
                  <Table.Column>Chips taken</Table.Column>
                </Table.Header>
                <Table.Body>
                  {data.cases.map((c) => (
                    <Table.Row key={c.id}>
                      <Table.Cell className="font-medium">{c.name}</Table.Cell>
                      <Table.Cell className="num">{chips(c.price)}</Table.Cell>
                      <Table.Cell className="num">{c.items}</Table.Cell>
                      <Table.Cell className="num">{chips(c.opened)}</Table.Cell>
                      <Table.Cell className="num">{chips(c.chips)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Items on the market</Card.Title>
          <Card.Description>
            {chips(volume)} chips have changed hands between players. The house keeps {Math.round(data.fee * 100)}% of each sale: {chips(fees)} so far,
            paid into the bank.
          </Card.Description>
        </Card.Header>
        <Card.Content className="px-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Items" className="min-w-[720px]">
                <Table.Header>
                  <Table.Column isRowHeader>Item</Table.Column>
                  <Table.Column>Copies</Table.Column>
                  <Table.Column>For sale</Table.Column>
                  <Table.Column>Sales</Table.Column>
                  <Table.Column>Volume</Table.Column>
                </Table.Header>
                <Table.Body>
                  {data.items.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>
    </>
  );
}
