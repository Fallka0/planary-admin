"use client";

import { useCallback, useState } from "react";
import { OrgError, useOrgAction } from "@/lib/org";
import { Toast } from "./ui";

/**
 * One Console write: keeps `busy` while it runs, shows a toast when it worked and keeps the
 * error on screen when it didn't. `run` resolves to the response, or null when it failed.
 */
export function useAct() {
  const act = useOrgAction();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; tone?: "err" } | null>(null);

  const run = useCallback(
    async <T = { ok: true },>(path: string, body: unknown, done: string): Promise<T | null> => {
      setBusy(true);
      setError(null);
      try {
        const res = await act<T>(path, body);
        setNote({ text: done });
        return res;
      } catch (e) {
        const msg = e instanceof OrgError || e instanceof Error ? e.message : "That didn’t work.";
        setError(msg);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [act],
  );

  const toast = note ? <Toast text={note.text} tone={note.tone} onDone={() => setNote(null)} /> : null;
  return { run, busy, error, setError, toast, notify: (text: string, tone?: "err") => setNote({ text, tone }) };
}
