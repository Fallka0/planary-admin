"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { buildAuthUrl, signOutUrl } from "@/lib/auth";
import { absorbSessionFromHash, clearSession, loadSession, verifySession } from "@/lib/session";

export interface PlanaryUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: PlanaryUser;
  accessToken: string;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Staff sign in with their Planary account. Without a session we hop to planary-auth, which sends
 *  already-signed-in people straight back (single sign-on). Whether they're staff is the API's call. */
function goSignIn() {
  window.location.replace(buildAuthUrl("login", window.location.href.split("#")[0], true));
}

/** Fixture mode (local development and screenshot checks only): no sign-in, a made-up staff member. */
const FIXTURE_SESSION =
  process.env.NEXT_PUBLIC_CONSOLE_DATA === "fixtures" ? { user: { id: "u_mykyta", email: "mykyta@planary.ch", name: "Mykyta Pantelei" }, accessToken: "fixtures" } : null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: PlanaryUser; accessToken: string } | null>(FIXTURE_SESSION);

  useEffect(() => {
    if (FIXTURE_SESSION) return;
    let active = true;
    const stored = absorbSessionFromHash() ?? loadSession();
    if (!stored) {
      goSignIn();
      return;
    }
    setSession({ user: { id: stored.userId, email: stored.email, name: stored.name }, accessToken: stored.accessToken });

    void verifySession(stored).then((ok) => {
      if (!active || ok) return;
      clearSession();
      goSignIn();
    });
    // Tokens last an hour; fetch a fresh one the same silent way shortly before that.
    const timer = window.setTimeout(() => {
      clearSession();
      goSignIn();
    }, Math.max(0, stored.expiresAt * 1000 - Date.now() - 60_000));
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    // End the Planary session too, or single sign-on would sign them straight back in.
    window.location.assign(signOutUrl());
  }, []);

  if (!session) {
    return (
      <div className="loading" role="status">
        <p>Signing you in…</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...session, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
