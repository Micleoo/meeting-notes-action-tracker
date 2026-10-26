# Cold Start — Meeting Notes → Action Tracker

Dokumen ini merangkum arah produk, pengalaman pengguna, rancangan data, dan arah visual MVP yang telah disetujui.

## 1. Ide Aplikasi

**Meeting Notes → Action Tracker** membantu tim mengubah hasil meeting menjadi tindak lanjut yang jelas dan dapat dipantau.

Masalah yang diselesaikan: setelah meeting, keputusan, pembagian pekerjaan, dan deadline sering tersebar di chat atau catatan pribadi. Akibatnya, follow-up terlambat, owner tidak jelas, dan topik yang sama dibahas berulang.

## 2. Product Requirements Document (PRD)

### Pengguna

Tim kerja kecil hingga menengah, seperti tim proyek, startup, organisasi, atau divisi perusahaan, yang rutin melakukan meeting dan membutuhkan tempat bersama untuk mencatat hasil meeting serta memantau tindak lanjutnya.

Semua anggota berada dalam satu **Workspace** dan memiliki hak kolaborasi setara: melihat Meeting, memperbarui Action item, serta mengundang anggota baru.

### Fitur MVP

1. **Meeting notes**
   - Buat Meeting dengan judul, waktu, catatan teks sederhana, dan Participant opsional.
   - Semua Member Workspace dapat melihat Meeting.
   - Meeting dapat diarsipkan dan dipulihkan tanpa menghapus Action item terkait.

2. **Action item dari Meeting**
   - Setiap Action item wajib berasal dari satu Meeting.
   - Action item memiliki judul, deskripsi opsional, satu Owner, deadline opsional, dan status: **Belum Mulai**, **Dikerjakan**, atau **Selesai**.

3. **Assignment dan pelacakan status**
   - Semua Member dapat menetapkan Owner dan memperbarui status Action item.
   - Dashboard menampilkan tugas pengguna, tugas mendekati atau melewati deadline, serta progres tim.

4. **Reminder deadline**
   - Beberapa Reminder dapat dibuat untuk satu Action item pada tanggal dan jam pilihan.
   - Reminder tampil di aplikasi dan dapat dikirim melalui email ke Member Workspace.
   - Email Reminder dapat dimatikan pada Workspace tertentu.

5. **Kolaborasi Workspace**
   - Login melalui Google atau email/kata sandi.
   - Anggota bergabung setelah menyetujui undangan email.
   - Deadline disimpan sebagai satu waktu global dan ditampilkan dalam zona waktu masing-masing pengguna.

### Out of Scope MVP

- AI untuk merangkum Meeting atau mengekstrak Action item otomatis.
- Rekaman Meeting, unggah audio, dan transkripsi.
- Integrasi kalender, Slack, Notion, atau tools pihak ketiga.
- Action item mandiri yang tidak berasal dari Meeting.
- Peran admin, approval workflow, dan izin granular.
- Editor rich text, template Meeting kompleks, dan daftar keputusan terstruktur.
- Analitik penggunaan, laporan kinerja tim, dan aplikasi mobile native.

### Asumsi Produk yang Disetujui

- MVP berfokus pada demo alur lengkap, bukan validasi adopsi jangka panjang.
- Satu Action item hanya memiliki satu Owner.
- Semua Member Workspace memiliki hak kolaborasi setara.
- Action item aktif milik Member yang keluar harus dialihkan.
- Penghapusan permanen Action item hanya dapat dilakukan pembuatnya, dengan konfirmasi; selain itu gunakan Archive yang dapat dipulihkan.
- Saat Action item ditandai selesai, pengguna memilih apakah Reminder tersisa dibatalkan atau dipertahankan.

## 3. User Persona

**Nama:** Dimas Pratama
**Peran:** Project Coordinator pada tim digital berisi 6 orang

### Kebutuhan

- Mencatat hasil Meeting di satu tempat.
- Menetapkan siapa mengerjakan apa dan kapan selesai.
- Memantau tindak lanjut tanpa perlu mengecek chat satu per satu.

### Masalah Utama

Setelah Meeting, keputusan dan pembagian pekerjaan biasanya tersebar di chat atau catatan pribadi. Dimas perlu sering mengingatkan anggota tim karena Owner, deadline, dan status pekerjaan tidak jelas.

