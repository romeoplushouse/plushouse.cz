import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlusHouse ERP",
  description:
    "Účetní systém s podvojným účetnictvím, CRM, evidencí zakázek a správou zaměstnanců",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
