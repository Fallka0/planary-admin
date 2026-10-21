"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ICONS, type IconName } from "@/design/icons";
import { CONSOLE } from "@/design/console-copy";
import type { OrgError } from "@/lib/org";
import type { ServiceState } from "@/lib/org-contract";
import { time } from "@/lib/fmt";

/** One icon from the handoff set (24 × 24, stroke 1.6). `small` is the 15 px size next to text. */
export function Ic({ name, small = false }: { name: IconName; small?: boolean }) {
  return <svg className={small ? "ic ic-s" : "ic"} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />;
}

export function Mark() {
  return (
    <svg className="wm-mark" viewBox="0 0 100 100" aria-hidden="true">
      <use href="#pmark" />
    </svg>
  );
}

/** The Planary mark as a symbol, once per page (the wordmarks `<use>` it). */
export function MarkSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <mask id="pmP" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#ffffff" />
          <path d="M6 50A44 12.5 0 0 0 94 50" transform="rotate(-28 50 50)" fill="none" stroke="#000000" strokeWidth="11" />
        </mask>
        <mask id="pmB" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#ffffff" />
          <circle cx="50" cy="50" r="28" fill="#000000" />
        </mask>
        <symbol id="pmark" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="25" fill="currentColor" mask="url(#pmP)" />
          <path d="M94 50A44 12.5 0 0 0 6 50" transform="rotate(-28 50 50)" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" mask="url(#pmB)" />
          <path d="M6 50A44 12.5 0 0 0 94 50" transform="rotate(-28 50 50)" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </symbol>
      </defs>
    </svg>
  );
}

/** Bars: one series, 4 px rounded tops, 2 px gaps, a sentence for screen readers, a title per bar. */
export function Bars({ values, label, titles, tone, height }: { values: number[]; label: string; titles?: string[]; tone?: "err"; height?: number }) {
  const max = Math.max(1, ...values);
  return (
    <div className="bars" style={height ? { height } : undefined} role="img" aria-label={label}>
      {values.map((v, i) => (
        <i key={i} className={tone} style={{ height: `${Math.max(3, Math.round((v / max) * 100))}%` }} title={titles?.[i] ?? String(v)} />
      ))}
    </div>
  );
}

/** A 96 × 28 line, last values on the right. Gaps (null) break the line. */
export function Spark({ values, tone }: { values: (number | null)[]; tone?: "err" }) {
  const nums = values.filter((v): v is number => v !== null);
  const max = Math.max(1, ...nums);
  const min = Math.min(max, ...nums);
  const span = max - min || 1;
  const step = values.length > 1 ? 96 / (values.length - 1) : 0;
  const lines: string[] = [];
  let cur: string[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (cur.length) lines.push(cur.join(" "));
      cur = [];
      return;
    }
    cur.push(`${(i * step).toFixed(1)},${(26 - ((v - min) / span) * 24).toFixed(1)}`);
  });
  if (cur.length) lines.push(cur.join(" "));
  return (
    <svg className={`spark${tone ? ` ${tone}` : ""}`} viewBox="0 0 96 28" preserveAspectRatio="none" aria-hidden="true">
      {lines.map((pts) => (
        <polyline key={pts} points={pts} />
      ))}
    </svg>
  );
}

const STATE: Record<ServiceState, { cls: string; label: string }> = {
  ok: { cls: "ok", label: "Up" },
  degraded: { cls: "warn", label: "Slow" },
  down: { cls: "err", label: "Down" },
  unknown: { cls: "", label: "Unknown" },
};

/** Status is never colour alone: a dot and a word. */
export function StateChip({ state }: { state: ServiceState }) {
  const s = STATE[state];
  return (
    <span className={`chip ${s.cls}`}>
      <span className={`dot ${s.cls}`} />
      {s.label}
    </span>
  );
}

