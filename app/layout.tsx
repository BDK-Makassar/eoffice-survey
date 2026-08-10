import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kuesioner e-Office | BDK Makassar",
  description:
    "Survei evaluasi penggunaan aplikasi e-Office untuk mendukung pekerjaan administratif internal BDK Makassar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-800 antialiased">{children}</body>
    </html>
  );
}
