"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { avatarSrc, type Badge } from "@/lib/api";
import { initials } from "@/lib/format";

export function Avatar({ player, size = 32 }: { player: Pick<Badge, "name" | "avatar">; size?: number }) {
  const src = avatarSrc(player.avatar);
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }} aria-hidden="true">
      {src ? <img src={src} alt="" width={size} height={size} loading="lazy" /> : initials(player.name)}
    </span>
  );
}

export function Who({ player, sub }: { player: Pick<Badge, "name" | "avatar">; sub?: React.ReactNode }) {
  return (
    <span className="who">
      <Avatar player={player} />
      <span className="who-copy">
        <strong>{player.name}</strong>
        {sub ? <span>{sub}</span> : null}
      </span>
    </span>
  );
}

const STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: "Active", tone: "good" },
  suspended: { label: "Suspended", tone: "warn" },
  banned: { label: "Closed", tone: "bad" },
  excluded: { label: "Taking a break", tone: "info" },
  muted: { label: "Muted", tone: "warn" },
  open: { label: "Open", tone: "good" },
  maintenance: { label: "Maintenance", tone: "warn" },
  owner: { label: "Owner", tone: "accent" },
  manager: { label: "Manager", tone: "info" },
  support: { label: "Support", tone: "good" },
  viewer: { label: "Viewer", tone: "" },
};

export function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "" };
  return (
    <span className={`pill${s.tone ? ` pill-${s.tone}` : ""}`}>
      <span className="dot" aria-hidden="true" />
      {s.label}
    </span>
  );
}

/** A modal form. Focus goes to the first field; Escape and the backdrop close it. */
export function Dialog({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button:not(.dialog-x)")?.focus();
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="card dialog" role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="card-head">
          <h2 id={id}>{title}</h2>
          <button className="btn btn-ghost icon-btn dialog-x" onClick={onClose} aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        <div className="dialog-foot">{footer}</div>
      </div>
    </div>
  );
}

const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((m: string) => setMessage(m), []);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <div className="toast" role="status">
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

/** Daily bars around a zero line; negative days drop below it. */
export function BarChart({ data, label }: { data: { day: string; value: number }[]; label: string }) {
  const w = 720;
  const h = 180;
  const pad = { top: 10, bottom: 22, left: 0, right: 0 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const span = max - min || 1;
  const inner = h - pad.top - pad.bottom;
  const zero = pad.top + (max / span) * inner;
  const bw = w / Math.max(1, data.length);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label={label} preserveAspectRatio="none">
      <line x1="0" x2={w} y1={zero} y2={zero} className="axis" />
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
            className={d.value >= 0 ? "bar-pos" : "bar-neg"}
          >
            <title>{`${d.day}: ${d.value.toLocaleString("de-CH")}`}</title>
          </rect>
        );
      })}
      {data.map((d, i) =>
        i % Math.ceil(data.length / 6) === 0 ? (
          <text key={`t${d.day}`} x={i * bw + bw / 2} y={h - 6} textAnchor="middle">
            {d.day.slice(5).split("-").reverse().join(".")}
          </text>
        ) : null,
      )}
    </svg>
  );
}
