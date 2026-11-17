"use client";

import { useEffect, useState } from "react";

interface QItem {
  id: number;
  title: string;
  description: string;
  public_mode: boolean;
}

// Daftar kuesioner untuk peserta pelatihan/pengunjung (hanya yang bermode publik).
export default function UmumHomePage() {
  const [items, setItems] = useState<QItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/questionnaires/active")
      .then((r) => r.json())
      .then((json) => setItems((json.questionnaires || []).filter((q: QItem) => q.public_mode)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-xl px-4 py-14">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
        BDK Makassar &middot; Survei Kepuasan Pengguna
      </p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Kuesioner untuk Peserta dan Pengunjung</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Pilih kuesioner di bawah untuk mengisi. Penilaian Anda membantu BDK Makassar meningkatkan kualitas layanan.
      </p>

      <div className="mt-8 space-y-4">
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
              href={`/survey/${q.id}/umum`}
              className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 group-hover:text-brand-700">{q.title}</p>
                {q.description && <p className="mt-1 line-clamp-3 text-sm text-slate-500">{q.description}</p>}
              </div>
              <svg
                className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))
        )}
      </div>
    </main>
  );
}
