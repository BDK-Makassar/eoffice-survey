"use client";

import { useEffect, useState } from "react";

interface QItem {
  id: number;
  title: string;
  description: string;
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

      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-400">Memuat...</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            Belum ada kuesioner yang aktif saat ini.
          </p>
        ) : (
          items.map((q) => (
            <a
              key={q.id}
              href={`/survey/${q.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-400 hover:shadow-md"
            >
              <p className="font-semibold text-slate-900">{q.title}</p>
              {q.description && <p className="mt-1 text-sm text-slate-500">{q.description}</p>}
            </a>
          ))
        )}
      </div>
    </main>
  );
}
