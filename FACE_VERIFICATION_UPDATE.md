# Update - Face Verification

Perubahan utama:
- Face verification sekarang menggunakan descriptor 128-dim dari face-api.
- Verifikasi memakai 3 frame kamera, bukan satu frame.
- Sistem menolak jika tidak ada wajah atau ada lebih dari satu wajah.
- Descriptor akun dibandingkan dengan descriptor kamera menggunakan Euclidean distance.
- Threshold default diperketat menjadi 0.45.
- Minimal 2 dari 3 frame harus cocok.
- Enrollment juga mengambil 3 frame dan membuat descriptor rata-rata.
- Tidak ada mock/pass otomatis pada verifikasi wajah.

Catatan:
Build belum dapat dijalankan di environment ini karena binary native Rolldown dari node_modules pada ZIP adalah binary yang tidak cocok dengan environment Linux ini. Source yang diubah tidak memerlukan dependency baru.
