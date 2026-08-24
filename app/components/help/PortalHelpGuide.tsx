'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight, Compass, HelpCircle, Library, MapPin, Settings2, UserCircle2, X } from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';

type Audience = 'admin' | 'employee';
type Instruction = { action: string; detail: string; result?: string };
type Chapter = {
  label: string;
  title: string;
  location: string;
  purpose: string;
  group?: string;
  before?: string[];
  steps: Instruction[];
  problems?: Array<{ problem: string; solution: string }>;
};
type Guide = { title: string; summary: string; chapters: Chapter[] };

const GUIDES: Record<Audience, Guide> = {
  employee: {
    title: 'Cara menggunakan Portal SSO',
    summary: 'Portal adalah pintu masuk aplikasi kerja. Mulai dari Aplikasi Saya, buka aplikasi dengan tombol BUKA, lalu biarkan Portal melakukan login SSO secara otomatis.',
    chapters: [
      {
        group: 'Navigasi Utama',
        label: 'Mulai di sini',
        title: 'Masuk dan mengenali halaman utama',
        location: 'Login → Dashboard → Aplikasi Saya',
        purpose: 'Memastikan akun berhasil masuk dan mengetahui tempat untuk membuka aplikasi kerja.',
        before: ['Gunakan akun Portal milik sendiri.', 'Pastikan browser mengizinkan cookie dan pop-up untuk alamat Portal.'],
        steps: [
          { action: 'Masukkan username dan password', detail: 'Isi kredensial pada halaman Login, lalu tekan tombol masuk.', result: 'Anda diarahkan ke dashboard Portal.' },
          { action: 'Buka menu Aplikasi Saya', detail: 'Gunakan menu pada sidebar. Halaman ini menampilkan aplikasi yang aktif dan dapat diakses akun Anda.', result: 'Kartu aplikasi tampil dengan nama, deskripsi, dan tombol BUKA.' },
          { action: 'Kenali status kartu', detail: 'Aplikasi yang siap dipakai memiliki tombol BUKA. Label Terkunci menandakan akun belum terhubung dengan data employee atau akses belum lengkap.' },
        ],
        problems: [
          { problem: 'Kembali ke halaman Login', solution: 'Sesi sudah berakhir. Login kembali, kemudian ulangi dari Aplikasi Saya.' },
          { problem: 'Semua aplikasi terkunci', solution: 'Hubungi Admin Portal untuk memeriksa hubungan akun dengan data employee.' },
        ],
      },
      {
        group: 'Navigasi Utama',
        label: 'Buka aplikasi',
        title: 'Membuka MeeTrip atau aplikasi kerja lain',
        location: 'Dashboard → Aplikasi Saya → kartu aplikasi → BUKA',
        purpose: 'Membuka aplikasi terintegrasi tanpa memasukkan username dan password kedua kali.',
        before: ['Login Portal masih aktif.', 'Gunakan tombol BUKA dari kartu aplikasi; jangan mengetik URL MeeTrip secara langsung.'],
        steps: [
          { action: 'Cari aplikasi', detail: 'Temukan kartu berdasarkan nama atau deskripsinya. Untuk perjalanan dinas, pilih MeeTrip.' },
          { action: 'Klik BUKA', detail: 'Portal membuat token sekali pakai dan membuka alamat aplikasi tujuan.', result: 'Aplikasi terbuka pada tab yang sama atau tab baru.' },
          { action: 'Tunggu pemeriksaan SSO', detail: 'Jangan menutup tab saat proses verifikasi berlangsung.', result: 'Dashboard aplikasi tampil dengan nama dan hak akses Anda.' },
          { action: 'Kembali ke Portal dengan aman', detail: 'Gunakan menu Kembali ke Portal dari aplikasi tujuan bila tersedia. Gunakan Keluar Portal hanya jika ingin mengakhiri seluruh sesi.' },
        ],
        problems: [
          { problem: 'Tombol BUKA tidak bereaksi', solution: 'Izinkan pop-up untuk Portal, lalu klik BUKA kembali.' },
          { problem: 'MeeTrip kembali ke Portal', solution: 'Sesi atau token SSO sudah tidak berlaku. Buka kembali MeeTrip dari kartu Aplikasi Saya.' },
        ],
      },
      {
        group: 'Akun Saya',
        label: 'Periksa profil',
        title: 'Memastikan identitas kerja sudah benar',
        location: 'Dashboard → Profil Saya',
        purpose: 'Memastikan aplikasi lain menerima nama, unit, jabatan, grade, dan penempatan yang benar.',
        steps: [
          { action: 'Buka Profil Saya', detail: 'Periksa NIK, nama, email, jabatan, grade, unit organisasi, dan penempatan.' },
          { action: 'Catat data yang salah', detail: 'Data employee tidak diedit sendiri dari halaman profil. Catat kolom yang perlu diperbaiki.' },
          { action: 'Hubungi Admin Portal', detail: 'Sampaikan NIK dan data yang benar kepada admin.', result: 'Setelah admin memperbarui employee, login ulang agar aplikasi menerima data terbaru.' },
        ],
        problems: [{ problem: 'Data di MeeTrip masih lama', solution: 'Keluar dari sesi, masuk kembali melalui Portal, lalu buka ulang MeeTrip.' }],
      },
      {
        group: 'Akun Saya',
        label: 'Foto profil',
        title: 'Mengunggah atau mengubah foto profil',
        location: 'Dashboard → Profil Saya → Foto Profil',
        purpose: 'Menampilkan foto yang mudah dikenali pada navigasi Portal dan aplikasi terintegrasi.',
        steps: [
          { action: 'Buka Profil Saya', detail: 'Klik avatar atau ikon user pada pojok navigasi, lalu pilih Profil Saya.' },
          { action: 'Klik area foto profil', detail: 'Pilih Ubah Foto atau klik pada lingkaran foto di halaman profil.' },
          { action: 'Pilih file gambar', detail: 'Gunakan foto format JPG atau PNG, ukuran maksimal sesuai batas yang ditampilkan.', result: 'Foto diunggah dan langsung terlihat pada navigasi Portal.' },
          { action: 'Verifikasi pada aplikasi lain', detail: 'Buka MeeTrip atau aplikasi terintegrasi untuk memastikan foto terbaru muncul.' },
        ],
        problems: [
          { problem: 'File ditolak', solution: 'Pastikan format gambar JPG/PNG dan ukuran file tidak melebihi batas.' },
          { problem: 'Foto belum berubah di MeeTrip', solution: 'Tunggu beberapa saat atau logout lalu login kembali.' },
        ],
      },
      {
        group: 'Akun Saya',
        label: 'Keamanan akun',
        title: 'Mengamankan akun Portal',
        location: 'Dashboard → Keamanan Akun',
        purpose: 'Menjaga akun yang menjadi akses ke seluruh aplikasi kerja.',
        steps: [
          { action: 'Ganti password bila diperlukan', detail: 'Gunakan password yang tidak dipakai pada layanan pribadi dan jangan membagikannya.' },
          { action: 'Daftarkan Passkey (WebAuthn)', detail: 'Buka Keamanan Akun, klik Daftarkan Passkey, lalu ikuti instruksi browser atau perangkat (sidik jari, wajah, atau PIN). Passkey memungkinkan login tanpa password.', result: 'Passkey tercatat pada halaman Keamanan Akun dan dapat dipakai pada login berikutnya.' },
          { action: 'Kelola metode keamanan', detail: 'Lihat daftar passkey yang terdaftar. Hapus passkey lama jika perangkat sudah tidak dipakai.' },
          { action: 'Keluar setelah memakai perangkat bersama', detail: 'Klik Keluar Portal agar sesi Portal dan aplikasi terintegrasi tidak tersisa.' },
        ],
        problems: [
          { problem: 'Passkey tidak muncul saat login', solution: 'Pastikan browser mendukung WebAuthn dan perangkat memiliki biometrik atau PIN yang aktif.' },
          { problem: 'Login gagal setelah daftar passkey', solution: 'Coba gunakan password sebagai alternatif. Pastikan perangkat terhubung ke internet.' },
        ],
      },
      {
        group: 'IDMS',
        label: 'Semua Dokumen',
        title: 'Menjelajahi repositori dokumen IDMS',
        location: 'IDMS → Semua Dokumen',
        purpose: 'Menemukan dan melihat dokumen berdasarkan unit organisasi, kategori, atau pencarian kata kunci.',
        steps: [
          { action: 'Buka Semua Dokumen', detail: 'Halaman ini menampilkan seluruh dokumen yang dapat diakses sesuai unit organisasi dan hak akses akun Anda.' },
          { action: 'Gunakan pencarian kata kunci', detail: 'Ketikkan judul atau kata kunci pada kotak pencarian untuk menemukan dokumen dengan cepat.' },
          { action: 'Filter berdasarkan kategori', detail: 'Pilih kategori dokumen dari dropdown untuk mempersempit daftar.' },
          { action: 'Klik dokumen untuk melihat pratinjau', detail: 'Pilih dokumen untuk melihat rincian pemilik, unit, versi, serta pratinjau isi dokumen.', result: 'Detail dokumen terbuka.' },
          { action: 'Ajukan permohonan download', detail: 'Jika dokumen memerlukan izin download, klik Ajukan Download dan tuliskan alasan keperluan Anda.' },
        ],
        problems: [
          { problem: 'Dokumen tidak ditemukan', solution: 'Dokumen berada di bawah unit organisasi lain yang tidak diizinkan. Hubungi Admin jika butuh akses.' },
          { problem: 'Tombol download tidak aktif', solution: 'Dokumen memerlukan izin admin. Ajukan izin download terlebih dahulu.' },
        ],
      },
      {
        group: 'IDMS',
        label: 'Dokumen Disetujui (Siap Download)',
        title: 'Mengunduh dokumen yang telah disetujui',
        location: 'IDMS → Dokumen Disetujui (Siap Download)',
        purpose: 'Melihat dan mengunduh dokumen yang telah mendapatkan persetujuan akses dari administrator (1x unduh).',
        steps: [
          { action: 'Buka Dokumen Disetujui', detail: 'Daftar pengajuan izin dokumen yang telah disetujui dan siap diunduh.' },
          { action: 'Download dokumen', detail: 'Klik tombol Unduh Berkas. Berkas ber-watermark resmi akan diunduh dan otomatis dipindahkan ke Riwayat Persetujuan.', result: 'Dokumen ber-watermark berhasil diunduh.' },
        ],
        problems: [{ problem: 'Dokumen hilang dari daftar ini', solution: 'Dokumen yang telah diunduh 1x akan otomatis berpindah ke menu Riwayat Persetujuan.' }],
      },
      {
        group: 'IDMS',
        label: 'Menunggu Persetujuan',
        title: 'Memantau pengajuan izin unduh dokumen',
        location: 'IDMS → Menunggu Persetujuan',
        purpose: 'Memantau dokumen yang sedang Anda ajukan dan menunggu keputusan atasan / administrator.',
        steps: [
          { action: 'Buka Menunggu Persetujuan', detail: 'Halaman ini menampilkan seluruh pengajuan unduh yang belum diproses.' },
          { action: 'Cek status berkala', detail: 'Jika disetujui, berkas akan otomatis masuk ke Dokumen Disetujui. Jika ditolak, notifikasi akan masuk dan berkas beralih ke Riwayat Persetujuan.' },
        ],
        problems: [{ problem: 'Pengajuan belum diproses lama', solution: 'Hubungi atasan unit pemilik atau administrator untuk mempercepat proses persetujuan.' }],
      },
      {
        group: 'IDMS',
        label: 'Riwayat Persetujuan',
        title: 'Melihat arsip pengajuan unduh yang telah diproses',
        location: 'IDMS → Riwayat Persetujuan',
        purpose: 'Melihat riwayat dokumen yang telah berhasil diunduh, pengajuan yang ditolak (beserta alasannya), atau izin yang telah kedaluwarsa.',
        steps: [
          { action: 'Buka Riwayat Persetujuan', detail: 'Daftar lengkap seluruh riwayat pengajuan izin unduh dokumen Anda.' },
          { action: 'Filter status', detail: 'Pilih status Telah Diunduh, Ditolak, atau Kedaluwarsa untuk menyaring daftar riwayat.' },
          { action: 'Lihat dokumen', detail: 'Klik Lihat Dokumen untuk membuka pratinjau dokumen kapan saja.' },
        ],
        problems: [{ problem: 'Ingin mengunduh ulang dokumen yang ditolak/telah diunduh', solution: 'Buka pratinjau dokumen lalu klik Minta Persetujuan Unduh untuk mengajukan izin baru.' }],
      },
      {
        group: 'IDMS',
        label: 'Persetujuan Akses',
        title: 'Memantau & Memproses Izin Unduh Dokumen (2 Tab)',
        location: 'IDMS → Persetujuan Akses',
        purpose: 'Meninjau permintaan unduh aktif dari karyawan serta memantau audit riwayat persetujuan yang telah diproses.',
        before: ['Periksa nama pemohon, NIK, unit pemilik dokumen, dan alasan permohonan.'],
        steps: [
          { action: '1. Tab Permintaan Aktif', detail: 'Buka Tab Permintaan Aktif untuk memproses permohonan yang membutuhkan persetujuan Admin (Setujui / Tolak).' },
          { action: 'Setujui Permintaan', detail: 'Klik ikon Setujui, tentukan masa berlaku token akses unduh (default 7 hari), lalu konfirmasi.', result: 'Permintaan disetujui dan token unduh aktif.' },
          { action: 'Tolak Permintaan', detail: 'Klik ikon Tolak dan sertakan alasan penolakan yang jelas.', result: 'Permintaan ditolak dan dicatat pada riwayat audit.' },
          { action: '2. Tab Riwayat Persetujuan & Audit', detail: 'Buka Tab Riwayat Persetujuan untuk meninjau audit persetujuan non-aktif (Disetujui, Ditolak, Kedaluwarsa).' },
          { action: 'Gunakan Filter Range Tanggal & Kategori', detail: 'Gunakan CustomDateRangePicker (dengan template Dari/Sampai & preset cepat) serta CustomCategorySelect untuk menyaring data audit.', result: 'Daftar audit tampil sesuai parameter rentang tanggal dan kategori dokumen.' },
        ],
        problems: [{ problem: 'Karyawan tidak bisa unduh padahal pernah disetujui', solution: 'Masa berlaku token telah kedaluwarsa. Periksa riwayat pada Tab 2 dan minta karyawan mengajukan ulang.' }],
      },
    ],
  },
  admin: {
    title: 'Panduan operasional Admin Portal',
    summary: 'Kerjakan konfigurasi secara berurutan. Master data dan struktur organisasi harus siap sebelum employee, akun user, dan aplikasi SSO dibuat.',
    chapters: [
      {
        label: 'Urutan Kerja Admin',
        title: 'Urutan konfigurasi yang benar',
        location: 'Dashboard Admin',
        purpose: 'Mencegah employee, akun, atau aplikasi tersimpan dengan relasi data yang kosong.',
        steps: [
          { action: '1. Siapkan Master Data', detail: 'Lengkapi grade, status employee, penempatan, tipe unit, pendidikan, agama, status nikah, dan kategori aplikasi.' },
          { action: '2. Susun Organisasi', detail: 'Buat unit dan parent sesuai struktur perusahaan.' },
          { action: '3. Tambahkan Employee', detail: 'Isi atau import identitas karyawan dan hubungkan dengan grade, unit, serta penempatan.' },
          { action: '4. Buat Akun User', detail: 'Buat akun dari employee agar hubungan akun–employee terbentuk.' },
          { action: '5. Daftarkan Aplikasi', detail: 'Isi URL dan metode autentikasi, uji, lalu aktifkan.' },
          { action: '6. Pantau Overview & Monitoring', detail: 'Periksa aktivitas, kesehatan API, database, SSL, dan aplikasi terhubung.' },
        ],
      },
      {
        group: 'Navigasi Utama',
        label: 'Dashboard & Monitoring',
        title: 'Memeriksa kesehatan dan aktivitas sistem',
        location: 'Navigasi Utama → Dashboard',
        purpose: 'Menemukan gangguan login, API, database, SSL, storage, atau aplikasi terhubung sebelum dilaporkan banyak user.',
        steps: [
          { action: 'Periksa statistik pengguna', detail: 'Lihat ringkasan total pengguna, user aktif, terikat karyawan, dan akun terkunci/suspended.' },
          { action: 'Periksa status layanan inti', detail: 'Lihat indikator Domain, API, Database, Storage, dan SSL. Masing-masing menampilkan warna hijau (online), kuning (warning), atau merah (offline) beserta riwayat polling terakhir.' },
          { action: 'Periksa SSL Certificate', detail: 'Pastikan sertifikat SSL tidak mendekati kedaluwarsa. Dashboard menampilkan sisa hari sertifikat; antisipasi perpanjangan jika kurang dari 30 hari.' },
          { action: 'Periksa Storage', detail: 'Lihat persentase penggunaan disk penyimpanan. Bila mendekati kapasitas, bersihkan file lama atau naikkan kapasitas.' },
          { action: 'Periksa aplikasi terhubung', detail: 'Setiap aplikasi SSO yang terdaftar dan aktif dicek keterjangkauannya secara otomatis. Lihat latency dan status tiap aplikasi.' },
          { action: 'Gunakan filter Log Aktivitas', detail: 'Cari kejadian berdasarkan user, aplikasi, kata kunci, atau rentang tanggal. Klik detail entri untuk melihat informasi lengkap.' },
        ],
        problems: [
          { problem: 'SSL berstatus warning', solution: 'Sertifikat akan kedaluwarsa dalam waktu dekat. Segera proses perpanjangan dengan penyedia SSL.' },
          { problem: 'Aplikasi terhubung offline', solution: 'Periksa server tujuan aplikasi. Masalah mungkin pada server aplikasi, bukan Portal SSO.' },
        ],
      },
      {
        group: 'Navigasi Utama',
        label: 'Portal Aplikasi',
        title: 'Melihat & menguji portal aplikasi kerja',
        location: 'Navigasi Utama → Portal Aplikasi',
        purpose: 'Membuka antarmuka portal aplikasi kerja untuk menguji kelancaran login SSO dari akun admin.',
        steps: [
          { action: 'Buka menu Portal Aplikasi', detail: 'Halaman menampilkan daftar kartu aplikasi SSO yang aktif.' },
          { action: 'Klik BUKA pada kartu aplikasi', detail: 'Menguji handoff token SSO ke aplikasi tujuan untuk memastikan sesi login berjalan lancar.' },
        ],
      },
      {
        group: 'Kelola Sistem',
        label: 'Data Master',
        title: 'Menyiapkan referensi dasar (8 Tab Master Data)',
        location: 'Kelola Sistem → Data Master',
        purpose: 'Menyediakan referensi dasar yang dipakai pada profil karyawan, organisasi, dan kategori aplikasi.',
        before: ['Gunakan kode referensi yang konsisten dengan data perusahaan.', 'Siapkan data master sebelum menambahkan data karyawan atau organisasi.'],
        steps: [
          { action: '1. Tab Status Karyawan', detail: 'Mengatur jenis status ikatan kerja (Tetap, Kontrak, PKWT, Magang/Trainee). Dipakai saat membuat/edit data karyawan.' },
          { action: '2. Tab Grade / Golongan', detail: 'Mengatur tingkatan golongan jabatan (misal: BOD, BOM-1, BOM-2, Staf). Memengaruhi batas pagu biaya dinas & alur persetujuan SPDK di MeeTrip.' },
          { action: '3. Tab Tipe Unit', detail: 'Mengatur jenis klasifikasi unit (Direktorat, Divisi, Bagian, Subbagian, Seksi, Pabrik, Kantor Pusat). Dipakai saat menentukan level pada bagan organisasi.' },
          { action: '4. Tab Pendidikan', detail: 'Mengatur jenjang pendidikan resmi (SMA/SMK, D3, S1, S2, S3) untuk kelengkapan berkas karyawan.' },
          { action: '5. Tab Status Pernikahan', detail: 'Mengatur status perkawinan (Lajang, Menikah, Duda/Janda) untuk profil dan fasilitas karyawan.' },
          { action: '6. Tab Penempatan Area', detail: 'Mengatur lokasi kerja fisik/site pabrik (misal: Kantor Pusat Medan, Pabrik Pasir Gunting, Jakarta Office, Site Dumai).' },
          { action: '7. Tab Kategori Aplikasi', detail: 'Mengatur pengelompokan kategori aplikasi SSO (Operasional, Keuangan, SDM, Umum) untuk mengelompokkan kartu aplikasi di portal.' },
          { action: '8. Tab Agama', detail: 'Mengatur data keagamaan karyawan (Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu).' },
        ],
        problems: [{ problem: 'Baris data master tidak dapat dihapus', solution: 'Data master tersebut sedang dipakai oleh karyawan, unit, atau aplikasi. Ubah atau hapus relasi data terlebih dahulu.' }],
      },
      {
        group: 'Kelola Sistem',
        label: 'Unit Organisasi',
        title: 'Menyusun unit dan hierarki organisasi',
        location: 'Kelola Sistem → Unit Organisasi',
        purpose: 'Menentukan hubungan atasan, unit employee, dan struktur organisasi perusahaan.',
        steps: [
          { action: 'Buat unit induk terlebih dahulu', detail: 'Mulai dari level tertinggi seperti Direktorat atau SEVP.' },
          { action: 'Tambahkan unit turunan', detail: 'Pilih tipe unit dan parent yang benar untuk bagian, subbagian, atau seksi.' },
          { action: 'Periksa pada Bagan Organisasi', detail: 'Pastikan unit muncul di cabang yang tepat dan tidak membentuk hierarki terputus.', result: 'Struktur dapat dipakai saat menetapkan unit employee.' },
        ],
      },
      {
        group: 'Kelola Sistem',
        label: 'Data Karyawan',
        title: 'Menambah dan memelihara data employee',
        location: 'Kelola Sistem → Data Karyawan',
        purpose: 'Menyediakan identitas kerja yang menjadi sumber profil Portal dan MeeTrip.',
        before: ['Master grade, unit, status, dan penempatan sudah tersedia.', 'NIK tidak boleh dipakai oleh employee lain.'],
        steps: [
          { action: 'Pilih Tambah Employee atau Import', detail: 'Gunakan tambah manual untuk satu orang atau import Excel untuk data massal.' },
          { action: 'Lengkapi identitas dan penempatan', detail: 'Periksa NIK, nama, email, jabatan, grade, unit, status, dan penempatan.' },
          { action: 'Simpan lalu cari kembali', detail: 'Gunakan pencarian NIK/nama untuk memastikan data tersimpan.', result: 'Employee tersedia saat membuat akun user.' },
        ],
        problems: [{ problem: 'Import ditolak', solution: 'Periksa format kolom, NIK duplikat, dan kecocokan kode master pada file.' }],
      },
      {
        group: 'Kelola Sistem',
        label: 'Struktur Jabatan',
        title: 'Memantau bagan & struktur hierarki jabatan',
        location: 'Kelola Sistem → Struktur Jabatan',
        purpose: 'Melihat peta visual hubungan atasan–bawahan dan struktur jabatan antar unit secara grafis.',
        steps: [
          { action: 'Buka menu Struktur Jabatan', detail: 'Halaman menampilkan diagram/bagan hierarki unit dan posisi jabatan.' },
          { action: 'Gunakan zoom & pandangan bagan', detail: 'Geser atau perbesar diagram untuk memeriksa hubungan atasan dan unit turunan.' },
        ],
      },
      {
        group: 'Kelola Sistem',
        label: 'Kelola User',
        title: 'Membuat akun yang terhubung ke employee',
        location: 'Kelola Sistem → Kelola User',
        purpose: 'Memberi employee akses login dan SSO tanpa kehilangan hubungan identitas kerja.',
        steps: [
          { action: 'Cari employee', detail: 'Pilih employee yang belum mempunyai akun.' },
          { action: 'Buat akun dari employee', detail: 'Isi username dan data autentikasi yang diminta. Jangan membuat akun lepas bila akun tersebut untuk karyawan.' },
          { action: 'Periksa hubungan akun', detail: 'Pastikan nama employee tampil pada data akun.', result: 'User dapat login dan kartu aplikasi tidak lagi berstatus Terkunci.' },
        ],
      },
      {
        group: 'Kelola Sistem',
        label: 'Layanan Aplikasi',
        title: 'Mendaftarkan dan menguji aplikasi',
        location: 'Kelola Sistem → Layanan Aplikasi',
        purpose: 'Menampilkan aplikasi pada dashboard user dan memastikan handoff SSO bekerja.',
        steps: [
          { action: 'Tambah atau edit aplikasi', detail: 'Isi nama, deskripsi, kategori, URL, ikon, urutan, dan mode autentikasi.' },
          { action: 'Simpan dalam kondisi belum aktif bila perlu', detail: 'Periksa kembali URL dan konfigurasi sebelum aplikasi ditampilkan ke user.' },
          { action: 'Uji tombol BUKA', detail: 'Gunakan akun uji yang terhubung ke employee.', result: 'Aplikasi tujuan terbuka dan mengenali user tanpa login ulang.' },
          { action: 'Aktifkan aplikasi', detail: 'Aktifkan setelah pengujian berhasil agar kartu muncul pada Aplikasi Saya.' },
        ],
        problems: [{ problem: 'Aplikasi membuka halaman login sendiri', solution: 'Periksa mode autentikasi, URL callback/handoff, dan konfigurasi SSO aplikasi tujuan.' }],
      },
      {
        group: 'Kelola Sistem',
        label: 'Identitas Portal',
        title: 'Mengelola tampilan branding portal',
        location: 'Kelola Sistem → Identitas Portal',
        purpose: 'Menyesuaikan identitas visual Portal SSO dengan branding perusahaan.',
        steps: [
          { action: 'Buka halaman Identitas Portal', detail: 'Akses dari menu sidebar Admin. Halaman ini menampilkan pengaturan tampilan portal.' },
          { action: 'Edit judul dan deskripsi', detail: 'Ubah teks hero banner, tagline, atau deskripsi dashboard sesuai kebutuhan perusahaan.' },
          { action: 'Unggah logo atau gambar', detail: 'Gunakan logo perusahaan dengan format dan ukuran yang sesuai panduan.' },
          { action: 'Simpan dan periksa tampilan', detail: 'Simpan perubahan, lalu buka Portal dari sisi user untuk memverifikasi tampilan baru.', result: 'Branding portal tampil sesuai identitas perusahaan pada halaman login dan dashboard.' },
        ],
      },
      {
        group: 'IDMS',
        label: 'Kategori Dokumen',
        title: 'Mengelola kategori dan klasifikasi dokumen',
        location: 'Kelola Sistem → IDMS (Expand) → Kategori Dokumen',
        purpose: 'Menyediakan pilihan kategori resmi (seperti SOP, Kebijakan, Surat Edaran, Disposisi, Memo) untuk pengelompokan dokumen perusahaan.',
        before: ['Siapkan nama dan kode kategori yang sesuai dengan kebijakan tata kelola dokumen perusahaan.'],
        steps: [
          { action: 'Expand button IDMS', detail: 'Pada sidebar di bawah kelompok "Kelola Sistem", klik button "IDMS" (berstatus ter-collapse secara default) untuk meng-expand sub-menu, lalu pilih "Kategori Dokumen".' },
          { action: 'Klik Tambah Kategori', detail: 'Isi Nama Kategori dan Kode Kategori (misal: SOP, POLICY, MEMO), lalu simpan.', result: 'Kategori baru tampil dan langsung dapat dipilih saat mengunggah dokumen.' },
          { action: 'Edit atau hapus kategori', detail: 'Gunakan tombol aksi untuk mengubah nama kategori atau menghapus kategori yang tidak terpakai.' },
        ],
        problems: [{ problem: 'Kategori tidak dapat dihapus', solution: 'Kategori tersebut masih digunakan oleh dokumen yang tersimpan di sistem.' }],
      },
      {
        group: 'IDMS',
        label: 'Semua Dokumen & Upload',
        title: 'Menjelajahi repositori & mengunggah dokumen baru (Admin)',
        location: 'Kelola Sistem → IDMS (Expand) → Semua Dokumen',
        purpose: 'Melihat seluruh dokumen organisasi dan mengunggah dokumen baru ke repositori unit.',
        steps: [
          { action: 'Expand button IDMS', detail: 'Pada sidebar di bawah "Kelola Sistem", klik button "IDMS" (default ter-collapse) untuk meng-expand sub-menu, lalu pilih "Semua Dokumen".' },
          { action: 'Klik Upload Baru', detail: 'Klik tombol Upload Baru di pojok kanan atas halaman.' },
          { action: 'Pilih unit tujuan & kategori', detail: 'Tentukan unit organisasi pemilik dokumen dan kategori dokumen yang sesuai.' },
          { action: 'Isi judul, deskripsi & pilih file', detail: 'Masukkan judul resmi, deskripsi/ringkasan isi, lalu unggah file (PDF).', result: 'Dokumen tersimpan dan terpublikasi ke repositori unit.' },
          { action: 'Atur hak akses download', detail: 'Pilihlah apakah dokumen bersifat Publik (langsung unduh) atau Memerlukan Persetujuan.' },
        ],
        problems: [{ problem: 'Gagal upload file', solution: 'Pastikan ukuran file tidak melebihi batas dan format file sesuai aturan.' }],
      },
      {
        group: 'IDMS',
        label: 'Dokumen Disetujui (Siap Download)',
        title: 'Melihat daftar dokumen yang disetujui & siap diunduh',
        location: 'Kelola Sistem → IDMS (Expand) → Dokumen Disetujui (Siap Download)',
        purpose: 'Melihat dan mengunduh berkas yang telah diproses dan disetujui oleh administrator.',
        steps: [
          { action: 'Expand button IDMS', detail: 'Pada sidebar di bawah "Kelola Sistem", klik button "IDMS" (default ter-collapse) untuk meng-expand sub-menu, lalu pilih "Dokumen Disetujui (Siap Download)".' },
          { action: 'Download Dokumen', detail: 'Klik tombol Unduh untuk mengunduh dokumen ber-watermark.' },
        ],
      },
      {
        group: 'IDMS',
        label: 'Persetujuan Akses',
        title: 'Memproses Izin Unduh & Monitoring Audit Persetujuan (2 Tab)',
        location: 'Kelola Sistem → IDMS (Expand) → Persetujuan Akses',
        purpose: 'Meninjau permintaan unduh aktif karyawan serta memantau riwayat audit persetujuan non-aktif.',
        before: ['Periksa nama pemohon, NIK, unit pemilik dokumen, dan alasan permohonan.'],
        steps: [
          { action: '1. Tab Permintaan Aktif', detail: 'Expand button "IDMS" (default ter-collapse) di bawah Kelola Sistem, lalu pilih "Persetujuan Akses". Halaman utama menampilkan permohonan download dari karyawan.' },
          { action: 'Klik Setujui Permintaan', detail: 'Tentukan masa berlaku token download (default 7 hari), lalu konfirmasi.', result: 'Sistem melepaskan token akses dan mengizinkan pemohon mengunduh file fisik.' },
          { action: 'Klik Tolak Permintaan', detail: 'Isi catatan/alasan penolakan jika permohonan tidak memenuhi syarat.', result: 'Status berubah menjadi Ditolak dan dicatat pada riwayat audit.' },
          { action: '2. Tab Riwayat Persetujuan & Audit', detail: 'Buka Tab Riwayat Persetujuan untuk memantau audit permohonan yang sudah tidak aktif (Disetujui, Ditolak, Kedaluwarsa).' },
          { action: 'Gunakan Filter Range Tanggal & Kategori', detail: 'Gunakan CustomDateRangePicker (dengan template Dari/Sampai & preset cepat) serta CustomCategorySelect untuk memfilter data audit.', result: 'Data riwayat persetujuan terfilter secara presisi.' },
        ],
        problems: [{ problem: 'Karyawan tidak bisa unduh padahal pernah disetujui', solution: 'Masa berlaku token telah kedaluwarsa. Periksa riwayat pada Tab 2 dan minta karyawan mengajukan permohonan ulang.' }],
      },
      {
        group: 'IDMS',
        label: 'Log Dokumen',
        title: 'Memantau jejak audit log repositori dokumen',
        location: 'Kelola Sistem → IDMS (Expand) → Log Dokumen',
        purpose: 'Memastikan keamanan data dengan melihat riwayat transaksi pengunggahan, pengeditan, persetujuan, dan pengunduhan file.',
        steps: [
          { action: 'Expand button IDMS', detail: 'Pada sidebar di bawah "Kelola Sistem", klik button "IDMS" (default ter-collapse) untuk meng-expand sub-menu, lalu pilih "Log Dokumen".' },
          { action: 'Gunakan pencarian & filter', detail: 'Cari berdasarkan nama karyawan, nama dokumen, atau jenis tindakan (upload, edit, approve, reject, download).' },
          { action: 'Periksa detail riwayat', detail: 'Lihat waktu kejadian, alamat IP, akun pelaksana, dan status tindakan.' },
        ],
      },
      {
        group: 'Akun Saya',
        label: 'Profil Saya',
        title: 'Memeriksa profil dan identitas kerja admin',
        location: 'Admin → Akun Saya → Profil Saya',
        purpose: 'Memastikan identitas admin, NIK, jabatan, unit, dan foto profil sudah benar.',
        steps: [
          { action: 'Buka Profil Saya', detail: 'Periksa rincian identitas kerja dan foto profil.' },
          { action: 'Ubah foto profil bila perlu', detail: 'Klik area foto profil untuk memilih gambar baru (JPG/PNG).' },
        ],
      },
      {
        group: 'Akun Saya',
        label: 'Keamanan Akun',
        title: 'Mengamankan akun administrator',
        location: 'Admin → Akun Saya → Keamanan Akun',
        purpose: 'Menjaga keamanan akun administrator dengan password kuat dan Passkey biometrik.',
        steps: [
          { action: 'Ubah password berkala', detail: 'Gunakan kata sandi kombinasi kuat yang tidak mudah ditebak.' },
          { action: 'Daftarkan Passkey biometrik', detail: 'Klik Daftarkan Passkey untuk mengaktifkan login biometrik (fingerprint/face ID/PIN).' },
        ],
      },
    ],
  },
};

