# Follow frontend

UI operasional mengikuti desain warm latte yang disetujui di coldstart.md.

- Primary Coffee Brown #6F4E37, secondary Caramel Latte #C49A6C, canvas Milk Foam #F7F0E8, teks Dark Roast #2B2118. Permukaan konten #FFFDF9 dan garis #E7DBCE.
- Plus Jakarta Sans variable disajikan lokal, dengan system fallback. Heading utama 28–32px; teks form 12–14px. Ikon Lucide konsisten.
- Desktop: sidebar tetap 238px, header Workspace, konten Dashboard dua kolom. Mobile ≤760px: header ringkas, satu kolom, navigasi bawah lima tujuan dan padding bawah untuk konten.
- Tombol primer cokelat, sekunder berbingkai, focus-visible kontras; status dibedakan melalui teks dan warna. Dialog native memberi focus trap dan Escape. Gerakan singkat menghormati prefers-reduced-motion.
- Dashboard memakai ringkasan empat status, daftar tindak lanjut, progres tim, dan Meeting terbaru. Semua angka dihitung dari state mock.
- Screenshot verifikasi: .impeccable/review/desktop.png (1440px), mobile.png (390px). Uji browser tersimpan di e2e/frontend.spec.ts.
