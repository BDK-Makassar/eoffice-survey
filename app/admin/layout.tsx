"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminKey } from "@/lib/useAdminKey";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { key, setKey, clearKey } = useAdminKey();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verify?key=${encodeURIComponent(input)}`);
      if (!res.ok) throw new Error();
      setKey(input);
    } catch {
      setError("Kata sandi salah.");
    } finally {
      setLoading(false);
    }
  }

  if (key === undefined) return null; // menunggu baca localStorage

  if (!key) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <h1 className="text-lg font-semibold text-slate-900">Admin e-Office</h1>
          <p className="mt-1 text-sm text-slate-500">Masukkan kata sandi admin untuk masuk.</p>
          <input
            type="password"
            autoFocus
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            placeholder="Kata sandi admin"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
      </main>
    );
  }

  const navItems = [
    { href: "/admin/kuesioner", label: "Kuesioner" },
    { href: "/admin/users", label: "Pengguna" },
  ];

  return (
    <div className="min-h-screen">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-900">Admin e-Office</span>
            <div className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    pathname?.startsWith(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              clearKey();
              router.push("/admin");
            }}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Keluar
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
