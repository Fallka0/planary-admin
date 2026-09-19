import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Shell } from "@/components/Shell";
import "./globals.css";

const ui = Onest({ variable: "--font-ui", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Operator console · Planary Casino", template: "%s · Planary Casino admin" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={ui.variable}>
      <body>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
