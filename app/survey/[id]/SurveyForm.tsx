"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SCALE_1_4_LABELS, PUBLIC_CATEGORIES } from "@/lib/types";
import SiteHeader from "../../_components/SiteHeader";
import type { QuestionDef, UserDef } from "@/lib/types";

interface Meta {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  public_mode: boolean;
}

const SCALE = [1, 2, 3, 4, 5];
const SCALE_4 = SCALE_1_4_LABELS.map((label, i) => ({ n: i + 1, label }));

// mode "pegawai": pilih nama dari daftar pegawai; mode "umum": isian identitas peserta/pengunjung.
export default function SurveyForm({ mode }: { mode: "pegawai" | "umum" }) {
  const home = mode === "umum" ? "/umum" : "/";
  const params = useParams();
  const id = params.id as string;

  const [meta, setMeta] = useState<Meta | null>(null);
  const [questions, setQuestions] = useState<QuestionDef[]>([]);
  const [users, setUsers] = useState<UserDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<"identity" | "form" | "done">("identity");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDef | null>(null);
  // Responden umum (kuesioner bermode publik): dipakai bila selectedUser kosong.
  const [publik, setPublik] = useState({ nama: "", kategori: "", instansi: "" });

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/survey/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json();
          throw new Error(j.error || "Gagal memuat kuesioner");
        }
        return r.json();
      })
      .then((json) => {
        setMeta(json.questionnaire);
        setQuestions(json.questions);
        setUsers(json.users);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return users
      .filter((u) => u.nama.toLowerCase().includes(q) || u.nip.includes(q))
      .slice(0, 20);
  }, [search, users]);

  function setAnswer(qid: number, value: string) {
    setAnswers((a) => ({ ...a, [qid]: value }));
  }

  function toggleMulti(qid: number, option: string) {
    setAnswers((a) => {
      const current = (a[qid] || "").split("||").filter(Boolean);
      const next = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option];
      return { ...a, [qid]: next.join("||") };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    for (const q of questions) {
      if (q.required && !answers[q.id!]) {
        setSubmitError(`Pertanyaan "${q.label}" wajib diisi.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/survey/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selectedUser ? { user_id: selectedUser.id } : { respondent: publik }),
          answers: questions.map((q) => ({ question_id: q.id, value: answers[q.id!] || "" })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengirim jawaban");
      setStep("done");
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="p-10 text-center text-sm text-slate-400">Memuat kuesioner...</main>;
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-slate-600">{loadError}</p>
        <a href={home} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
          Kembali ke daftar kuesioner
        </a>
      </main>
    );
  }

  const nama = meta?.title.replace(/^Survei Kepuasan Pengguna\s+/i, "");

  if (step === "done") {
    return (
      <>
        <SiteHeader>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
            Terima kasih, {selectedUser?.nama ?? publik.nama}
          </h1>
          <p className="mt-3 text-[15px] text-brand-100">Penilaian Anda untuk {nama} sudah tersimpan.</p>
        </SiteHeader>
        <main className="relative mx-auto -mt-12 max-w-xl px-4 pb-16">
          <div className="flex items-center gap-4 rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(11,79,64,0.35)] ring-1 ring-brand-900/5 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emas-500 text-brand-900">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="flex-1 text-sm leading-relaxed text-slate-600">
              Hasil survei dipakai sebagai bahan evaluasi dan perbaikan layanan BDK Makassar.
            </p>
          </div>
          <a
            href={home}
            className="mt-4 block w-full rounded-xl bg-brand-700 py-3 text-center text-[15px] font-bold text-white transition hover:bg-brand-800"
          >
            Nilai sistem lainnya
          </a>
        </main>
      </>
    );
  }

  if (step === "identity") {
    return (
      <>
        <SiteHeader>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{nama}</h1>
          <p className="mt-2 text-[15px] text-brand-100">Survei kepuasan pengguna</p>
        </SiteHeader>
        <main className="relative mx-auto -mt-12 max-w-xl space-y-6 px-4 pb-16">
          {meta?.image_url && (
            <figure className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(11,79,64,0.35)] ring-1 ring-brand-900/5">
              <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              </div>
              <img src={meta.image_url} alt={`Tampilan ${nama}`} className="w-full" />
            </figure>
          )}
          {meta?.description && (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-600">{meta.description}</p>
          )}

          {mode === "pegawai" && (
            <div className="rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(11,79,64,0.35)] ring-1 ring-brand-900/5 p-6 sm:p-7">
              <h2 className="text-lg font-bold text-ink">Siapa yang mengisi?</h2>
              <p className="mt-1 text-sm text-slate-500">Cari nama atau NIP Anda.</p>
          <input
            autoFocus
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            placeholder="Ketik nama atau NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
            {search.trim() !== "" && filteredUsers.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Tidak ditemukan.</p>
            )}
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                disabled={u.has_responded}
                title={u.has_responded ? "Anda sudah pernah mengisi kuesioner ini." : undefined}
                onClick={() => {
                  if (u.has_responded) return;
                  setSelectedUser(u);
                  setStep("form");
                }}
                className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left text-sm transition ${
                  u.has_responded
                    ? "cursor-not-allowed border-green-300 bg-green-50"
                    : "border-slate-200 hover:border-brand-400 hover:bg-brand-50"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={`font-medium ${u.has_responded ? "text-green-800" : "text-slate-800"}`}>
                    {u.nama}
                  </span>
                  {u.has_responded && (
                    <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Sudah Mengisi
                    </span>
                  )}
                </span>
                <span className={`text-xs ${u.has_responded ? "text-green-700" : "text-slate-500"}`}>
                  {u.nip} &middot; {u.jabatan}
                </span>
              </button>
            ))}
          </div>
            </div>
          )}

          {mode === "umum" && !meta?.public_mode && (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600 ring-1 ring-brand-900/5">
              Kuesioner ini hanya untuk pegawai BDK Makassar.
            </p>
          )}

          {mode === "umum" && meta?.public_mode && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSelectedUser(null);
                setStep("form");
              }}
              className="rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(11,79,64,0.35)] ring-1 ring-brand-900/5 p-6 sm:p-7"
            >
              <h2 className="text-lg font-bold text-ink">Identitas responden</h2>
              <p className="mt-1 text-sm text-slate-500">Isi data singkat berikut sebelum mulai menilai.</p>
              <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="pub-nama">Nama</label>
              <input
                id="pub-nama"
                autoFocus
                required
                maxLength={100}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                value={publik.nama}
                onChange={(e) => setPublik({ ...publik, nama: e.target.value })}
              />
              <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="pub-kategori">Kategori responden</label>
              <select
                id="pub-kategori"
                required
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                value={publik.kategori}
                onChange={(e) => setPublik({ ...publik, kategori: e.target.value })}
              >
                <option value="">Pilih kategori...</option>
                {PUBLIC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="pub-instansi">
                Instansi/asal <span className="font-normal text-slate-400">(opsional)</span>
              </label>
              <input
                id="pub-instansi"
                maxLength={150}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                value={publik.instansi}
                onChange={(e) => setPublik({ ...publik, instansi: e.target.value })}
              />
              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-brand-700 py-3 text-[15px] font-bold text-white transition hover:bg-brand-800"
              >
                Mulai mengisi
              </button>
            </form>
          )}
        </main>
      </>
    );
  }

  const requiredIds = questions.filter((q) => q.required).map((q) => q.id!);
  const answered = requiredIds.filter((qid) => answers[qid]).length;

  return (
    <>
      <SiteHeader wide>
        <p className="text-sm text-brand-100">
          {selectedUser ? `${selectedUser.nama}, ${selectedUser.jabatan}` : `${publik.nama}, ${publik.kategori}`}
          <button onClick={() => setStep("identity")} className="ml-2 font-semibold text-emas-400 hover:underline">
            Ganti
          </button>
        </p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight">{nama}</h1>
      </SiteHeader>

      <div className="sticky top-0 z-10 border-b border-brand-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-50"
            role="progressbar"
            aria-label="Pertanyaan wajib terjawab"
            aria-valuemin={0}
            aria-valuemax={requiredIds.length}
            aria-valuenow={answered}
          >
            <div
              className="h-full rounded-full bg-emas-500 transition-all"
              style={{ width: `${requiredIds.length ? (answered / requiredIds.length) * 100 : 0}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-semibold text-ink">
            {answered} dari {requiredIds.length} terjawab
          </span>
        </div>
      </div>

      <main className="relative mx-auto mt-6 max-w-2xl px-4 pb-16">
        {questions.some((q) => q.type === "scale_1_5") && (
          <div className="mb-5 rounded-2xl bg-white p-4 ring-1 ring-brand-900/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Keterangan Skala 1–5
            </p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-brand-900 sm:grid-cols-5 sm:gap-2">
              {[
                { n: 1, label: "Sangat Kurang" },
                { n: 2, label: "Kurang" },
                { n: 3, label: "Cukup" },
                { n: 4, label: "Baik" },
                { n: 5, label: "Sangat Baik" },
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-1.5 sm:flex-col sm:items-center sm:gap-1 sm:text-center">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
                    {s.n}
                  </span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, idx) => (
          <section
            key={q.id}
            className={`rounded-2xl bg-white p-5 shadow-[0_6px_24px_-14px_rgba(11,79,64,0.35)] ring-1 transition-shadow sm:p-6 ${
              answers[q.id!] ? "ring-brand-200" : "ring-brand-900/5"
            }`}
          >
            <div className="flex gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  answers[q.id!] ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700"
                }`}
              >
                {idx + 1}
              </span>
              <p className="pt-0.5 text-[15px] font-semibold leading-relaxed text-ink">
                {q.label}
                {q.required && <span className="ml-1 text-emas-600" aria-label="wajib">*</span>}
              </p>
            </div>

            {q.type === "scale_1_4" && (
              <div role="radiogroup" className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-brand-50 p-1">
                {SCALE_4.map((s) => {
                  const on = answers[q.id!] === String(s.n);
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={on}
                      key={s.n}
                      onClick={() => setAnswer(q.id!, String(s.n))}
                      className={`flex flex-col items-center rounded-lg px-1 py-2.5 text-center transition ${
                        on ? "bg-brand-700 text-white shadow-sm" : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      <span className={`text-lg font-extrabold leading-none ${on ? "text-emas-400" : "text-brand-700"}`}>
                        {s.n}
                      </span>
                      <span className="mt-1 text-[11px] font-semibold leading-tight sm:text-xs">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "scale_1_5" && (
              <div className="mt-3 flex items-center gap-2">
                {SCALE.map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setAnswer(q.id!, String(n))}
                    className={`h-11 w-11 rounded-full border text-sm font-semibold transition ${
                      answers[q.id!] === String(n)
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:border-brand-400"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            {(q.type === "single_choice" || q.type === "dropdown") &&
              (q.type === "dropdown" ? (
                <select
                  className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  value={answers[q.id!] || ""}
                  onChange={(e) => setAnswer(q.id!, e.target.value)}
                >
                  <option value="" disabled>
                    Pilih...
                  </option>
                  {(q.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-4 space-y-2">
                  {(q.options || []).map((opt) => (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                        answers[q.id!] === opt
                          ? "border-brand-600 bg-brand-50 font-semibold text-brand-900"
                          : "border-slate-200 bg-white hover:border-brand-300"
                      }`}
                    >
                      <input
                        type="radio"
                        className="h-4 w-4 accent-brand-600"
                        checked={answers[q.id!] === opt}
                        onChange={() => setAnswer(q.id!, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ))}

            {q.type === "multi_choice" && (
              <div className="mt-4 space-y-2">
                {(q.options || []).map((opt) => {
                  const checked = (answers[q.id!] || "").split("||").includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                        checked
                          ? "border-brand-600 bg-brand-50 font-semibold text-brand-900"
                          : "border-slate-200 bg-white hover:border-brand-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-600"
                        checked={checked}
                        onChange={() => toggleMulti(q.id!, opt)}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            )}

            {q.type === "short_text" && (
              <input
                className="mt-4 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                value={answers[q.id!] || ""}
                onChange={(e) => setAnswer(q.id!, e.target.value)}
              />
            )}

            {q.type === "long_text" && (
              <textarea
                rows={3}
                className="mt-4 w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                value={answers[q.id!] || ""}
                onChange={(e) => setAnswer(q.id!, e.target.value)}
              />
            )}

            {q.type === "number" && (
              <input
                type="number"
                className="mt-4 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                value={answers[q.id!] || ""}
                onChange={(e) => setAnswer(q.id!, e.target.value)}
              />
            )}
          </section>
        ))}

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-700 py-3.5 text-[15px] font-bold text-white transition hover:bg-brand-800 disabled:opacity-60"
        >
          {submitting ? "Mengirim..." : "Kirim penilaian"}
        </button>
      </form>
      </main>
    </>
  );
}
