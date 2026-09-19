"use client";

import { Avatar as HeroAvatar, Chip, Spinner } from "@heroui/react";
import { avatarSrc, type Badge } from "@/lib/api";
import { initials } from "@/lib/format";

const SIZES = { xs: "size-5 text-[10px]", sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-16 text-lg" } as const;

export function Avatar({ player, size = "md" }: { player: Pick<Badge, "name" | "avatar">; size?: keyof typeof SIZES }) {
  const src = avatarSrc(player.avatar);
  return (
    <HeroAvatar className={`${SIZES[size]} shrink-0`}>
      {src ? <HeroAvatar.Image alt="" src={src} /> : null}
      <HeroAvatar.Fallback>{initials(player.name)}</HeroAvatar.Fallback>
    </HeroAvatar>
  );
}

/** Avatar, name and one line underneath: the way a player appears in every list. */
export function Who({ player, sub, size = "md" }: { player: Pick<Badge, "name" | "avatar">; sub?: React.ReactNode; size?: keyof typeof SIZES }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar player={player} size={size} />
      <div className="min-w-0 leading-tight">
        <div className="truncate font-medium">{player.name}</div>
        {sub ? <div className="text-default-500 truncate text-xs">{sub}</div> : null}
      </div>
    </div>
  );
}

const STATUS: Record<string, { label: string; color: "default" | "accent" | "success" | "warning" | "danger" }> = {
  active: { label: "Active", color: "success" },
  suspended: { label: "Suspended", color: "warning" },
  banned: { label: "Closed", color: "danger" },
  excluded: { label: "Taking a break", color: "accent" },
  muted: { label: "Muted", color: "warning" },
  online: { label: "Online", color: "success" },
  open: { label: "Open", color: "success" },
  maintenance: { label: "Maintenance", color: "warning" },
  owner: { label: "Owner", color: "accent" },
  manager: { label: "Manager", color: "accent" },
  support: { label: "Support", color: "success" },
  viewer: { label: "Viewer", color: "default" },
};

export function StatusChip({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, color: "default" as const };
  return <Chip color={s.color}>{s.label}</Chip>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="text-default-500 flex items-center justify-center gap-3 py-16" role="status">
      <Spinner size="sm" />
      {label}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-default-500 py-12 text-center">{children}</div>;
}

/** Daily bars around a zero line; days the players won drop below it. */
export function BarChart({ data, label }: { data: { day: string; value: number }[]; label: string }) {
  const w = 720;
  const h = 180;
  const padBottom = 22;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const span = max - min || 1;
  const inner = h - 10 - padBottom;
  const zero = 10 + (max / span) * inner;
  const bw = w / Math.max(1, data.length);
  const step = Math.ceil(data.length / 6);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" role="img" aria-label={label} preserveAspectRatio="none">
      <line x1="0" x2={w} y1={zero} y2={zero} className="stroke-default-300" strokeWidth="1" />
      {data.map((d, i) => {
        const bh = (Math.abs(d.value) / span) * inner;
        return (
          <rect
            key={d.day}
            x={i * bw + bw * 0.18}
            width={bw * 0.64}
            y={d.value >= 0 ? zero - bh : zero}
            height={Math.max(d.value === 0 ? 0 : 1, bh)}
            rx="2"
            className={d.value >= 0 ? "fill-accent" : "fill-danger"}
          >
            <title>{`${d.day}: ${d.value.toLocaleString("de-CH")}`}</title>
          </rect>
        );
      })}
      {data.map((d, i) =>
        i % step === 0 ? (
          <text key={`t${d.day}`} x={i * bw + bw / 2} y={h - 6} textAnchor="middle" className="fill-default-500 text-[10px]">
            {d.day.slice(5).split("-").reverse().join(".")}
          </text>
        ) : null,
      )}
    </svg>
  );
}
