"use client";

import { useEffect, useState } from "react";
import { useStaff } from "@/components/Shell";
import { useToast } from "@/components/ui";
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
const FIELDS: { key: keyof Settings; label: string; help: string }[] = [
  { key: "starterChips", label: "Welcome chips", help: "Given once when a player first opens the casino." },
  { key: "dailyBonus", label: "Daily bonus", help: "Claimable once per Zurich day." },
  { key: "minTransfer", label: "Smallest transfer", help: "Minimum chips a player can send to a friend." },
];

function SettingsCard({ settings, defaults }: { settings: Settings; defaults: Settings }) {
  const staff = useStaff();
  const act = useAdminAction();
  const toast = useToast();
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, String(settings[f.key])])) as Record<keyof Settings, string>);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setForm(Object.fromEntries(FIELDS.map((f) => [f.key, String(settings[f.key])])) as Record<keyof Settings, string>), [settings]);
  const changed = FIELDS.some((f) => Number(form[f.key]) !== settings[f.key]);
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Chip settings</h2>
          <p>Changes apply to the whole casino within a minute.</p>
        </div>
      </div>
      <form
        className="card-body"
        style={{ display: "grid", gap: 14 }}
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          void act("/settings", Object.fromEntries(FIELDS.map((f) => [f.key, Number(form[f.key])]))).then(
            () => toast("Settings saved"),
            (err) => setError(err instanceof ApiError ? err.message : "That didn't work."),
          );
        }}
      >
        <div className="row">
          {FIELDS.map((f) => (
            <label key={f.key} className="field">
              <span>{f.label}</span>
              <input
                className="input num"
                inputMode="numeric"
                disabled={!staff.can("economy")}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value.replace(/\D/g, "") })}
              />
              <small>
                {f.help} Default {chips(defaults[f.key])}.
              </small>
            </label>
          ))}
        </div>
        {staff.can("economy") ? (
          <div>
            <button className="btn btn-primary" disabled={!changed}>
              Save settings
            </button>
          </div>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </section>
  );
}

function ItemRow({ item }: { item: Item }) {
  const staff = useStaff();
  const act = useAdminAction();
  const toast = useToast();
  const [price, setPrice] = useState(item.price?.toString() ?? "");
  useEffect(() => setPrice(item.price?.toString() ?? ""), [item.price]);
  const editable = staff.can("economy") && item.basePrice !== null;
  const save = (body: unknown, done: string) => act(`/shop/${item.id}`, body).then(() => toast(done), (e) => toast(e instanceof ApiError ? e.message : "That didn't work."));
  return (
    <tr>
      <td>
        <strong>{item.name}</strong>
        <div className="small muted">
          {KIND[item.kind]} · {item.tier}
          {item.reward ? " · achievement reward" : ""}
        </div>
      </td>
      <td className="r">
        {item.basePrice === null ? (
          <span className="muted">Not for sale</span>
        ) : editable ? (
          <input
            className="input num price-input"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            onBlur={() => {
              const next = Number(price);
              if (next && next !== item.price) void save({ price: next === item.basePrice ? null : next }, "Price saved");
            }}
            aria-label={`Price of ${item.name}`}
          />
        ) : (
          chips(item.price)
        )}
        {item.basePrice !== null && item.price !== item.basePrice ? <div className="small muted">list {chips(item.basePrice)}</div> : null}
      </td>
      <td className="r">{chips(item.owners)}</td>
      <td className="r">{chips(item.revenue)}</td>
      <td className="r">
        {item.basePrice === null ? null : staff.can("economy") ? (
          <label className="switch">
            <input type="checkbox" checked={item.enabled} onChange={(e) => void save({ enabled: e.target.checked }, e.target.checked ? "Back in the shop" : "Hidden from the shop")} />
            <span>{item.enabled ? "On sale" : "Hidden"}</span>
          </label>
        ) : item.enabled ? (
          "On sale"
        ) : (
          "Hidden"
        )}
      </td>
    </tr>
  );
}

export default function EconomyPage() {
  const { data } = useAdmin<{ settings: Settings; defaults: Settings; items: Item[] }>("/economy");
  if (!data) return <div className="card empty">Loading…</div>;
  const revenue = data.items.reduce((s, i) => s + i.revenue, 0);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Economy & shop</h1>
          <p>How many free chips come in, and what the shop takes back out.</p>
        </div>
      </div>
      <SettingsCard settings={data.settings} defaults={data.defaults} />
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Shop items</h2>
            <p>
              {chips(revenue)} chips spent in the shop so far. Hidden items stay with players who already own them. Price changes don&apos;t affect past purchases.
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Item</th>
                <th className="r">Price</th>
                <th className="r">Owners</th>
                <th className="r">Chips earned</th>
                <th className="r">Availability</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