**Asumsi:** Dimas membuat Meeting dan mengoordinasikan tindak lanjut, tetapi bukan admin khusus. Peran ini tetap memiliki hak yang setara dengan Member lain.

## 4. User Flow

1. **Halaman Login** — Dimas membuka aplikasi lalu masuk menggunakan Google atau email/kata sandi.
2. **Halaman Workspace** — Dimas memilih Workspace tim. Jika belum menjadi Member, ia membuka tautan undangan email dan menyetujuinya.
3. **Halaman Dashboard** — Dimas melihat Action item aktif, tugas mendekati deadline, tugas terlambat, dan progres tim.
4. **Halaman Daftar Meeting** — Dimas memilih tombol **Meeting Baru**.
5. **Halaman/Form Buat Meeting** — Dimas mengisi judul, waktu Meeting, catatan teks, serta Participant opsional, lalu menyimpan Meeting.
6. **Halaman Detail Meeting** — Dimas membaca catatan dan menambahkan Action item dari hasil diskusi.
7. **Form Action Item** — Dimas mengisi judul, deskripsi opsional, memilih satu Owner, menentukan deadline opsional, lalu menambahkan Reminder jika diperlukan.
8. **Halaman Detail Meeting** — Dimas meninjau daftar Action item dan memastikan semua tindak lanjut penting telah memiliki Owner.
9. **Halaman Dashboard / Action Items** — Owner melihat tugasnya lalu memperbarui status dari **Belum Mulai** ke **Dikerjakan**, dan ke **Selesai** saat pekerjaan selesai.
10. **Halaman Notifikasi** — Member menerima Reminder melalui aplikasi dan/atau email sesuai pengaturan Workspace. Saat Action item selesai, pengguna memilih membatalkan atau mempertahankan Reminder tersisa.

## 5. Wireframe Struktural

Fokus wireframe adalah urutan informasi dan elemen antarmuka, bukan warna atau gaya visual akhir.

### Halaman Login

1. Logo/nama aplikasi.
2. Judul dan deskripsi singkat manfaat aplikasi.
3. Tombol **Lanjut dengan Google**.
4. Pemisah “atau”.
5. Input email dan kata sandi.
6. Tombol **Masuk**.
7. Tautan daftar akun dan lupa kata sandi.

### Halaman Pilih Workspace

1. Header: logo, nama pengguna, dan menu akun.
2. Judul “Pilih Workspace”.
3. Daftar Workspace yang diikuti pengguna.
4. Tombol untuk memilih Workspace.
5. Tombol **Buat Workspace**.
6. Area untuk menerima undangan Workspace melalui tautan email.

### Halaman Dashboard

1. Header: pemilih Workspace, navigasi Meeting, Action Items, Notifikasi, dan menu akun.
2. Judul Dashboard serta tanggal saat ini.
3. Ringkasan progres: total Action item aktif, mendekati deadline, terlambat, dan selesai.
4. Bagian **Tugas Saya**.
5. Bagian **Mendekati Deadline**.
6. Bagian **Terlambat**.
7. Daftar ringkas progres tim atau Action item terbaru.
8. Tombol **Meeting Baru**.

### Halaman Daftar Meeting

1. Header dan navigasi utama.
2. Judul “Meeting”.
3. Tombol **Meeting Baru**.
4. Pencarian Meeting.
5. Filter status: aktif dan arsip.
6. Daftar kartu/baris Meeting berisi judul, waktu, pembuat, jumlah Action item, dan status Archive.
7. Empty state saat belum ada Meeting.

### Form Buat Meeting

1. Judul form “Buat Meeting Baru”.
2. Input judul Meeting.
3. Input tanggal dan waktu Meeting.
4. Area catatan teks sederhana.
5. Pemilih Participant opsional dari daftar Member Workspace.
6. Tombol **Batal** dan **Simpan Meeting**.

### Halaman Detail Meeting

1. Header dan breadcrumb menuju daftar Meeting.
2. Judul Meeting, waktu, pembuat, dan status Archive.
3. Tombol edit, arsip/pulihkan, dan menu tindakan tambahan.
4. Bagian Participant.
5. Bagian catatan Meeting.
6. Bagian Action item.
7. Tombol **Tambah Action Item**.
8. Daftar Action item berisi judul, Owner, deadline, status, dan jumlah Reminder.
9. Empty state saat belum ada Action item.

