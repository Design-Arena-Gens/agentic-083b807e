import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foto Enhance",
  description: "P?rmir?so fotografi t? vjetra me nj? klik",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sq">
      <body>{children}</body>
    </html>
  );
}
