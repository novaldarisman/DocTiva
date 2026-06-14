# GENERAL PROMPT – CENTRALIZED TEMPLATE MANAGEMENT FOR DOCTIVA

Ubah konsep pengelolaan template pada DocTiva menjadi sistem Template Management terpusat.

Tujuan:

Seluruh template perusahaan diunggah satu kali pada awal implementasi dan dapat digunakan berulang kali oleh seluruh pengguna tenant sesuai hak aksesnya.

Pengguna tidak perlu membuat atau mengedit template setiap kali membuat dokumen.

---

# LOKASI MENU

Pindahkan seluruh pengaturan template ke:

Pengaturan
└── Template Management

Submenu:

* Template Invoice
* Template Kwitansi
* Template Surat Menyurat

Hanya Tenant Super Admin yang dapat mengelola template.

Pengguna biasa hanya dapat menggunakan template yang tersedia.

---

# KONSEP TEMPLATE

Template merupakan aset perusahaan.

Template diunggah satu kali dan digunakan berkali-kali.

Satu tenant dapat memiliki banyak template.

Template antar tenant harus terisolasi.

Tenant tidak dapat melihat template milik tenant lain.

---

# TEMPLATE INVOICE

Tambahkan menu:

Pengaturan
→ Template Management
→ Template Invoice

Fitur:

* Upload Template Baru
* Edit Informasi Template
* Aktifkan Template
* Nonaktifkan Template
* Duplikasi Template
* Hapus Template
* Preview Template
* Set sebagai Default

Format file yang didukung:

* DOCX
* PDF (preview/reference only)

Field:

* Nama Template
* Deskripsi
* Status Aktif
* Template Default
* Versi Template

Satu tenant dapat memiliki banyak template invoice.

Contoh:

* Invoice Standar
* Invoice Pelatihan
* Invoice Konsultan
* Invoice Creative Agency

Saat membuat invoice:

Pengguna memilih template yang ingin digunakan.

Jika tidak memilih, sistem menggunakan template default.

---

# TEMPLATE KWITANSI

Tambahkan menu:

Pengaturan
→ Template Management
→ Template Kwitansi

Fitur sama seperti Template Invoice.

Contoh:

* Kwitansi Standar
* Kwitansi Pelatihan
* Kwitansi Event

Mendukung DOCX.

Saat generate PDF, desain mengikuti template yang dipilih.

---

# TEMPLATE SURAT MENYURAT

Tambahkan menu:

Pengaturan
→ Template Management
→ Template Surat Menyurat

Sistem berbasis upload Word.

Fitur:

* Upload Template DOCX
* Preview Template
* Aktifkan/Nonaktifkan
* Set Default
* Duplikasi
* Hapus
* Download Template Asli

Satu tenant dapat memiliki banyak template surat.

Contoh:

MOU:

* MOU Pelatihan
* MOU Konsultan

SPK:

* SPK Vendor
* SPK Proyek

NDA:

* NDA Umum
* NDA Creative

Surat Penawaran:

* Penawaran Pelatihan
* Penawaran Konsultan

---

# TEMPLATE PLACEHOLDER

Semua template DOCX mendukung placeholder.

Contoh:

{{nomor_dokumen}}

{{tanggal}}

{{nama_perusahaan}}

{{alamat_perusahaan}}

{{nama_pelanggan}}

{{nama_pic}}

{{jabatan_pic}}

{{nominal}}

{{terbilang}}

{{tanggal_jatuh_tempo}}

{{catatan}}

Placeholder dapat digunakan pada:

* Header
* Footer
* Isi paragraf
* Tabel
* Area tanda tangan

---

# TEMPLATE DEFAULT

Setiap kategori template harus memiliki satu template default.

Kategori:

* Invoice
* Kwitansi
* Surat Menyurat

Jika pengguna tidak memilih template saat membuat dokumen, sistem otomatis menggunakan template default.

---

# TEMPLATE VERSIONING

Tambahkan fitur versi.

Setiap perubahan template menghasilkan versi baru.

Contoh:

Invoice Standar v1

Invoice Standar v2

Invoice Standar v3

Dokumen lama tetap menggunakan template versi saat dokumen dibuat.

Tidak berubah mengikuti template terbaru.

---

# PENGGUNAAN TEMPLATE

Saat membuat Invoice:

Pilih Template Invoice
↓
Isi data
↓
Generate DOCX
↓
Generate PDF

Saat membuat Kwitansi:

Pilih Template Kwitansi
↓
Isi data
↓
Generate DOCX
↓
Generate PDF

Saat membuat Surat:

Pilih Template Surat
↓
Isi data
↓
Generate DOCX
↓
Generate PDF

Pengalaman pengguna harus tetap semudah seperti sebelumnya.

---

# ARSIP TEMPLATE

Simpan metadata:

* Tenant
* Nama Template
* Jenis Template
* Versi
* Status
* Default
* Tanggal Upload
* Uploaded By

Simpan file asli DOCX.

---

# AUDIT TRAIL

Catat aktivitas:

* Upload Template
* Update Template
* Aktivasi Template
* Menjadikan Default
* Download Template
* Hapus Template
* Generate Dokumen menggunakan Template

Audit hanya dapat dilihat oleh Tenant Super Admin.

---

# ACCEPTANCE CRITERIA

Fitur dianggap selesai apabila:

* Template dikelola melalui Pengaturan.
* Invoice, Kwitansi, dan Surat Menyurat menggunakan konsep yang sama.
* Template cukup diunggah satu kali.
* Tenant dapat memiliki banyak template.
* Tersedia template default untuk setiap kategori.
* Template mendukung format DOCX.
* Placeholder bekerja otomatis.
* PDF dan DOCX hasil generate mengikuti template yang dipilih.
* Template antar tenant terisolasi.
* Dokumen lama tetap mempertahankan versi template saat dibuat.
* Tidak diperlukan pembuatan template manual di dalam aplikasi.
