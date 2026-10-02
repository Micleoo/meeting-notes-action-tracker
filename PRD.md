# PRD — Meeting Notes → Action Tracker

## Masalah

Tim sering kehilangan keputusan tindak lanjut setelah meeting: siapa melakukan apa, kapan selesai, dan apakah pekerjaan sudah berjalan. Catatan tersebar di dokumen atau chat sehingga follow-up terlambat dan pembahasan berulang.

## Pengguna

Tim kerja umum kecil hingga menengah—tim proyek, startup, organisasi, atau divisi perusahaan—yang rutin meeting dan membutuhkan tempat bersama untuk mencatat hasil meeting serta memantau tindak lanjutnya.

Semua anggota berada dalam satu **workspace** dan memiliki hak kolaborasi setara: melihat meeting, memperbarui action item, serta mengundang anggota baru.

## Fitur utama

1. **Meeting notes** — Buat meeting berisi judul, waktu, catatan teks sederhana, dan peserta opsional. Semua anggota workspace dapat melihatnya. Meeting dapat diarsipkan dan dipulihkan tanpa menghapus action item terkait.
2. **Action item dari meeting** — Buat action item yang wajib terhubung ke sebuah meeting. Setiap item memiliki judul, deskripsi opsional, satu owner, deadline opsional, dan status: Belum Mulai, Dikerjakan, atau Selesai.
3. **Assignment dan pelacakan status** — Seluruh anggota workspace dapat menetapkan owner dan memperbarui status agar progres tidak bergantung pada satu orang. Dashboard menampilkan tugas milik pengguna, tugas mendekati/lewat deadline, dan progres.
4. **Reminder deadline** — Pengguna dapat membuat beberapa reminder pada tanggal/jam pilihan untuk setiap action item. Reminder muncul di aplikasi dan dikirim melalui email ke anggota workspace; pengguna dapat mematikan email reminder pada workspace tertentu.
5. **Kolaborasi workspace** — Pengguna masuk melalui Google atau email/kata sandi. Anggota bergabung setelah menyetujui undangan email. Deadline disimpan sebagai satu waktu global dan ditampilkan menurut zona waktu masing-masing pengguna.

## Out of scope untuk MVP

- AI untuk merangkum meeting atau mengekstrak action item otomatis.
- Rekaman meeting, unggah audio, dan transkripsi.
- Integrasi kalender, Slack, Notion, atau tools pihak ketiga.
- Pembuatan task mandiri yang tidak berasal dari meeting.
- Peran admin, approval workflow, dan hak akses granular.
- Editor rich text, template meeting kompleks, serta daftar keputusan terstruktur.
- Analitik penggunaan, laporan kinerja tim, dan aplikasi mobile native.

## Asumsi yang disetujui

- Fokus MVP adalah demo alur lengkap, bukan validasi adopsi jangka panjang.
- Satu action item hanya memiliki satu owner.
- Semua anggota workspace memiliki hak kolaborasi setara.
- Action item aktif milik anggota yang keluar harus dialihkan.
- Penghapusan permanen action item hanya dapat dilakukan pembuatnya, dengan konfirmasi; selain itu gunakan arsip yang dapat dipulihkan.
- Saat item ditandai selesai, pengguna memilih apakah reminder tersisa dibatalkan atau dipertahankan.