### Form Action Item

1. Judul form “Tambah/Edit Action Item”.
2. Input judul Action item.
3. Area deskripsi opsional.
4. Pemilih satu Owner dari Member Workspace.
5. Input deadline opsional.
6. Pemilih status: Belum Mulai, Dikerjakan, atau Selesai.
7. Bagian Reminder: daftar Reminder yang sudah ada dan tombol **Tambah Reminder**.
8. Tombol **Batal** dan **Simpan Action Item**.

### Halaman Action Items

1. Header dan navigasi utama.
2. Judul “Action Items”.
3. Filter Owner, status, deadline, Meeting, serta status Archive.
4. Pencarian Action item.
5. Daftar Action item berisi judul, Meeting asal, Owner, deadline, status, dan Reminder berikutnya.
6. Kontrol cepat untuk mengubah status.
7. Empty state sesuai hasil filter.

### Halaman Notifikasi

1. Header dan navigasi utama.
2. Judul “Notifikasi”.
3. Filter sudah dibaca/belum dibaca.
4. Tombol **Tandai semua sudah dibaca**.
5. Daftar Notification berisi pesan, Action item terkait, waktu, dan status dibaca.
6. Pengaturan email Reminder per Workspace.
7. Empty state saat tidak ada Notification.

### Dialog Selesaikan Action Item

1. Judul dialog konfirmasi penyelesaian.
2. Ringkasan Action item dan Reminder yang masih tersisa.
3. Opsi **Batalkan reminder tersisa** atau **Pertahankan reminder tersisa**.
4. Tombol **Kembali** dan **Tandai Selesai**.

## 6. Database Schema

Rancangan berikut menggunakan PostgreSQL/Supabase-ready dengan nama tabel jamak dan `snake_case`.

### `profiles`

| Kolom        | Tipe          | Aturan                                |
| ------------ | ------------- | ------------------------------------- |
| `id`         | `uuid`        | Primary key; ID pengguna autentikasi. |
| `full_name`  | `text`        | Wajib diisi.                          |
| `avatar_url` | `text`        | Opsional.                             |
| `time_zone`  | `text`        | Wajib diisi; zona waktu pengguna.     |
| `created_at` | `timestamptz` | Wajib diisi.                          |
| `updated_at` | `timestamptz` | Wajib diisi.                          |

### `workspaces`

| Kolom        | Tipe          | Aturan       |
| ------------ | ------------- | ------------ |
| `id`         | `uuid`        | Primary key. |
| `name`       | `text`        | Wajib diisi. |
| `created_at` | `timestamptz` | Wajib diisi. |
| `updated_at` | `timestamptz` | Wajib diisi. |

### `workspace_members`

| Kolom                     | Tipe          | Aturan                          |
| ------------------------- | ------------- | ------------------------------- |
| `id`                      | `uuid`        | Primary key.                    |
| `workspace_id`            | `uuid`        | Foreign key ke `workspaces.id`. |
| `profile_id`              | `uuid`        | Foreign key ke `profiles.id`.   |
| `email_reminders_enabled` | `boolean`     | Default `true`.                 |
| `joined_at`               | `timestamptz` | Wajib diisi.                    |
| `left_at`                 | `timestamptz` | Opsional.                       |
| `created_at`              | `timestamptz` | Wajib diisi.                    |
| `updated_at`              | `timestamptz` | Wajib diisi.                    |

Constraint: `unique (workspace_id, profile_id)`.

### `workspace_invitations`

| Kolom                  | Tipe          | Aturan                                              |
| ---------------------- | ------------- | --------------------------------------------------- |
| `id`                   | `uuid`        | Primary key.                                        |
| `workspace_id`         | `uuid`        | Foreign key ke `workspaces.id`.                     |
| `invited_by_member_id` | `uuid`        | Foreign key ke `workspace_members.id`.              |
| `invitee_email`        | `text`        | Wajib diisi.                                        |
| `token`                | `text`        | Unik dan wajib diisi.                               |
| `status`               | `text`        | `pending`, `accepted`, `cancelled`, atau `expired`. |
| `expires_at`           | `timestamptz` | Wajib diisi.                                        |
| `accepted_at`          | `timestamptz` | Opsional.                                           |
| `created_at`           | `timestamptz` | Wajib diisi.                                        |
| `updated_at`           | `timestamptz` | Wajib diisi.                                        |