export function Chip({ tone = "", dot = false, icon, children }: { tone?: "" | "ok" | "warn" | "err" | "info" | "line"; dot?: boolean; icon?: IconName; children: ReactNode }) {
  const cls = tone === "line" ? "chip chip-line" : `chip ${tone}`;
  return (
    <span className={cls.trim()}>
      {dot ? <span className={`dot ${tone}`} /> : null}
      {icon ? <Ic name={icon} /> : null}
      {children}
    </span>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([k, text]) => (
        <button key={k} type="button" className={value === k ? "on" : undefined} aria-pressed={value === k} onClick={() => onChange(k)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export interface Col {
  h: string;
  /** right-aligned (numbers) */
  r?: boolean;
  /** hidden on phones */
  hide?: boolean;
}

/** A real <table> laid out like the boards' grid rows: `cols` and `colsS` are grid-template-columns. */
export function Table({ cols, colsS, head, children, className = "", style }: { cols: string; colsS?: string; head: Col[]; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <table className={`dt ${className}`.trim()} style={{ ["--cols" as string]: cols, ...(colsS ? { ["--cols-s" as string]: colsS } : {}), ...style }}>
      <thead>
        <tr className="dt-r dt-h">
          {head.map((c, i) => (
            <th key={i} scope="col" className={`dt-c${c.r ? " r" : ""}${c.hide ? " hide-s" : ""}`}>
              {c.h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function Td({ r, hide, className = "", children, style }: { r?: boolean; hide?: boolean; className?: string; children?: ReactNode; style?: React.CSSProperties }) {
  return (
    <td className={`dt-c${r ? " r" : ""}${hide ? " hide-s" : ""}${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </td>
  );
}

export function PageHead({ title, children, crumb }: { title: ReactNode; children?: ReactNode; crumb?: ReactNode }) {
  return (
    <>
      {crumb}
      <div className="ph">
        <div>
          <h1>{title}</h1>
        </div>
        {children ? <div className="ph-a">{children}</div> : null}
      </div>
    </>
  );
}

/** Flat placeholder blocks in the final layout. No spinner, no shimmer. */
export function Sk({ h, r = 18, className = "" }: { h: number; r?: number; className?: string }) {
  return <span className={`sk ${className}`.trim()} style={{ height: h, borderRadius: r }} />;
}

export function LoadingNote({ label }: { label: string }) {
  return (
    <p className="sr" role="status">
      {label}
    </p>
  );
}

/** The error card: what failed, the request ID, try again, open status. */
export function ErrorCard({ title, error, onRetry }: { title: string; error: OrgError; onRetry: () => void }) {
  const s = CONSOLE.states;
  return (
    <div className="err-pg" role="alert">
      <span className="ic-b">
        <Ic name="alert" />
      </span>
      <h2>{title}</h2>
      <p>{error.message}</p>
      {error.requestId ? (
        <p className="box-s">
          {s.errorId} <span className="mono-t">{error.requestId}</span> · {time(error.at)}:{String(new Date(error.at).getSeconds()).padStart(2, "0")}
        </p>
      ) : null}
      <div className="acts">
        <button className="btn btn-ink btn-s" type="button" onClick={onRetry}>
          <Ic name="refresh" small />
          {s.errorRetry}
        </button>
        <a className="btn btn-line btn-s" href="/status">
          {s.errorStatus}
        </a>
      </div>
    </div>
  );
}

export function Empty({ icon = "inbox", title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Ic name={icon} />
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function ReadOnlyNote({ children }: { children: ReactNode }) {
  return (
    <p className="ro-note">
      <Ic name="lock" small />
      {children}
    </p>
  );
}

/** A modal dialog: focus moves in, Esc and the scrim close it, focus returns to where it was. */
export function Dialog({ title, onClose, children, actions }: { title: string; onClose: () => void; children: ReactNode; actions: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const first = box.current?.querySelector<HTMLElement>("input, select, textarea, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !box.current) return;
      const items = [...box.current.querySelectorAll<HTMLElement>("input, select, textarea, button, a[href]")].filter((el) => !el.hasAttribute("disabled"));
      if (!items.length) return;
      const [a, z] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === a) (e.preventDefault(), z.focus());
      else if (!e.shiftKey && document.activeElement === z) (e.preventDefault(), a.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      back?.focus();
    };
  }, [onClose]);
  return (
    <div className="dlg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dlg-b" role="dialog" aria-modal="true" aria-labelledby="dlg-h" ref={box}>
        <h2 id="dlg-h">{title}</h2>
        {children}
        <div className="dlg-a">{actions}</div>
      </div>
    </div>
  );
}

/** A short confirmation at the bottom right; errors stay until the next action. */
export function Toast({ text, tone, onDone }: { text: string; tone?: "err"; onDone: () => void }) {
  useEffect(() => {
    if (tone === "err") return;
    const t = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(t);
  }, [onDone, tone, text]);
  return (
    <div className={`toast${tone ? ` ${tone}` : ""}`} role={tone ? "alert" : "status"}>
      {text}
    </div>
  );
}
