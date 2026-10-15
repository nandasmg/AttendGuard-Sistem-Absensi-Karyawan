
# AttendGuard

AttendGuard adalah aplikasi presensi karyawan berbasis Next.js App Router, React, TypeScript, Bootstrap, dan MySQL.

## Kebutuhan

- Node.js 20.9 atau lebih baru
- npm
- Laragon dengan MySQL aktif
- Database `attendguard` beserta tabel yang diperlukan

## Menjalankan aplikasi

1. Jalankan MySQL melalui Laragon.
2. Pastikan database `attendguard` sudah tersedia.
3. Pastikan `lib/db.ts` menggunakan koneksi MySQL lokal Laragon.
4. Pastikan `.env.local` memiliki `SESSION_SECRET` yang kuat dan rahasia.

Pasang dependency dan jalankan aplikasi:

```sh
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Membuat akun admin

Atur variabel `ADMIN_USERNAME` dan `ADMIN_PASSWORD` di lingkungan proses. Password admin harus minimal 12 karakter.

Kemudian jalankan:

```sh
node --env-file=.env.local scripts/create-admin.js
```

Skrip membuat akun admin baru. Username yang sudah ada tidak dapat digunakan kembali oleh skrip ini.

## Struktur utama

- `app/`: halaman dan API aplikasi.
- `lib/db.ts`: koneksi MySQL.
- `lib/auth.ts`: autentikasi pengguna.
- `lib/session.ts`: pengelolaan sesi.
- `scripts/`: skrip administrasi.
- `public/`: aset statis dan file unggahan.

## Perintah

- `npm run dev`: menjalankan server pengembangan.
- `npm run lint`: menjalankan ESLint.
- `npm run build`: membuat build produksi.
- `npm run start`: menjalankan build produksi.

## Data dan keamanan

- Jangan memasukkan password atau rahasia sesi ke Git.
- Cadangkan database MySQL secara berkala.
- Cadangkan file unggahan yang diperlukan.
- Jangan menjalankan skrip pembuatan admin jika tidak ingin menambahkan akun baru.
