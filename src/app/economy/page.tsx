"use client";

import { useState } from "react";
import { Button, Card, Chip, Description, Input, Label, Skeleton, Switch, Table, TextField, toast } from "@heroui/react";
import { useStaff } from "@/components/Shell";
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
  basePrice: number | null;
  price: number | null;
  enabled: boolean;
  reward?: string;
  owners: number;
  revenue: number;
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
  const staff = useStaff();
  const act = useAdminAction();
  const [price, setPrice] = useState(item.price?.toString() ?? "");
  const editable = staff.can("economy") && item.basePrice !== null;
  const save = (body: unknown, done: string) =>
    act(`/shop/${item.id}`, body).then(
      () => toast(done, { variant: "success" }),
      (e) => toast(e instanceof ApiError ? e.message : "That didn't work.", { variant: "danger" }),
    );

  return (
    <Table.Row>
      <Table.Cell>
        <div className="font-medium">{item.name}</div>
        <div className="text-default-500 flex items-center gap-1.5 text-xs">
          {KIND[item.kind]}
          <Chip color={TIER_COLOR[item.tier] ?? "default"}>{item.tier}</Chip>
          {item.reward ? "achievement reward" : null}
        </div>
      </Table.Cell>
      <Table.Cell>
        {item.basePrice === null ? (
          <span className="text-default-500">Not for sale</span>
        ) : editable ? (
          <Input
            aria-label={`Price of ${item.name}`}
            className="num w-28"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            onBlur={() => {
              const next = Number(price);
              if (next && next !== item.price) void save({ price: next === item.basePrice ? null : next }, "Price saved");
            }}
          />
        ) : (
          <span className="num">{chips(item.price)}</span>
        )}
        {item.basePrice !== null && item.price !== item.basePrice ? <div className="text-default-500 text-xs">list {chips(item.basePrice)}</div> : null}
      </Table.Cell>
      <Table.Cell className="num">{chips(item.owners)}</Table.Cell>
      <Table.Cell className="num">{chips(item.revenue)}</Table.Cell>
      <Table.Cell>
        {item.basePrice === null ? null : staff.can("economy") ? (
          <Switch isSelected={item.enabled} onChange={(on: boolean) => void save({ enabled: on }, on ? "Back in the shop" : "Hidden from the shop")}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              {item.enabled ? "On sale" : "Hidden"}
            </Switch.Content>
          </Switch>
        ) : (
          <span className="text-default-500">{item.enabled ? "On sale" : "Hidden"}</span>
        )}
      </Table.Cell>
    </Table.Row>
  );
}

export default function EconomyPage() {
  const { data } = useAdmin<{ settings: Settings; defaults: Settings; items: Item[] }>("/economy");
  if (!data) return <Skeleton className="h-96 rounded-xl" />;
  const revenue = data.items.reduce((s, i) => s + i.revenue, 0);

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Economy &amp; shop</h1>
        <p className="text-default-500">How many free chips come in, and what the shop takes back out.</p>
      </header>

      <SettingsCard key={JSON.stringify(data.settings)} settings={data.settings} defaults={data.defaults} />

      <Card>
        <Card.Header>
          <Card.Title>Shop items</Card.Title>
          <Card.Description>
            {chips(revenue)} chips spent in the shop so far. Hidden items stay with players who already own them, and price changes never touch past
            purchases.
          </Card.Description>
        </Card.Header>
        <Card.Content className="px-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Shop items" className="min-w-[720px]">
                <Table.Header>
                  <Table.Column isRowHeader>Item</Table.Column>
                  <Table.Column>Price</Table.Column>
                  <Table.Column>Owners</Table.Column>
                  <Table.Column>Chips earned</Table.Column>
                  <Table.Column>Availability</Table.Column>
                </Table.Header>
                <Table.Body>
                  {data.items.map((item) => (
                    <ItemRow key={`${item.id}:${item.price}:${item.enabled}`} item={item} />
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
