"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminKey } from "@/lib/useAdminKey";
import type { UserDef } from "@/lib/types";

export default function UsersPage() {
  const { key, adminFetch } = useAdminKey();
  const [users, setUsers] = useState<UserDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nama: "", nip: "", jabatan: "" });
  const [error, setError] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nama: "", nip: "", jabatan: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/users");
    const json = await res.json();
    setUsers(json.users || []);
    setLoading(false);
  }

  useEffect(() => {
    if (key) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.nama || !form.nip) {
      setError("Nama dan NIP wajib diisi");
      return;
    }
    const res = await adminFetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal menambah pengguna");
      return;
    }
    setForm({ nama: "", nip: "", jabatan: "" });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus pengguna ini? Jawaban survei terkait juga akan terhapus.")) return;
    await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(u: UserDef) {
    setEditingId(u.id!);
    setEditForm({ nama: u.nama, nip: u.nip, jabatan: u.jabatan || "" });
  }

  async function saveEdit(id: number) {
    await adminFetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    load();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    const text = await file.text();
    const res = await adminFetch("/api/admin/users/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: text }),
    });
    const json = await res.json();
    setImporting(false);
    if (!res.ok) {
      setImportMsg(json.error || "Gagal impor");
    } else {
      setImportMsg(
        `Berhasil memproses ${json.processed}/${json.total} baris.` +
          (json.errors?.length ? ` ${json.errors.length} baris bermasalah.` : "")
      );
      load();
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadTemplate() {
    const csv = "nama,nip,jabatan\nContoh Nama,198001012000031001,Widyaiswara Ahli Muda\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-pengguna.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-bold text-slate-900">Manajemen Pengguna</h1>
      <p className="mt-1 text-sm text-slate-500">
        Daftar pegawai yang berhak mengisi kuesioner, lengkap dengan NIP dan jabatan.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Tambah Pengguna</h2>
          <form onSubmit={handleAdd} className="mt-3 space-y-2">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="Nama"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="NIP"
              value={form.nip}
              onChange={(e) => setForm({ ...form, nip: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="Jabatan"
              value={form.jabatan}
              onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Tambah
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Import CSV</h2>
          <p className="mt-1 text-xs text-slate-500">
            File CSV dengan header <code className="rounded bg-slate-100 px-1">nama,nip,jabatan</code>.
            Pengguna dengan NIP yang sudah ada akan diperbarui datanya.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={downloadTemplate}
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Unduh Template
            </button>
            <label className="cursor-pointer rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700">
              {importing ? "Mengimpor..." : "Pilih File CSV"}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
                disabled={importing}
              />
            </label>
          </div>
          {importMsg && <p className="mt-2 text-xs text-slate-600">{importMsg}</p>}
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">NIP</th>
              <th className="px-4 py-3">Jabatan</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Belum ada pengguna.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  {editingId === u.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editForm.nama}
                          onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editForm.nip}
                          onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          value={editForm.jabatan}
                          onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        <button
                          onClick={() => saveEdit(u.id!)}
                          className="mr-2 text-xs font-medium text-brand-600 hover:underline"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-400 hover:underline"
                        >
                          Batal
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5">{u.nama}</td>
                      <td className="px-4 py-2.5 text-slate-500">{u.nip}</td>
                      <td className="px-4 py-2.5 text-slate-500">{u.jabatan}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        <button
                          onClick={() => startEdit(u)}
                          className="mr-3 text-xs font-medium text-brand-600 hover:underline"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => handleDelete(u.id!)}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Hapus
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
