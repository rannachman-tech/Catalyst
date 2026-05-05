import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import ThemeBootstrap from "@/components/ThemeBootstrap";

export const metadata: Metadata = {
  title: "Equity Catalyst — what's next for your stocks?",
  description:
    "Type a ticker, see every catalyst in the next 90 days. Or paste your portfolio and see the catalyst load on your whole book. Built for eToro.",
  metadataBase: new URL("https://equity-catalyst.etoro.app"),
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeBootstrap />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
