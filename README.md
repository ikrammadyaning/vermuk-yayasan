# Attendance Face Verification

Prototype sistem absensi staff berbasis React + Vite dengan:

- Akun staff custom (TIDAK menggunakan Supabase Auth).
- Registrasi akun: nama, ID staff, username, password.
- Setelah registrasi, staff wajib mendaftarkan wajah melalui kamera.
- Session login disimpan di perangkat, sehingga staff tidak perlu login ulang setiap kali membuka absensi.
- Model A untuk lokasi: staff memilih lokasi secara manual sebelum GPS diperiksa.
- 4 lokasi resmi: Pusat, Cabang 1, Cabang 2, Cabang 3.
- Radius geofencing 100 meter per lokasi.
- Kamera hanya dibuka setelah lokasi dinyatakan valid.
- Riwayat absensi dipisahkan berdasarkan akun staff yang sedang login.

## Alur

### Staff baru

Login website → Buat akun → Daftarkan wajah → Dashboard → Absensi.

### Staff yang sudah memiliki akun

Buka website → Session masih aktif → Dashboard/Absensi → Pilih lokasi → Validasi GPS → Verifikasi wajah → Berhasil.

Staff tidak perlu memasukkan akun setiap kali melakukan absensi. Tombol Keluar tersedia di sidebar jika ingin mengakhiri session pada perangkat.

## Penyimpanan prototype

Versi ini menggunakan localStorage sebagai database prototype agar bisa langsung dijalankan tanpa dependency backend tambahan. Struktur service dipisahkan agar nantinya mudah dipindahkan ke database server/Supabase Database tanpa Supabase Auth.

Password tidak disimpan dalam bentuk plaintext; prototype menggunakan SHA-256 untuk penyimpanan lokal. Untuk production, gunakan backend dengan password hashing yang sesuai (Argon2/bcrypt/scrypt), session server-side/secure token, dan jangan pernah mempercayai employee ID dari client.

## Face verification

Kamera dan proses enrollment sudah terhubung dengan akun staff. Namun modul `src/services/faceVerification.js` masih merupakan layer prototype: ia memastikan akun mempunyai enrollment dan mengambil frame kamera baru, tetapi BELUM melakukan face embedding/matching biometrik sungguhan.

Sebelum production, ganti modul tersebut dengan face embedding + liveness detection dan lakukan matching terhadap template wajah milik akun yang sedang login. Jangan menyimpan raw face image tanpa perlindungan, persetujuan, dan kebijakan penyimpanan yang sesuai.

## Jalankan

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Penting setelah upgrade face matching

Versi sebelumnya hanya menyimpan snapshot dan belum melakukan pencocokan wajah. Versi ini menyimpan **face descriptor 128-dimensi** untuk setiap akun dan membandingkan descriptor kamera dengan descriptor akun yang sedang login.

Jika akun lama pernah didaftarkan menggunakan versi prototype, descriptor belum tersedia. Untuk akun yang ingin didaftarkan ulang, jalankan di Supabase SQL Editor (contoh akun `ikram`):

```sql
update public.employees
set face_enrolled = false, face_descriptor = null
where username = 'ikram';
```

Lalu login ulang dan daftarkan wajah kembali. Untuk mereset semua akun lama:

```sql
update public.employees
set face_enrolled = false, face_descriptor = null;
```

Model wajah dimuat dari CDN `@vladmandic/face-api`. Pastikan perangkat memiliki koneksi internet saat pertama kali membuka halaman enrollment/verifikasi.

## Perbaikan check-out (8 jam)

Jika aplikasi yang sudah online gagal saat check-out, perbarui fungsi RPC di proyek Supabase yang benar:

1. Buka `supabase/fix_record_checkout.sql`.
2. Salin seluruh SQL tersebut ke Supabase Dashboard → SQL Editor pada proyek yang dipakai oleh `VITE_SUPABASE_URL`.
3. Jalankan SQL. File ini hanya mengganti fungsi `record_checkout`; tidak menghapus tabel atau riwayat absensi.
4. Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di konfigurasi deploy menunjuk ke proyek Supabase yang sama.
5. Deploy ulang aplikasi setelah memastikan variabel environment di Netlify benar.

Fungsi ini memakai struktur tabel yang ada pada `supabase/schema.sql` (`type`, `check_in_id`, dan `timestamp`) dan membatasi check-out hingga minimal 8 jam setelah check-in. Jangan menjalankan perubahan skema pada database produksi sebelum memastikan proyek Supabase yang dipilih benar dan melakukan backup.

**Catatan keamanan:** konfigurasi akun custom dan kebijakan RLS permisif yang ada di prototype ini belum cocok untuk aplikasi produksi. Password/session, verifikasi identitas, serta penulisan absensi sebaiknya dipindahkan ke backend tepercaya.
