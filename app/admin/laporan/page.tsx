"use client";

import { useEffect, useState } from "react";
import { useAdminKey } from "@/lib/useAdminKey";
import { indicatorRecap, overallIkm } from "@/lib/types";
import type { IndicatorRow } from "@/lib/types";

interface Sistem {
  id: number;
  title: string;
  nama: string;
  lingkup: string;
  totalUsers: number;
  pegawai: number;
  umum: number;
  publicMode: boolean;
  responded: { submitted_at: string }[];
  ikm: ReturnType<typeof overallIkm>;
  indikator: IndicatorRow[];
}

// Keterkaitan sistem dengan lingkup indikator SPBE PMPZI (berdasarkan judul kuesioner).
function lingkupSistem(title: string) {
  const t = title.toLowerCase();
  if (t.includes("e-office")) return "Pengukuran kinerja unit; operasionalisasi SDM";
  if (t.includes("pjj")) return "Pemberian layanan kepada publik (penyelenggaraan pelatihan)";
  if (t.includes("website")) return "Pemberian layanan kepada publik (keterbukaan informasi)";
  if (t.includes("e-library")) return "Operasionalisasi SDM (pengembangan kompetensi); layanan perpustakaan";
  return "—";
}

function namaSistem(title: string) {
  return title.replace(/^Survei Kepuasan Pengguna\s+/i, "");
}

// Rekomendasi awal per indikator; tim monev menyempurnakan sesuai temuan.
function rekomendasi(indikator: string, sistem: string) {
  const i = indikator.toLowerCase();
  if (i.includes("kemudahan")) return `Menyederhanakan alur dan menu ${sistem}, menyusun/memperbarui panduan penggunaan, serta melaksanakan sosialisasi atau bimbingan teknis bagi pengguna.`;
  if (i.includes("kecepatan")) return `Melakukan optimasi kinerja server, basis data, dan ukuran halaman/berkas ${sistem}.`;
  if (i.includes("keandalan")) return `Menginventarisasi kendala teknis ${sistem}, melakukan perbaikan, serta menetapkan pemantauan ketersediaan layanan secara berkala.`;
  if (i.includes("informasi")) return `Menetapkan jadwal dan penanggung jawab pemutakhiran konten ${sistem}, serta melengkapi informasi yang belum tersedia.`;
  if (i.includes("koleksi")) return `Menambah koleksi pustaka yang relevan dengan kebutuhan tugas dan pengembangan kompetensi pegawai, serta memperbaiki data bibliografi.`;
  if (i.includes("fitur")) return `Menghimpun kebutuhan fitur dari pengguna dan menyusun rencana pengembangan ${sistem}.`;
  if (i.includes("manfaat")) return `Meningkatkan pemanfaatan ${sistem} melalui sosialisasi dan integrasi dengan proses kerja.`;
  return `Menindaklanjuti hasil evaluasi indikator ${indikator} pada ${sistem}.`;
}

const fmt = (n: number) => n.toFixed(2).replace(".", ",");
const tgl = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const TITIK = "....................";

