"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { QuestionDef, UserDef } from "@/lib/types";

interface Meta {
  id: number;
  title: string;
  description: string;
}

const SCALE = [1, 2, 3, 4, 5];

export default function SurveyPage() {
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
          user_id: selectedUser!.id,
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
    return <main className="p-10 text-center text-sm text-slate-400">Memuat...</main>;
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-slate-500">{loadError}</p>
        <a href="/" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
          Kembali ke daftar kuesioner
        </a>
      </main>
    );
  }

  if (step === "done") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Terima kasih, {selectedUser?.nama}!</h1>
          <p className="mt-2 text-sm text-slate-600">Jawaban Anda untuk &ldquo;{meta?.title}&rdquo; telah tersimpan.</p>
        </div>
      </main>
    );
  }

  if (step === "identity") {
    return (
      <main className="mx-auto max-w-lg px-4 py-14">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">BDK Makassar</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{meta?.title}</h1>
        {meta?.description && <p className="mt-2 text-sm text-slate-600">{meta.description}</p>}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-medium text-slate-700">Cari nama atau NIP Anda</label>
          <input
            autoFocus
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
                className={`flex w-full flex-col rounded-lg border px-4 py-2.5 text-left text-sm transition ${
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
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          {selectedUser?.nama} &middot; {selectedUser?.jabatan}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{meta?.title}</h1>
        {meta?.description && <p className="mt-2 text-sm text-slate-600">{meta.description}</p>}
        <button
          onClick={() => setStep("identity")}
          className="mt-2 text-xs font-medium text-slate-400 hover:underline"
        >
          Bukan Anda? Ganti identitas
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((q, idx) => (
          <section key={q.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-medium text-slate-800">
              {idx + 1}. {q.label}
              {q.required && <span className="ml-1 text-red-500">*</span>}
            </p>

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
                <div className="mt-3 space-y-2">
                  {(q.options || []).map((opt) => (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition ${
                        answers[q.id!] === opt
                          ? "border-brand-600 bg-brand-50 text-brand-900"
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
              <div className="mt-3 space-y-2">
                {(q.options || []).map((opt) => {
                  const checked = (answers[q.id!] || "").split("||").includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition ${
                        checked
                          ? "border-brand-600 bg-brand-50 text-brand-900"
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
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                value={answers[q.id!] || ""}
                onChange={(e) => setAnswer(q.id!, e.target.value)}
              />
            )}

            {q.type === "long_text" && (
              <textarea
                rows={3}
                className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                value={answers[q.id!] || ""}
                onChange={(e) => setAnswer(q.id!, e.target.value)}
              />
            )}

            {q.type === "number" && (
              <input
                type="number"
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
          className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Mengirim..." : "Kirim Jawaban"}
        </button>
      </form>
    </main>
  );
}
