"use client";

import { useEffect, useState } from "react";

interface QItem {
  id: number;
  title: string;
  description: string;
  response_count: number;
  total_users: number;
}

export default function HomePage() {
  const [items, setItems] = useState<QItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/questionnaires/active")
      .then((r) => r.json())
      .then((json) => setItems(json.questionnaires || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-xl px-4 py-14">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
        BDK Makassar &middot; Survei Internal
      </p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
        Kuesioner yang Tersedia
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Pilih kuesioner di bawah untuk mengisi. Jawaban Anda membantu evaluasi layanan
        administratif internal BDK Makassar.
      </p>

      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-400">Memuat...</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            Belum ada kuesioner yang aktif saat ini.
          </p>
        ) : (
          items.map((q) => {
            const total = q.total_users || 0;
            const filled = q.response_count || 0;
            const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
            return (
              <a
                key={q.id}
                href={`/survey/${q.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-slate-100">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-start justify-between gap-3 pt-1.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 group-hover:text-brand-700">
                      {q.title}
                    </p>
                    {q.description && (
                      <p className="mt-1 text-sm text-slate-500">{q.description}</p>
                    )}
                  </div>
                  <svg
                    className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M17 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M15 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM23 20v-1a4 4 0 0 0-3-3.87M17 4.13a4 4 0 0 1 0 7.75"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>
                      <span className="font-semibold text-slate-700">{filled}</span> dari {total} telah
                      mengisi
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      pct === 100
                        ? "bg-green-100 text-green-700"
                        : pct >= 50
                        ? "bg-brand-100 text-brand-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
              </a>
            );
          })
        )}
      </div>
    </main>
  );
}
