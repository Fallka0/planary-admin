"use client";

import { ThemeProvider } from "next-themes";
import { Toast } from "@heroui/react";

/** Theme switching (system by default) and the toast queue for the whole console. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toast.Provider placement="bottom end" />
    </ThemeProvider>
  );
}
