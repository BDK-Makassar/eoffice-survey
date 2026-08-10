"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminKey } from "@/lib/useAdminKey";

interface QItem {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  question_count: number;
  response_count: number;
}

export default function KuesionerListPage() {
  const { key, adminFetch } = useAdminKey();
  const [items, setItems] = useState<QItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/kuesioner");
    const json = await res.json();
    setItems(json.questionnaires || []);
    setLoading(false);
  }

  useEffect(() => {
    if (key) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Judul wajib diisi");
      return;
    }
    const res = await adminFetch("/api/admin/kuesioner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, is_active: true }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal membuat kuesioner");
      return;
    }
    setForm({ title: "", description: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus kuesioner ini beserta seluruh pertanyaan dan jawabannya?")) return;
    await adminFetch(`/api/admin/kuesioner/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kuesioner</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola daftar kuesioner dan pertanyaannya.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {showForm ? "Batal" : "+ Kuesioner Baru"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            placeholder="Judul kuesioner"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            placeholder="Deskripsi singkat (opsional)"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <button className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Buat Kuesioner
          </button>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-400">Memuat...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada kuesioner. Buat yang pertama di atas.</p>
        ) : (
          items.map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/kuesioner/${q.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                    {q.title}
                  </Link>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {q.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                {q.description && <p className="mt-1 text-sm text-slate-500">{q.description}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {q.question_count} pertanyaan &middot; {q.response_count} respons
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Link
                  href={`/admin/kuesioner/${q.id}`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Kelola
                </Link>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