export default function PortalHelpGuide({
  audience = 'employee',
  label = 'Panduan SSO',
  open: controlledOpen,
  onOpenChange,
}: {
  audience?: Audience;
  label?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [internalOpen, setInternalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    setInternalOpen(val);
    if (onOpenChange) onOpenChange(val);
  };

  const guide = GUIDES[audience];
  const chapter = guide.chapters[chapterIndex];

  useEffect(() => {
    if (!isOpen) return;
    setChapterIndex(0);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  useEffect(() => {
    const currentGroup = chapter?.group;
    if (currentGroup) {
      setExpandedGroups(prev => ({ ...prev, [currentGroup]: true }));
    }
  }, [chapterIndex, chapter]);

  const renderNavItems = () => {
    const elements: React.ReactNode[] = [];
    let currentGroup: string | null = null;
    let groupChapters: { item: Chapter; idx: number }[] = [];

    const flushGroup = () => {
      if (!currentGroup) return;
      const grpName = currentGroup;
      const chapters = [...groupChapters];
      const isExpanded = expandedGroups[grpName] ?? true;
      const hasActiveChild = chapters.some(c => c.idx === chapterIndex);
      const GroupIcon = grpName.includes('Navigasi')
        ? Compass
        : grpName.includes('Dokumen')
        ? Library
        : grpName.includes('Akun')
        ? UserCircle2
        : Settings2;

      elements.push(
        <div key={`group-${grpName}`} className="my-1">
          <button
            type="button"
            onClick={() => setExpandedGroups(prev => ({ ...prev, [grpName]: !isExpanded }))}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs font-bold transition-colors focus:outline-none ${
              hasActiveChild
                ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <GroupIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">{grpName}</span>
            </span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
          </button>

          {isExpanded && (
            <div className="ml-3.5 mt-0.5 space-y-0.5 border-l-2 border-amber-500/30 pl-2 dark:border-amber-500/20">
              {chapters.map(({ item, idx }) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setChapterIndex(idx)}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold transition-colors focus:outline-none ${
                    idx === chapterIndex
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                      : 'text-slate-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-slate-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );

      currentGroup = null;
      groupChapters = [];
    };

    guide.chapters.forEach((item, index) => {
      if (item.group) {
        if (currentGroup && currentGroup !== item.group) {
          flushGroup();
        }
        currentGroup = item.group;
        groupChapters.push({ item, idx: index });
      } else {
        if (currentGroup) {
          flushGroup();
        }
        elements.push(
          <button
            key={item.label}
            type="button"
            onClick={() => setChapterIndex(index)}
            className={`shrink-0 rounded-md px-3 py-2 text-left text-xs font-semibold transition-colors focus:outline-none md:w-full ${
              index === chapterIndex
                ? 'bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/20'
                : 'text-slate-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-slate-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-400'
            }`}
          >
            {item.label}
          </button>
        );
      }
    });

    if (currentGroup) {
      flushGroup();
    }

    return elements;
  };

  return (
    <>
      {controlledOpen === undefined && (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3.5 py-2 text-xs font-semibold text-amber-700 transition-colors hover:border-amber-500 hover:bg-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-500/25 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/15">
          <HelpCircle className="h-4 w-4" />{label}
        </button>
      )}

      <ModalPortal open={isOpen}>
        <div className="absolute inset-0 bg-slate-950/60" onClick={() => setOpen(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-5">
          <div role="dialog" aria-modal="true" aria-label={guide.title} className="relative flex h-[min(880px,calc(100dvh-1rem))] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
              <div><p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Dokumentasi Portal SSO</p><h2 className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white">{guide.title}</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600 dark:text-slate-400">{guide.summary}</p></div>
              <button type="button" aria-label="Tutup panduan" onClick={() => setOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </header>

            <div className="min-h-0 flex flex-1 flex-col md:flex-row">
              <nav aria-label="Daftar bab panduan" className="shrink-0 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/60 md:w-64 md:border-b-0 md:border-r md:p-3 md:overflow-y-auto min-h-0 custom-yellow-scrollbar">
                <p className="hidden px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:block">Pilih tugas</p>
                <div className="flex gap-1 overflow-x-auto md:block md:space-y-1">
                  {renderNavItems()}
                </div>
              </nav>

              <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6 custom-yellow-scrollbar">
                <div className="mx-auto max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {chapter.group ? `${chapter.group} · ${chapter.label}` : chapter.label}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{chapter.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{chapter.purpose}</p>

                  <div className="mt-5 flex items-start gap-3 border-y border-slate-200 py-3 dark:border-slate-800"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lokasi di aplikasi</p><p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{chapter.location}</p></div></div>

                  {chapter.before && <section className="mt-6"><h4 className="text-sm font-bold text-slate-900 dark:text-white">Sebelum mulai</h4><ul className="mt-2 space-y-1.5">{chapter.before.map(item => <li key={item} className="flex gap-2 text-sm leading-5 text-slate-600 dark:text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul></section>}

                  <section className="mt-7"><h4 className="text-sm font-bold text-slate-900 dark:text-white">Langkah penggunaan</h4><ol className="mt-4 space-y-0">{chapter.steps.map((step, index) => <li key={`${step.action}-${index}`} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-6 last:pb-0"><div className="relative flex justify-center"><span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:text-amber-400">{index + 1}</span>{index < chapter.steps.length - 1 && <span className="absolute bottom-0 top-7 w-px bg-amber-500/20" />}</div><div><p className="text-sm font-bold text-slate-900 dark:text-white">{step.action}</p><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.detail}</p>{step.result && <p className="mt-2 border-l-2 border-emerald-500 pl-3 text-xs leading-5 text-slate-600 dark:text-slate-400"><span className="font-semibold text-emerald-700 dark:text-emerald-400">Hasil:</span> {step.result}</p>}</div></li>)}</ol></section>

                  {chapter.problems && <section className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800"><h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><AlertTriangle className="h-4 w-4 text-amber-600" />Jika terjadi masalah</h4><dl className="mt-3 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">{chapter.problems.map(item => <div key={item.problem} className="py-3"><dt className="text-xs font-semibold text-slate-900 dark:text-white">{item.problem}</dt><dd className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{item.solution}</dd></div>)}</dl></section>}
                </div>
              </main>
            </div>

            <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
              <button
                type="button"
                disabled={chapterIndex === 0}
                onClick={() => setChapterIndex(value => value - 1)}
                className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:border-amber-500 hover:bg-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-500/25 disabled:invisible dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/15"
              >
                <ChevronLeft className="h-4 w-4" />Sebelumnya
              </button>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{chapterIndex + 1} / {guide.chapters.length}</span>
              {chapterIndex < guide.chapters.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setChapterIndex(value => value + 1)}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:border-amber-500 hover:bg-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-500/25 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/15"
                >
                  Berikutnya<ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  Selesai
                </button>
              )}
            </footer>
          </div>
        </div>
      </ModalPortal>
    </>
  );
}
