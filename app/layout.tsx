import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panggil AI — Platform Voice Agent Indonesia",
  description: "Otomatisasi panggilan bisnis dengan AI. Platform voice agent terdepan untuk Collection & Telesales di Indonesia.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