### `meetings`

| Kolom                  | Tipe          | Aturan                                 |
| ---------------------- | ------------- | -------------------------------------- |
| `id`                   | `uuid`        | Primary key.                           |
| `workspace_id`         | `uuid`        | Foreign key ke `workspaces.id`.        |
| `created_by_member_id` | `uuid`        | Foreign key ke `workspace_members.id`. |
| `title`                | `text`        | Wajib diisi.                           |
| `notes`                | `text`        | Wajib diisi; catatan teks sederhana.   |
| `scheduled_at`         | `timestamptz` | Wajib diisi.                           |
| `archived_at`          | `timestamptz` | Opsional.                              |
| `created_at`           | `timestamptz` | Wajib diisi.                           |
| `updated_at`           | `timestamptz` | Wajib diisi.                           |

### `meeting_participants`

| Kolom        | Tipe   | Aturan                                 |
| ------------ | ------ | -------------------------------------- |
| `meeting_id` | `uuid` | Foreign key ke `meetings.id`.          |
| `member_id`  | `uuid` | Foreign key ke `workspace_members.id`. |

Primary key gabungan: `meeting_id`, `member_id`.

### `action_items`

| Kolom                  | Tipe          | Aturan                                             |
| ---------------------- | ------------- | -------------------------------------------------- |
| `id`                   | `uuid`        | Primary key.                                       |
| `meeting_id`           | `uuid`        | Foreign key ke `meetings.id`; wajib diisi.         |
| `created_by_member_id` | `uuid`        | Foreign key ke `workspace_members.id`.             |
| `owner_member_id`      | `uuid`        | Foreign key ke `workspace_members.id`; satu Owner. |
| `title`                | `text`        | Wajib diisi.                                       |
| `description`          | `text`        | Opsional.                                          |
| `status`               | `text`        | `not_started`, `in_progress`, atau `completed`.    |
| `due_at`               | `timestamptz` | Opsional; disimpan global.                         |
| `completed_at`         | `timestamptz` | Opsional.                                          |
| `archived_at`          | `timestamptz` | Opsional.                                          |
| `created_at`           | `timestamptz` | Wajib diisi.                                       |
| `updated_at`           | `timestamptz` | Wajib diisi.                                       |

### `reminders`

| Kolom            | Tipe          | Aturan                            |
| ---------------- | ------------- | --------------------------------- |
| `id`             | `uuid`        | Primary key.                      |
| `action_item_id` | `uuid`        | Foreign key ke `action_items.id`. |
| `scheduled_for`  | `timestamptz` | Wajib diisi.                      |
| `cancelled_at`   | `timestamptz` | Opsional.                         |
| `created_at`     | `timestamptz` | Wajib diisi.                      |
| `updated_at`     | `timestamptz` | Wajib diisi.                      |

### `notifications`

| Kolom                 | Tipe          | Aturan                                  |
| --------------------- | ------------- | --------------------------------------- |
| `id`                  | `uuid`        | Primary key.                            |
| `recipient_member_id` | `uuid`        | Foreign key ke `workspace_members.id`.  |
| `reminder_id`         | `uuid`        | Foreign key opsional ke `reminders.id`. |
| `channel`             | `text`        | `in_app` atau `email`.                  |
| `title`               | `text`        | Wajib diisi.                            |
| `body`                | `text`        | Wajib diisi.                            |
| `sent_at`             | `timestamptz` | Opsional.                               |
| `read_at`             | `timestamptz` | Opsional.                               |
| `created_at`          | `timestamptz` | Wajib diisi.                            |

Constraint: `unique (reminder_id, recipient_member_id, channel)`.

### Relasi Utama

- Satu Profile dapat menjadi Member di banyak Workspace melalui `workspace_members`.
- Satu Workspace memiliki banyak Member, Invitation, dan Meeting.
- Satu Meeting memiliki banyak Participant dan Action item.
- Satu Action item berasal dari satu Meeting, memiliki satu Owner, dan dapat memiliki banyak Reminder.
- Satu Reminder dapat menghasilkan Notification melalui aplikasi dan email untuk tiap Member Workspace.

