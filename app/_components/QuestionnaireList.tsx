"use client";

import { useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";

interface QItem {
  id: number;
  title: string;
  description: string;
  public_mode: boolean;
  response_count: number;
  total_users: number;
}

// Daftar kuesioner aktif. mode "pegawai": semua kuesioner + progres pengisian; "umum": hanya kuesioner bermode publik.
export default function QuestionnaireList({ mode }: { mode: "pegawai" | "umum" }) {
  const [items, setItems] = useState<QItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/questionnaires/active")
      .then((r) => r.json())
      .then((json) => {
        const all: QItem[] = json.questionnaires || [];
        setItems(mode === "umum" ? all.filter((q) => q.public_mode) : all);
      })
      .finally(() => setLoading(false));
  }, [mode]);

  return (
    <>
      <SiteHeader>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {mode === "umum" ? "Bagaimana pengalaman Anda dengan layanan kami?" : "Survei kepuasan pengguna sistem informasi"}
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-brand-100">
          {mode === "umum"
            ? "Penilaian peserta pelatihan dan pengunjung membantu BDK Makassar memperbaiki layanan daringnya."
            : "Pilih sistem yang ingin Anda nilai. Setiap kuesioner membutuhkan sekitar lima menit."}
        </p>
      </SiteHeader>

      <main className="relative mx-auto -mt-12 max-w-xl px-4 pb-16">
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(11,79,64,0.35)] ring-1 ring-brand-900/5">
          {loading ? (
            <p className="p-6 text-sm text-slate-400">Memuat kuesioner...</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Belum ada kuesioner yang dibuka saat ini.</p>
          ) : (
            <ul className="divide-y divide-brand-50">
              {items.map((q) => {
                const total = q.total_users || 0;
                const filled = q.response_count || 0;
                const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
                return (
                  <li key={q.id}>
                    <a
                      href={mode === "umum" ? `/survey/${q.id}/umum` : `/survey/${q.id}`}
                      className="group flex items-start gap-4 p-5 transition-colors hover:bg-brand-50/60 focus-visible:bg-brand-50/60 sm:p-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[17px] font-bold leading-snug text-ink group-hover:text-brand-700">
                          {q.title.replace(/^Survei Kepuasan Pengguna\s+/i, "")}
                        </p>
                        {q.description && (
                          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">{q.description}</p>
                        )}
                        {mode === "pegawai" && (
                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-50">
                              <div className="h-full rounded-full bg-emas-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="shrink-0 text-xs text-slate-500">
                              <span className="font-semibold text-ink">{filled}</span> dari {total} pegawai
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          {mode === "umum" ? (
            <>Pegawai BDK Makassar? <a href="/" className="font-semibold text-brand-700 hover:underline">Buka halaman pegawai</a></>
          ) : (
            <>Peserta pelatihan atau pengunjung? <a href="/umum" className="font-semibold text-brand-700 hover:underline">Buka halaman umum</a></>
          )}
        </p>
      </main>
    </>
  );
}
