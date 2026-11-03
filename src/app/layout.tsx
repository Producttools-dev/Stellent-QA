import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Stellent QA — Website auditing on autopilot",
  description:
    "Audit any website for SEO, performance, and quality issues. Get plain-English verdicts and clear fixes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
