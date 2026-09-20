"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export const CASINO_API = process.env.NEXT_PUBLIC_CASINO_API || "https://planary-casino-api.planary.workers.dev";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export async function adminCall<T>(token: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${CASINO_API}/admin${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const { error, code } = data as { error?: string; code?: string };
    throw new ApiError(error ?? "Something went wrong. Try again.", res.status, code);
  }
  return data as T;
}

/** Reads from the admin API; refreshes every `every` ms and after any change made through `useAdminAction`. */
export function useAdmin<T>(path: string | null, every = 0) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(() => {
    if (!path) return;
    adminCall<T>(accessToken, path).then(
      (value) => {
        setData(value);
        setError(null);
      },
      (e: ApiError) => setError(e),
    );
  }, [accessToken, path]);

  useEffect(() => {
    load();
    window.addEventListener("admin:changed", load);
    const timer = every ? window.setInterval(load, every) : 0;
    return () => {
      window.removeEventListener("admin:changed", load);
      if (timer) window.clearInterval(timer);
    };
  }, [load, every]);

  return { data, error, reload: load };
}

export function useAdminAction() {
  const { accessToken } = useAuth();
  return useCallback(
    async <T,>(path: string, body: unknown = {}): Promise<T> => {
      const result = await adminCall<T>(accessToken, path, body);
      window.dispatchEvent(new Event("admin:changed"));
      return result;
    },
    [accessToken],
  );
}

export function avatarSrc(path: string | null) {
  return path ? CASINO_API + path : null;
}

// ── Types ────────────────────────────────────────────

export type Role = "owner" | "manager" | "support" | "viewer";
export type Permission = "view" | "note" | "moderate" | "restrict" | "chips" | "games" | "economy" | "announce" | "audit" | "staff";

export interface StaffMe {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

export interface Badge {
  id: string;
  name: string;
  avatar: string | null;
  border: string | null;
  title: string | null;
}

export interface Figures {
  handle: number;
  payouts: number;
  ggr: number;
  rtp: number | null;
  bets: number;
  players: number;
}

export interface LedgerRow {
  id: number;
  user_id?: string;
  name?: string;
  amount: number;
  kind: string;
  game: string | null;
  ref: string | null;
  created_at: number;
  counterparty_name: string | null;
}

/** A game round as the archive stores it: what happened, and the proof it was fair. */
export interface RoundProof {
  hash: string;
  clientSeed: string;
  nonce: number;
  serverSeed: string | null;
  kind: string;
}

export interface RoundRow {
  id: string;
  game: string;
  tableId: string;
  startedAt: number;
  endedAt: number;
  outcome: string;
  staked: number;
  returned: number;
  seats: number;
  proof: RoundProof;
}

export interface RoundDetail extends RoundRow {
  log: Record<string, unknown> | null;
  players: {
    userId: string;
    name: string | null;
    seat: number;
    staked: number;
    returned: number;
    detail: Record<string, unknown>;
  }[];
}
