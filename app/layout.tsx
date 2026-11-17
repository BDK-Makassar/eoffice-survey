import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: "Survei Kepuasan Pengguna | BDK Makassar",
  description: "Survei kepuasan pengguna sistem informasi Balai Diklat Keagamaan Makassar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="min-h-screen font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
