import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Shell } from "@/components/console/Shell";
import { Providers } from "./providers";
import "./globals.css";
import "./console.css";

const body = Manrope({ variable: "--font-body", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });
const disp = Unbounded({ variable: "--font-disp", subsets: ["latin", "latin-ext"], weight: ["300", "400"] });

export const metadata: Metadata = {
  title: { default: "Planary Console", template: "%s · Planary Console" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${disp.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground font-[family-name:var(--font-body)] antialiased">
        <Providers>
          <AuthProvider>
            <Shell>{children}</Shell>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