export default function LaporanMonevPage() {
  const { key, adminFetch } = useAdminKey();
  const [data, setData] = useState<Sistem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    (async () => {
      try {
        const list = await (await adminFetch("/api/admin/kuesioner")).json();
        const aktif = (list.questionnaires || []).filter((q: any) => q.is_active).reverse();
        const out: Sistem[] = [];
        for (const q of aktif) {
          const r = await (await adminFetch(`/api/admin/kuesioner/${q.id}/results`)).json();
          out.push({
            id: q.id,
            title: q.title,
            nama: namaSistem(q.title),
            lingkup: lingkupSistem(q.title),
            totalUsers: r.completion.totalUsers,
            pegawai: r.completion.totalResponded,
            umum: r.completion.totalPublic || 0,
            publicMode: !!q.public_mode,
            responded: r.completion.responded,
            ikm: overallIkm(r.results),
            indikator: indicatorRecap(r.results),
          });
        }
        setData(out);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [key, adminFetch]);

  if (error) return <main className="p-10 text-sm text-red-600">{error}</main>;
  if (!data) return <main className="p-10 text-center text-sm text-slate-400">Menyusun laporan...</main>;

  const tanggal = data.flatMap((s) => s.responded.map((r) => new Date(r.submitted_at))).sort((a, b) => +a - +b);
  const periode = tanggal.length ? `${tgl(tanggal[0])} s.d. ${tgl(tanggal[tanggal.length - 1])}` : TITIK;
  const tahun = new Date().getFullYear();
  const temuan = data.flatMap((s) =>
    s.indikator
      .filter((r) => (r.nilai !== null && r.nilai < 76.61) || (r.positif !== null && r.positif < 75))
      .map((r) => ({ sistem: s.nama, r }))
  );
  const adaData = tanggal.length > 0;

  const th = "border border-slate-400 px-2 py-1 text-left font-semibold bg-slate-100";
  const td = "border border-slate-400 px-2 py-1 align-top";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 print:hidden">
        <span>
          Draf terisi otomatis dari hasil survei. Lengkapi bagian bertanda titik-titik, lalu cetak atau simpan sebagai PDF.
        </span>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
        >
          Cetak / Simpan PDF
        </button>
      </div>

      <article className="space-y-5 bg-white text-[13px] leading-relaxed text-slate-900 print:text-[11pt]">
        <header className="text-center">
          <h1 className="text-base font-bold uppercase">
            Laporan Monitoring dan Evaluasi
            <br />
            Pemanfaatan Teknologi Informasi
          </h1>
          <p className="font-semibold">Balai Diklat Keagamaan Makassar</p>
          <p>Tahun {tahun}</p>
        </header>

        <section>
          <h2 className="font-bold">BAB I PENDAHULUAN</h2>
          <h3 className="mt-2 font-semibold">A. Latar Belakang</h3>
          <p className="text-justify">
            Peraturan Presiden Nomor 95 Tahun 2018 tentang Sistem Pemerintahan Berbasis Elektronik (SPBE) mendorong instansi
            pemerintah memanfaatkan teknologi informasi untuk mewujudkan tata kelola yang efektif, efisien, transparan, dan
            akuntabel. Selanjutnya, Peraturan Menteri PANRB Nomor 90 Tahun 2021 tentang Pembangunan dan Evaluasi Zona Integritas
            menetapkan bahwa pada area Penataan Tatalaksana, unit kerja perlu melakukan monitoring dan evaluasi terhadap
            pemanfaatan teknologi informasi dalam pengukuran kinerja unit, operasionalisasi SDM, dan pemberian layanan kepada
            publik.
          </p>
          <p className="mt-2 text-justify">
            Balai Diklat Keagamaan (BDK) Makassar telah memanfaatkan sejumlah sistem informasi, yaitu{" "}
            {data.map((s) => s.nama).join(", ")}. Untuk mengetahui sejauh mana sistem tersebut memenuhi kebutuhan pengguna dan
            mendukung pelaksanaan tugas, dilaksanakan monitoring dan evaluasi melalui survei kepuasan pengguna.
          </p>

          <h3 className="mt-3 font-semibold">B. Maksud dan Tujuan</h3>
          <p className="text-justify">
            Monitoring dan evaluasi ini dimaksudkan sebagai bahan pengambilan keputusan dalam pengembangan sistem informasi di
            lingkungan BDK Makassar, dengan tujuan:
          </p>
          <ol className="ml-6 list-decimal">
            <li>mengukur tingkat kepuasan pengguna terhadap setiap sistem informasi;</li>
            <li>mengidentifikasi kendala dan kebutuhan pengguna dalam pemanfaatan sistem informasi;</li>
            <li>menyusun rekomendasi dan rencana tindak lanjut perbaikan.</li>
          </ol>

          <h3 className="mt-3 font-semibold">C. Ruang Lingkup</h3>
          <table className="mt-1 w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>No</th>
                <th className={th}>Sistem Informasi</th>
                <th className={th}>Lingkup Pemanfaatan TI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s, i) => (
                <tr key={s.id}>
                  <td className={td}>{i + 1}</td>
                  <td className={td}>{s.nama}</td>
                  <td className={td}>{s.lingkup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-bold">BAB II METODE</h2>
          <ol className="ml-6 list-decimal space-y-1 text-justify">
            <li>
              <b>Instrumen:</b> kuesioner daring pada aplikasi survei BDK Makassar, satu kuesioner untuk setiap sistem,
              terdiri atas pertanyaan skala kepuasan 1–4 (1 Tidak Puas, 2 Kurang Puas, 3 Puas, 4 Sangat Puas), pertanyaan
              pilihan tunggal, dan pertanyaan isian hambatan serta saran.
            </li>
            <li>
              <b>Responden:</b> pegawai BDK Makassar sebanyak {data[0]?.totalUsers ?? TITIK} orang
              {data.some((s) => s.publicMode) && (
                <>
                  , ditambah responden umum (peserta/alumni pelatihan, ASN Kementerian Agama, dan masyarakat) untuk{" "}
                  {data.filter((s) => s.publicMode).map((s) => s.nama).join(" dan ")} sebagai sistem layanan kepada publik
                </>
              )}
              .
            </li>
            <li>
              <b>Periode pengisian:</b> {periode}.
            </li>
            <li>
              <b>Indikator:</b> Kepuasan Umum, Kemudahan Penggunaan, Kesesuaian Fitur/Informasi, Keandalan, Kecepatan &amp;
              Efisiensi, Manfaat, dan Masukan.
            </li>
            <li>
              <b>Pengolahan data:</b> rata-rata setiap pertanyaan skala 1–4 dikonversi menjadi nilai 25–100 (dikali 25)
              mengacu pada Peraturan Menteri PANRB Nomor 14 Tahun 2017, dengan kategori mutu A (88,31–100; Sangat Baik), B
              (76,61–88,30; Baik), C (65,00–76,60; Kurang Baik), dan D (25,00–64,99; Tidak Baik). Pertanyaan pilihan tunggal
              dihitung persentase jawaban positif (dua pilihan teratas).
            </li>
            <li>
              <b>Target:</b> nilai indeks minimal Mutu B (76,61) dan jawaban positif minimal 75%.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold">BAB III HASIL MONITORING DAN EVALUASI</h2>
          <h3 className="mt-2 font-semibold">A. Partisipasi Responden dan Indeks Kepuasan</h3>
          <table className="mt-1 w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Sistem Informasi</th>
                <th className={th}>Responden Pegawai</th>
                <th className={th}>Partisipasi Pegawai</th>
                <th className={th}>Responden Umum</th>
                <th className={th}>Nilai Indeks</th>
                <th className={th}>Mutu</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td className={td}>{s.nama}</td>
                  <td className={td}>
                    {s.pegawai} dari {s.totalUsers}
                  </td>
                  <td className={td}>{s.totalUsers ? fmt((s.pegawai / s.totalUsers) * 100) : "0"}%</td>
                  <td className={td}>{s.publicMode ? s.umum : "—"}</td>
                  <td className={td}>{s.ikm ? fmt(s.ikm.nilai) : "—"}</td>
                  <td className={td}>{s.ikm ? `${s.ikm.mutu} (${s.ikm.kinerja})` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="mt-3 font-semibold">B. Hasil per Indikator</h3>
          {data.map((s, n) => (
            <div key={s.id} className="mt-2 break-inside-avoid">
              <p className="font-semibold">
                {n + 1}. {s.nama}
              </p>
              <table className="mt-1 w-full border-collapse">
                <thead>
                  <tr>
                    <th className={th}>Indikator</th>
                    <th className={th}>Nilai</th>
                    <th className={th}>Mutu</th>
                    <th className={th}>% Positif</th>
                    <th className={th}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {s.indikator
                    .filter((r) => !r.name.toLowerCase().includes("masukan"))
                    .map((r) => {
                      const ok =
                        (r.nilai === null || r.nilai >= 76.61) && (r.positif === null || r.positif >= 75);
                      const kosong = r.nilai === null && r.positif === null;
                      return (
                        <tr key={r.name}>
                          <td className={td}>{r.name}</td>
                          <td className={td}>{r.nilai !== null ? fmt(r.nilai) : "—"}</td>
                          <td className={td}>{r.mutu ?? "—"}</td>
                          <td className={td}>{r.positif !== null ? `${r.positif.toFixed(0)}%` : "—"}</td>
                          <td className={td}>{kosong ? "Belum ada data" : ok ? "Tercapai" : "Belum tercapai"}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ))}

          <h3 className="mt-3 font-semibold">C. Hambatan dan Saran Pengguna</h3>
          {data.map((s, n) => {
            const masukan = s.indikator.flatMap((r) => r.masukan);
            return (
              <div key={s.id} className="mt-1">
                <p className="font-semibold">
                  {n + 1}. {s.nama}
                </p>
                {masukan.length ? (
                  <ul className="ml-6 list-disc">
                    {masukan.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="ml-4 italic text-slate-500">Belum ada masukan.</p>
                )}
              </div>
            );
          })}
        </section>

        <section>
          <h2 className="font-bold">BAB IV ANALISIS DAN TEMUAN</h2>
          {!adaData ? (
            <p className="italic text-slate-500">
              Belum ada data survei yang masuk. Bagian ini terisi otomatis setelah pegawai mengisi kuesioner.
            </p>
          ) : temuan.length === 0 ? (
            <p className="text-justify">
              Seluruh indikator yang memiliki data telah mencapai target (nilai indeks minimal Mutu B dan jawaban positif
              minimal 75%). Hambatan dan saran pengguna pada Bab III huruf C tetap menjadi bahan perbaikan berkelanjutan.
            </p>
          ) : (
            <>
              <p className="text-justify">Indikator yang belum mencapai target adalah sebagai berikut:</p>
              <ol className="ml-6 list-decimal">
                {temuan.map(({ sistem, r }, i) => (
                  <li key={i}>
                    {sistem} — indikator {r.name}:{" "}
                    {[
                      r.nilai !== null && r.nilai < 76.61 && `nilai ${fmt(r.nilai)} (Mutu ${r.mutu})`,
                      r.positif !== null && r.positif < 75 && `jawaban positif ${r.positif.toFixed(0)}%`,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    .
                  </li>
                ))}
              </ol>
            </>
          )}
          <p className="mt-2">Analisis tim: {TITIK}{TITIK}{TITIK}</p>
        </section>

        <section>
          <h2 className="font-bold">BAB V REKOMENDASI DAN RENCANA TINDAK LANJUT</h2>
          <table className="mt-1 w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>No</th>
                <th className={th}>Sistem / Indikator</th>
                <th className={th}>Rekomendasi</th>
                <th className={th}>Penanggung Jawab</th>
                <th className={th}>Target Waktu</th>
              </tr>
            </thead>
            <tbody>
              {temuan.length ? (
                temuan.map(({ sistem, r }, i) => (
                  <tr key={i}>
                    <td className={td}>{i + 1}</td>
                    <td className={td}>
                      {sistem} / {r.name}
                    </td>
                    <td className={td}>{rekomendasi(r.name, sistem)}</td>
                    <td className={td}>{TITIK}</td>
                    <td className={td}>{TITIK}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className={td}>1</td>
                  <td className={td}>{TITIK}</td>
                  <td className={td}>{TITIK}</td>
                  <td className={td}>{TITIK}</td>
                  <td className={td}>{TITIK}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-bold">BAB VI PENUTUP</h2>
          <p className="text-justify">
            Demikian laporan monitoring dan evaluasi pemanfaatan teknologi informasi ini disusun sebagai bahan perbaikan
            berkelanjutan dan bukti pemenuhan indikator SPBE pada pembangunan Zona Integritas BDK Makassar. Monitoring dan
            evaluasi akan dilaksanakan secara berkala dan hasilnya ditindaklanjuti sesuai rencana di atas.
          </p>
        </section>

        <footer className="ml-auto w-64 pt-6 text-left">
          <p>Makassar, {TITIK}</p>
          <p>Kepala Balai Diklat Keagamaan Makassar,</p>
          <div className="h-20" />
          <p>{TITIK}{TITIK}</p>
          <p>NIP {TITIK}</p>
        </footer>
      </article>
    </main>
  );
}
