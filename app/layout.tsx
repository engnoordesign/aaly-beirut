import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aaly Beirut · Operations",
  description: "Orders, raw and cooked materials, sales, accounting and document review.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
