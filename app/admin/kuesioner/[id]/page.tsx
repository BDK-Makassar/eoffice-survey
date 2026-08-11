"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminKey } from "@/lib/useAdminKey";
import { QUESTION_TYPES, questionNeedsOptions, questionTypeLabel } from "@/lib/types";
import type { QuestionDef } from "@/lib/types";

interface Meta {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
}

function emptyQuestion(order: number): QuestionDef {
  return { type: "short_text", label: "", options: null, required: true, order_index: order };
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function KuesionerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { key, adminFetch } = useAdminKey();

  const [tab, setTab] = useState<"builder" | "hasil">("builder");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [questions, setQuestions] = useState<QuestionDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const [results, setResults] = useState<any | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await adminFetch(`/api/admin/kuesioner/${id}`);
    const json = await res.json();
    setMeta(json.questionnaire);
    setQuestions(json.questions?.length ? json.questions : []);
    setLoading(false);
  }

  async function loadResults() {
    setResultsLoading(true);
    const res = await adminFetch(`/api/admin/kuesioner/${id}/results`);
    const json = await res.json();
    setResults(json);
    setResultsLoading(false);
  }

  useEffect(() => {
    if (key) load();
    setOrigin(window.location.origin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (tab === "hasil" && key && !results) loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, key]);

  function updateQuestion(idx: number, patch: Partial<QuestionDef>) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion(qs.length)]);
  }

  function removeQuestion(idx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    setQuestions((qs) => {
      const next = [...qs];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return qs;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  async function saveMeta() {
    if (!meta) return;
    setSaving(true);
    await adminFetch(`/api/admin/kuesioner/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });
    setSaving(false);
    setSaveMsg("Info kuesioner tersimpan.");
    setTimeout(() => setSaveMsg(null), 2000);
  }

  async function saveQuestions() {
    setSaving(true);
    const res = await adminFetch(`/api/admin/kuesioner/${id}/questions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg("Pertanyaan tersimpan.");
      load();
    } else {
      const json = await res.json();
      setSaveMsg(json.error || "Gagal menyimpan pertanyaan.");
    }
    setTimeout(() => setSaveMsg(null), 3000);
  }

  const surveyUrl = `${origin}/survey/${id}`;

  if (loading || !meta) {
    return <main className="mx-auto max-w-4xl px-4 py-8 text-sm text-slate-400">Memuat...</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
        <a href="/admin/kuesioner" className="hover:underline">
          Kuesioner
        </a>
        <span>/</span>
        <span className="text-slate-600">{meta.title}</span>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab("builder")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "builder" ? "border-b-2 border-brand-600 text-brand-700" : "text-slate-500"
          }`}
        >
          Pertanyaan
        </button>
        <button
          onClick={() => setTab("hasil")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "hasil" ? "border-b-2 border-brand-600 text-brand-700" : "text-slate-500"
          }`}
        >
          Hasil
        </button>
      </div>

      {tab === "builder" && (
        <div className="mt-6 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">Info Kuesioner</h2>
            <input
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            />
            <textarea
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              rows={2}
              value={meta.description}
              onChange={(e) => setMeta({ ...meta, description: e.target.value })}
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={meta.is_active}
                onChange={(e) => setMeta({ ...meta, is_active: e.target.checked })}
              />
              Aktif (bisa diisi pegawai)
            </label>
            <button
              onClick={saveMeta}
              disabled={saving}
              className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
            >
              Simpan Info
            </button>

            {meta.is_active && (
              <div className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-xs text-brand-800">
                Tautan survei:{" "}
                <a href={surveyUrl} target="_blank" className="font-medium underline">
                  {surveyUrl}
                </a>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Pertanyaan</h2>
              <button
                onClick={addQuestion}
                className="rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              >
                + Tambah Pertanyaan
              </button>
            </div>

            <div className="space-y-4">
              {questions.length === 0 && (
                <p className="text-sm text-slate-400">Belum ada pertanyaan.</p>
              )}
              {questions.map((q, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-2 text-xs font-semibold text-slate-400">#{idx + 1}</span>
                    <div className="flex-1 space-y-2">
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                        placeholder="Teks pertanyaan"
                        value={q.label}
                        onChange={(e) => updateQuestion(idx, { label: e.target.value })}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none"
                          value={q.type}
                          onChange={(e) => updateQuestion(idx, { type: e.target.value as any })}
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                          />
                          Wajib diisi
                        </label>
                      </div>
                      {questionNeedsOptions(q.type) && (
                        <textarea
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                          placeholder={"Satu pilihan per baris, contoh:\nSangat Setuju\nSetuju\nTidak Setuju"}
                          rows={3}
                          value={(q.options || []).join("\n")}
                          onChange={(e) =>
                            updateQuestion(idx, {
                              options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                            })
                          }
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveQuestion(idx, -1)}
                        disabled={idx === 0}
                        className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveQuestion(idx, 1)}
                        disabled={idx === questions.length - 1}
                        className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeQuestion(idx)}
                        className="rounded border border-red-200 px-1.5 py-0.5 text-xs text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={saveQuestions}
                disabled={saving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Pertanyaan"}
              </button>
              {saveMsg && <span className="text-xs text-slate-500">{saveMsg}</span>}
            </div>
          </section>
        </div>
      )}

      {tab === "hasil" && (
        <div className="mt-6 space-y-6">
          {resultsLoading || !results ? (
            <p className="text-sm text-slate-400">Memuat hasil...</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-slate-500">Total Pengguna</p>
                    <p className="text-2xl font-bold text-slate-900">{results.completion.totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Sudah Mengisi</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {results.completion.totalResponded}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Belum Mengisi</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {results.completion.totalUsers - results.completion.totalResponded}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/admin/kuesioner/${id}/export?key=${encodeURIComponent(key || "")}`}
                    className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    Unduh CSV
                  </a>
                  <a
                    href={`/api/admin/kuesioner/${id}/export/xlsx?key=${encodeURIComponent(key || "")}`}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Unduh Excel (.xlsx)
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                  Belum Mengisi ({results.completion.notResponded.length})
                </h3>
                {results.completion.notResponded.length === 0 ? (
                  <p className="text-xs text-slate-400">Semua pengguna sudah mengisi. 🎉</p>
                ) : (
                  <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-sm">
                    {results.completion.notResponded.map((u: any) => (
                      <li key={u.id} className="flex justify-between py-1.5">
                        <span>{u.nama}</span>
                        <span className="text-xs text-slate-400">
                          {u.nip} &middot; {u.jabatan}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-4">
                {results.results.map((item: any) => (
                  <div key={item.question.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-1 text-sm font-semibold text-slate-800">{item.question.label}</h3>
                    <p className="mb-3 text-xs text-slate-400">
                      {questionTypeLabel(item.question.type)} &middot; {item.answers.length} jawaban
                    </p>
                    <QuestionResult question={item.question} answers={item.answers} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}

function QuestionResult({ question, answers }: { question: QuestionDef; answers: { value: string; nama: string }[] }) {
  if (answers.length === 0) return <p className="text-xs text-slate-400">Belum ada jawaban.</p>;

  if (question.type === "scale_1_5" || question.type === "number") {
    const nums = answers.map((a) => Number(a.value)).filter((n) => !isNaN(n));
    const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "-";
    return <p className="text-2xl font-bold text-brand-700">{avg}{question.type === "scale_1_5" ? " / 5" : ""}</p>;
  }

  if (question.type === "single_choice" || question.type === "dropdown" || question.type === "multi_choice") {
    const counts: Record<string, number> = {};
    for (const a of answers) {
      const values = question.type === "multi_choice" ? a.value.split("||").filter(Boolean) : [a.value];
      for (const v of values) counts[v] = (counts[v] || 0) + 1;
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...entries.map(([, c]) => c));
    return (
      <div>
        {entries.map(([label, count]) => (
          <Bar key={label} label={label} count={count} max={max} />
        ))}
      </div>
    );
  }

  // short_text / long_text
  return (
    <ul className="max-h-56 space-y-1.5 overflow-y-auto text-sm">
      {answers.map((a, i) => (
        <li key={i} className="rounded bg-slate-50 px-3 py-1.5">
          <span className="text-slate-700">{a.value}</span>
          <span className="ml-2 text-xs text-slate-400">— {a.nama}</span>
        </li>
      ))}
    </ul>
  );
}
