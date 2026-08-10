# Platform Kuesioner Internal — BDK Makassar

Aplikasi survei internal yang bisa dikelola penuh dari admin: buat kuesioner dengan
pertanyaan bertipe apapun, kelola daftar pegawai (nama/NIP/jabatan) termasuk import CSV,
dan pantau siapa saja yang belum mengisi.

## Fitur
- **Manajemen Kuesioner**: admin bisa membuat banyak kuesioner, mengaktifkan/menonaktifkan,
  dan menambah pertanyaan dengan tipe: Skala 1–5, Pilihan Tunggal, Pilihan Ganda (checkbox),
  Dropdown, Teks Singkat, Teks Panjang, Angka.
- **Manajemen Pengguna**: tambah/ubah/hapus pegawai (nama, NIP, jabatan), plus **import CSV**
  massal (otomatis update jika NIP sudah ada).
- **Pelacakan Pengisian**: dashboard hasil menampilkan siapa yang **sudah** dan **belum**
  mengisi tiap kuesioner, lengkap dengan agregasi jawaban per pertanyaan dan ekspor CSV.
- **Identifikasi responden**: saat mengisi survei, pegawai mencari namanya sendiri
  (dari daftar yang diinput admin) sebelum menjawab — setiap pegawai hanya bisa mengisi
  sekali per kuesioner.

## 1. Menjalankan secara lokal
```bash
npm install
npm run dev
```
Buat file `.env.local` berisi `DATABASE_URL` (lihat bagian Database di bawah) supaya data
tersimpan. Tanpa itu aplikasi akan error saat submit karena database wajib untuk fitur ini.

## 2. Deploy ke Vercel
1. Push folder ini ke repository GitHub, lalu import di https://vercel.com/new.
2. **Sambungkan database Neon:**
   - Tab **Storage** di project Vercel → **Create Database**/**Connect** → pilih **Neon**,
     hubungkan ke project ini. Vercel otomatis menambahkan `DATABASE_URL`.
   - Atau, jika sudah punya project Neon sendiri (console.neon.tech), salin connection
     string-nya dan tempel manual sebagai `DATABASE_URL` di Settings → Environment Variables.
3. **Atur kata sandi admin**: tambahkan environment variable `ADMIN_KEY` dengan nilai bebas,
   misalnya `bdk-monev-2026`. Ini melindungi seluruh halaman `/admin`.
4. Redeploy project agar environment variable terbaca. Tabel database dibuat otomatis saat
   pertama kali API diakses — tidak perlu migrasi manual.

## 3. Alur pemakaian
1. Buka `/admin`, masuk dengan `ADMIN_KEY`.
2. Buka menu **Pengguna** → tambah pegawai satu-satu, atau **Import CSV** (header wajib:
   `nama,nip,jabatan`). Template bisa diunduh langsung dari halaman ini.
3. Buka menu **Kuesioner** → buat kuesioner baru, lalu di tab **Pertanyaan** tambahkan
   pertanyaan sesuai kebutuhan (pilih tipe, isi pilihan jawaban jika perlu, tandai wajib
   isi atau tidak), lalu **Simpan Pertanyaan**.
4. Salin tautan survei yang tersedia di halaman kuesioner (`/survey/<id>`) dan bagikan ke
   pegawai — bisa lewat email, grup chat, dsb. Kuesioner juga otomatis muncul di halaman
   utama (`/`) selama berstatus **Aktif**.
5. Pegawai membuka tautan, mencari namanya di daftar, lalu mengisi jawaban. Setiap NIP
   hanya bisa mengisi satu kali per kuesioner.
6. Kembali ke tab **Hasil** di halaman kuesioner untuk melihat: jumlah yang sudah/belum
   mengisi (lengkap dengan daftar nama yang belum), agregasi tiap pertanyaan (rata-rata
   untuk skala/angka, distribusi untuk pilihan, daftar jawaban untuk teks bebas), dan
   tombol **Unduh CSV** untuk data mentah.

## Struktur proyek
```
app/
  page.tsx                        # landing publik: daftar kuesioner aktif
  survey/[id]/page.tsx            # halaman pengisian survei (identitas + form dinamis)
  admin/layout.tsx                # gerbang kata sandi admin + navigasi
  admin/kuesioner/page.tsx        # daftar & buat kuesioner
  admin/kuesioner/[id]/page.tsx   # builder pertanyaan + dashboard hasil
  admin/users/page.tsx            # manajemen pengguna + import CSV
  api/questionnaires/active/      # publik: daftar kuesioner aktif
  api/survey/[id]/                # publik: detail kuesioner, submit jawaban
  api/admin/users/                # CRUD pengguna, import CSV
  api/admin/kuesioner/            # CRUD kuesioner, pertanyaan, hasil, ekspor CSV
lib/
  db.ts        # akses database Neon (skema dibuat otomatis)
  types.ts     # tipe pertanyaan & definisi data bersama
  adminAuth.ts # verifikasi ADMIN_KEY di API
  useAdminKey.ts # hook client menyimpan ADMIN_KEY di localStorage
```

## Catatan keamanan
`ADMIN_KEY` adalah proteksi sederhana (satu kata sandi bersama), cukup untuk pemakaian
internal kantor. Untuk kebutuhan yang lebih ketat (login per-admin, audit log), perlu
penambahan sistem autentikasi terpisah.