## 7. Keputusan Stack Teknis

- **Frontend:** Next.js dengan App Router dan TypeScript.
- **Styling:** Tailwind CSS.
- **Backend dan database:** Supabase, termasuk PostgreSQL dan autentikasi Google atau email/kata sandi.
- **Pilihan database:** Supabase dipilih dibanding Neon untuk MVP karena kebutuhan autentikasi dan pengelolaan akses Workspace dapat ditangani dalam satu layanan.
- **Reminder email:** memerlukan layanan scheduler/email tambahan ketika fitur tersebut diimplementasikan; Reminder dalam aplikasi tetap berada dalam scope MVP.

## 8. Style dan Mood Visual

### Arah Visual

Mood aplikasi adalah **warm latte / kopi susu**: hangat, tenang, approachable, dan tetap rapi untuk penggunaan kerja sehari-hari. Arah ini memakai kehangatan warna kopi susu sebagai suasana, bukan dekorasi bertema kopi.

### Palet Warna

| Peran      | Warna                     | Kegunaan                                                                     |
| ---------- | ------------------------- | ---------------------------------------------------------------------------- |
| Primary    | `#6F4E37` — Coffee Brown  | Tombol utama, tautan penting, dan elemen fokus; gunakan teks putih.          |
| Secondary  | `#C49A6C` — Caramel Latte | Penanda sekunder, badge ringan, atau aksi pendukung; gunakan teks `#2B2118`. |
| Background | `#F7F0E8` — Milk Foam     | Latar halaman agar terasa lembut dan tetap nyaman dibaca.                    |
| Text       | `#2B2118` — Dark Roast    | Teks utama serta kontras pada permukaan terang.                              |

Kontras dijaga dengan teks putih pada Coffee Brown dan teks Dark Roast pada Caramel Latte/Milk Foam.

### Tipografi

Gunakan **Plus Jakarta Sans** untuk tampilan modern dan ramah, dengan fallback system font:

`Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

System font saja tetap cukup untuk MVP apabila ingin lebih sederhana dan ringan. Plus Jakarta Sans direkomendasikan bila ingin karakter visual yang lebih konsisten dan approachable.

### Referensi Mood

- [Basecamp](https://basecamp.com/)
- [Notion](https://www.notion.so/)
- [Craft](https://www.craft.do/)

## 9. Status Integrasi Backend Supabase — 2 Oktober 2026

Frontend kini memakai Supabase Auth dan database, dengan semua tabel aplikasi dibatasi Row Level Security (RLS). Migration awal ada di `supabase/migrations/20261001000100_initial_schema.sql`. `.env.local` dan varian lokal sudah diabaikan Git; gunakan `.env.example` sebagai daftar variabel tanpa menaruh secret di browser.

### Alur dan batasan

- Email/kata sandi dan Google OAuth memakai sesi cookie melalui `@supabase/ssr`; middleware Next.js 15 memperbarui sesi dan membaca claims terverifikasi.
- Pengguna pertama dapat membuat Workspace. Creator otomatis menjadi Owner. Beberapa Owner didukung; hanya Owner dapat mengirim undangan, mengubah peran, dan mengeluarkan Member. Owner terakhir tidak dapat diturunkan/dikeluarkan.
- Undangan Auth dibuat lewat route server dengan secret Supabase; Member baru tercatat setelah undangan diterima dan email terautentikasi cocok. Pengeluaran Member mensyaratkan alih Owner untuk setiap Action item aktif.
- Meeting, Participant, Action item, status, Archive, Reminder, Notification terbaca, dan preferensi email per Member memakai data persisten dan RLS.
- Reminder hanya menyimpan jadwal. Tidak ada scheduler, Notification otomatis, atau pengiriman email Reminder pada tahap ini. Undangan Member tetap mengirim email Auth.

### Konfigurasi development

1. Isi `.env.local` dengan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, dan `NEXT_PUBLIC_SITE_URL`. Secret key hanya untuk route server undangan; jangan beri awalan `NEXT_PUBLIC_`.
2. Terapkan migration melalui Supabase CLI yang sudah terhubung ke project development, atau jalankan file migration lewat SQL Editor project kosong. CLI/Docker tidak tersedia di lingkungan implementasi ini, jadi migration belum diterapkan ke project jarak jauh.
3. Tambahkan URL lokal `/auth/callback` ke daftar Redirect URLs Supabase. Pada template **Invite user**, arahkan tautan langsung ke `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=invite`; untuk **Magic Link** gunakan `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink`. Karena redirect undangan dan magic link aplikasi sudah berisi parameter `invitation`, bentuk tersebut memakai `&`. Callback memverifikasi token hash dan membuat sesi cookie di server. Tautan bawaan `/auth/v1/verify` dapat mengembalikan token di fragment URL, yang tidak dapat dibaca server callback ini. Aktifkan Google provider dan atur OAuth client/secret serta callback Supabase di Google Console.
4. Jalankan `npm run dev`. Uji alur email/OAuth dan RLS dengan dua akun di Workspace sama serta akun terpisah.
5. Jalankan `supabase test db` untuk memeriksa regression test akses database pada `supabase/tests/`.

Pemeriksaan sintaks TypeScript per berkas dan format Prettier lulus. Typecheck penuh tetap berjalan lebih dari tiga menit tanpa diagnostik, termasuk setelah proses `tsc` tertinggal dari percobaan sebelumnya dihentikan; pemeriksaan itu dihentikan agar tidak menumpuk proses. Lint, build, dan uji browser belum terkonfirmasi. Smoke test Auth/RLS belum dijalankan karena Supabase CLI, Docker, dan kanal eksekusi database tidak tersedia di lingkungan ini.

### Perbaikan review integrasi — 2 Oktober 2026

- Migration tambahan `20261002000100_atomic_saves_and_action_creator.sql` mengunci `created_by_member_id` Action item pada database dan menyediakan RPC transaksional untuk menyimpan Meeting/Participant dan Action item/Reminder. Jadwal Reminder yang dihapus dari form ditandai batal, bukan dihapus, agar Notification historis tidak terputus.
- Callback Auth memverifikasi `token_hash` server-side melalui Supabase Auth, menjaga dukungan PKCE `code`, lalu menerima undangan hanya setelah sesi memiliki claims terverifikasi. Template Invite dan Magic Link harus mengirim `{{ .TokenHash }}` ke URL aplikasi dalam parameter `token_hash` seperti langkah konfigurasi di atas. Pastikan URL callback yang diizinkan sesuai dengan domain aplikasi.
- Migration baru belum dijalankan ke Supabase development dan konfigurasi provider/template/email belum dapat diverifikasi tanpa akses dashboard project. Tidak ada scheduler atau pengiriman email Reminder yang ditambahkan.

### Hardening RLS — 21 Oktober 2026

- Migration `20261021000100_restrict_destructive_workspace_writes.sql` menghapus hak Member untuk menghapus Meeting secara permanen, karena Archive adalah alur yang dapat dipulihkan. Penghapusan langsung Reminder dan perubahan langsung jadwal Reminder juga dibatasi agar Notification historis tetap terhubung; aplikasi tetap menyimpan jadwal lewat RPC.
- Regression test pgTAP ada di `supabase/tests/workspace_destructive_writes.test.sql`. Pengujian belum dijalankan karena Supabase CLI, Docker, dan `psql` tidak tersedia di lingkungan ini.

### Pemulihan kata sandi — 23 Oktober 2026

- Login email menyediakan permintaan reset kata sandi dengan pesan netral untuk menghindari pengungkapan apakah email terdaftar. Callback memverifikasi token `recovery` dan membuat sesi cookie sebelum form memperbarui kata sandi.
- Tambahkan URL `/auth/callback` pada Redirect URLs Supabase. Template **Reset Password** perlu mengarahkan tautan ke `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`; nilai `redirectTo` aplikasi menyertakan `?authAction=recovery`.
- Uji Playwright baru memeriksa permintaan email reset. Pengujian browser belum berjalan karena server Next.js lokal tidak mulai. Pada pemeriksaan saat itu, typecheck dan lint belum selesai; pemeriksaan sintaks TypeScript, Prettier untuk berkas TS/MD, dan `git diff --check` lulus.

### Verifikasi alur MVP Supabase development — 26 Oktober 2026

- Verifikasi alur lintas-Member belum dilakukan. Tiket pemeriksaan proyek, migration/RLS, dan konfigurasi Auth development masih menjadi prasyarat yang belum terpenuhi.
- `npm run typecheck` pada pemeriksaan ini tidak selesai setelah lebih dari tiga menit tanpa diagnostik dan dihentikan. Lint, build, serta uji browser belum dijalankan ulang; catatan sebelumnya menyebut server Next.js lokal tidak mulai.
- Migration dan regression test RLS belum diterapkan/dijalankan: Supabase CLI, Docker, dan `psql` tidak tersedia pada lingkungan ini. Login Google, template email, undangan, kecocokan email, dan persistensi sesi juga belum diuji pada project Supabase development.
- Tidak ada perubahan atau deployment ke production. Ulangi pemeriksaan setelah tiket 1–3 selesai dan akses project development tersedia; setelah itu jalankan skenario lintas-Member dan perbarui status ini berdasarkan hasil aktual.

## 10. Riwayat Frontend Mock — 28 September 2026

Frontend interaktif mock telah diimplementasikan pada Next.js App Router + TypeScript. Tailwind CSS 4 dipasang melalui PostCSS; token warna warm latte dan Plus Jakarta Sans disertakan secara lokal melalui Fontsource.

### Alur yang tersedia

- Login mock Google atau formulir email/kata sandi langsung membuka Dashboard Workspace Futura Studio. Workspace contoh dapat dipilih kembali dari pemilih Workspace.
- Sidebar desktop dan navigasi bawah mobile menghubungkan Dashboard, Meeting, Action item, Notifikasi, dan pengaturan Workspace.
- Dashboard menghitung Action item aktif/selesai, tugas Dimas, deadline dalam 48 jam, keterlambatan, dan progres tim dari state yang sama.
- Buat/edit Meeting dengan waktu, catatan teks, serta Participant opsional. Archive/pulihkan Meeting tidak menghapus atau menyembunyikan Action item terkait dari daftar global.
- Buat/edit Action item dengan Meeting asal wajib, satu Owner, tiga status, deskripsi, deadline opsional, serta beberapa Reminder bertanggal dan berjam.
- Daftar Action item menyediakan pencarian dan filter Owner, status, Meeting, serta deadline. Pencarian dan filter aktif/Archive tersedia pada daftar Meeting.
- Penyelesaian Action item dengan Reminder mendatang membuka pilihan membatalkan atau mempertahankan Reminder tersisa, termasuk saat status diubah melalui form edit.
- Notification contoh dapat dibuka, ditandai terbaca satu per satu/semua, serta difilter. Preferensi email Reminder dapat diganti dan disinkronkan antara Notifikasi dan pengaturan Workspace.
- Form memakai validasi browser; dialog mendukung Escape, fokus terkurung, serta pengembalian fokus. Waktu form dikonversi menjadi ISO UTC lalu ditampilkan dalam zona waktu perangkat.

### Batasan tahap mock

Catatan di bawah ini merekam batasan implementasi mock sebelum integrasi Supabase dan tidak menggambarkan perilaku kode saat ini.

Pengelolaan undangan/akun, membuat Workspace baru, keluar sebagai Member, dan penghapusan permanen Action item belum termasuk implementasi frontend mock saat itu.

### Menjalankan dan memeriksa

- `npm ci` lalu `npm run dev` untuk menjalankan aplikasi.
- `npm run typecheck`, `npm run lint`, dan `npm run build` untuk pemeriksaan kode/build.
- `npm test` untuk uji end-to-end desktop (1440×1000) dan mobile (390×844). Konfigurasi saat ini memakai Chrome yang terpasang (`channel: chrome`).
- Skenario mock tersebut dijalankan sebelum integrasi. `e2e/frontend.spec.ts` kini memeriksa tampilan Auth dan responsivitas; alur persisten memerlukan akun Supabase development.

Konfigurasi Tailwind mengikuti [panduan resmi Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

### Hasil validasi frontend mock (28 September 2026)

TypeScript, ESLint, dan build produksi Next.js berhasil. Uji end-to-end desktop dan mobile lulus; hasil Playwright terakhir mencatat `passed` tanpa failed tests. Screenshot kedua viewport tersedia di `.impeccable/review/`. Review visual dilakukan langsung; reviewer agen tambahan tidak tersedia karena batas penggunaan.
