"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { fixtureCall } from "./org-fixtures";

/** planary-org: Console data (overview, status, customers, support, audit, staff). */
export const ORG_API = process.env.NEXT_PUBLIC_ORG_API || "https://org.planary.ch";

/**
 * `fixtures` answers every planary-org call from the handoff's sample data, with a fixed clock
 * (20.10.2026 20:11) and no sign-in. For local development and screenshot checks only; never set
 * it in production. `?state=down|viewer|error|empty|loading` picks one of the designed states.
 */
export const FIXTURES = process.env.NEXT_PUBLIC_CONSOLE_DATA === "fixtures";

/** The fixed clock the fixtures were written against. */
export const FIXTURE_NOW = Date.parse("2026-10-20T20:11:00+02:00");

export function now() {
  return FIXTURES ? FIXTURE_NOW : Date.now();
}

export class OrgError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string | undefined,
    public requestId: string | undefined,
    public at: number,
  ) {
    super(message);
  }
}

export async function orgCall<T>(token: string, method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  if (FIXTURES) return fixtureCall<T>(method, path);
  let res: Response;
  try {
    res = await fetch(`${ORG_API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new OrgError("The Console service didn’t answer. Check your connection and try again.", 0, "network", undefined, Date.now());
  }
  const requestId = res.headers.get("x-request-id") ?? undefined;
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    const e = (typeof data === "object" ? data : {}) as { error?: string; code?: string; requestId?: string };
    throw new OrgError(e.error ?? `The Console service answered ${res.status}.`, res.status, e.code, e.requestId ?? requestId, Date.now());
  }
  return data as T;
}

/** Reads from planary-org; refreshes every `every` ms and after any change made through `useOrgAction`. */
export function useOrg<T>(path: string | null, every = 0) {
  const { accessToken } = useAuth();
  const [state, setState] = useState<{ path: string | null; data: T | null; error: OrgError | null }>({ path: null, data: null, error: null });

  const load = useCallback(() => {
    if (!path) return;
    orgCall<T>(accessToken, "GET", path).then(
      (data) => setState({ path, data, error: null }),
      (error: OrgError) => setState((s) => ({ path, data: s.path === path ? s.data : null, error })),
    );
  }, [accessToken, path]);

  useEffect(() => {
    load();
    window.addEventListener("org:changed", load);
    const timer = every ? window.setInterval(load, every) : 0;
    return () => {
      window.removeEventListener("org:changed", load);
      if (timer) window.clearInterval(timer);
    };
  }, [load, every]);

  const current = state.path === path;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !!path && (!current || (!state.data && !state.error)),
    reload: load,
  };
}

/** Writes to planary-org, then tells every `useOrg` to reload. */
export function useOrgAction() {
  const { accessToken } = useAuth();
  return useCallback(
    async <T,>(path: string, body: unknown = {}): Promise<T> => {
      const result = await orgCall<T>(accessToken, "POST", path, body);
      window.dispatchEvent(new Event("org:changed"));
      return result;
    },
    [accessToken],
  );
}

/** Downloads a file (CSV export) with the staff token. */
export async function orgDownload(token: string, path: string, filename: string) {
  const text = await orgCall<string>(token, "GET", path);
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
