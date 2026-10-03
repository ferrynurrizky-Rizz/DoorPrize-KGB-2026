# Doorprize Akhir Tahun 2026

Aplikasi undian doorprize statis untuk GitHub Pages.

## Data
- Sumber: sheet `List Peserta` dari file DATA KARYAWAN 2026 AKHIR TAHUN
- Peserta: 68 orang
- Hadiah: 20
- Pemenang unik: setiap peserta yang sudah menang otomatis dikeluarkan dari pool.

## Cara upload ke GitHub Pages
1. Buat repository baru di GitHub, misalnya `doorprize-akhir-tahun-2026`.
2. Upload **semua file** dalam folder ini:
   - `index.html`
   - `style.css`
   - `app.js`
   - `participants.js`
3. Buka **Settings → Pages**.
4. Pada Source pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/ (root)`, lalu Save.
6. Tunggu GitHub Pages selesai publish. URL biasanya:
   `https://USERNAME.github.io/doorprize-akhir-tahun-2026/`

## Sebelum acara
- Buka website.
- Isi nama 20 hadiah di bagian **Pengaturan Hadiah**.
- Klik **Simpan Hadiah**.
- Klik **Layar Penuh**.
- Klik **UNDI SEKARANG** untuk setiap hadiah.
- Tombol Space juga bisa dipakai untuk mengundi.
- Setelah selesai, klik **CSV** untuk menyimpan daftar pemenang.

## Catatan
Data peserta tertanam di `participants.js`. Tidak diperlukan Google Sheets, server, database, atau login agar aplikasi bisa berjalan di GitHub Pages.
