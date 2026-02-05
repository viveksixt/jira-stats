import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jira Metrics Dashboard",
  description: "Track sprint metrics, KPIs, tech debt ratio, and cycle time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
