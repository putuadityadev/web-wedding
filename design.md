# DESIGN.md — Sistem Desain Undangan Digital

> Sumber kebenaran untuk **tampilan, motion, dan suara copy**. Fitur dan data ada di `PLAN.md`.
> Nilai di sini adalah titik awal yang tegas. Boleh disetel halus setelah dilihat di layar, tetapi tetap dalam keluarga yang sama (jangan ganti arah).

---

## 1. Konsep

**"Dua garis, satu benang."**
Dua garis tipis berawal terpisah (dua orang), bergerak mendekat sepanjang scroll, lalu menyatu di hari acara. Garis tipis (*hairline*) menjadi motif di seluruh situs: pembatas, bingkai, penomoran, dan satu benang SVG yang mengikuti scroll.

**Sifat visual:** tenang, lega, presisi, hangat. *Quiet luxury*, bukan "pernikahan serba glitter". Setiap layar punya satu fokus; kemewahan datang dari ruang kosong, tipografi besar, dan gerak yang terkontrol.

**Tiga momen tanda tangan** (hanya tiga, supaya terasa istimewa):
1. **Cover membelah terbuka**: panel baby blue terbelah dua dan membuka hero saat "Buka Undangan" ditekan.
2. **Benang yang menyatu**: dua hairline SVG tergambar mengikuti scroll dan bertemu di section Acara.
3. **Napas warna**: latar bergeser halus putih ↔ baby blue antar section (di-scrub oleh scroll).

Pendukung (bukan tanda tangan): kutipan yang menyala kata demi kata saat scroll, galeri horizontal, angka countdown bergulir.

---

## 2. Referensi

Lihat screenshot terlampir. Yang diambil dan yang dihindari:

| Dari | Ambil | Jangan |
|---|---|---|
| poezabride.com | Ketenangan, whitespace sangat lega, headline editorial besar dengan jarak antar kata disengaja, label kecil uppercase ber-tracking lebar, copy pendek, foto portrait dipadu landscape, footer dengan nama raksasa | Menyalin layout, aset, atau kata-kata |
| designxhand.com | Teks muncul per baris, penomoran romawi (I, II, III), label kecil (*Date / Location*), FAQ accordion, CTA yang selalu terjangkau | Nuansa "event berbayar/korporat" |

---

## 3. Design tokens

Semua sebagai CSS variables di `:root`. Dilarang memakai warna di luar token.

```css
:root {
  /* Warna */
  --paper:      #FBFCFE;   /* putih dominan (bukan #fff datar) */
  --mist:       #E8F1F9;   /* permukaan alternatif, sangat muda */
  --baby-blue:  #A9CBEA;   /* PRIMARY: bidang & momen besar */
  --deep:       #3F6A94;   /* aksen hemat: link, garis penting, detail kecil */
  --ink:        #0F1B2D;   /* teks. Dilarang hitam murni */
  --hairline:   color-mix(in srgb, var(--ink) 12%, transparent);

  /* Proporsi target: ~60% paper, ~30% baby-blue/mist, ~10% ink + deep */

  /* Ruang (skala 4px) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;
  --space-24: 96px; --space-32: 128px;
  --gutter: clamp(20px, 5vw, 72px);       /* margin halaman */
  --section-y: clamp(96px, 16vh, 220px);  /* jarak vertikal antar section */

  /* Bentuk */
  --radius-arch: 999px 999px 0 0;         /* satu-satunya bentuk khas: lengkung (pintu) */
  --radius-sm: 2px;                       /* selebihnya tajam */

  /* Motion */
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);   /* ~expo.out */
  --ease-in-out: cubic-bezier(0.87, 0, 0.13, 1);  /* ~expo.inOut */
}
```

- Teks di atas `--baby-blue` **selalu** `--ink`. `--deep` hanya di atas `--paper`/`--mist` (kontras ≥ 4.5:1).
- Tidak ada mode gelap.
- Baby blue adalah identitas: dipakai sebagai **bidang besar** dan momen penting, bukan sebagai taburan dekorasi kecil.

---

## 4. Tipografi

| Peran | Font | Catatan |
|---|---|---|
| Display | **Instrument Serif** (reguler + *italic*) | Italic dipakai sebagai aksen pada 1–2 kata per headline, termasuk tanda `&` |
| Teks & label | **Hanken Grotesk** | Bobot 400/500 saja |

Muat lewat `next/font` (self-hosted, subset Latin, `display: swap`). Hanya dua family; jangan menambah font ketiga.

| Token | Ukuran (fluid) | Line-height | Letter-spacing | Pakai untuk |
|---|---|---|---|---|
| `display-xl` | `clamp(72px, 17vw, 280px)` | 0.88 | -0.02em | Nama mempelai (hero, footer) |
| `display-l` | `clamp(48px, 9vw, 140px)` | 0.95 | -0.015em | Nama tamu di cover, judul section |
| `display-m` | `clamp(32px, 5vw, 72px)` | 1.05 | -0.01em | Kutipan, angka tanggal |
| `body-l` | `clamp(18px, 1.6vw, 22px)` | 1.55 | 0 | Paragraf utama |
| `body` | `16px` | 1.6 | 0 | Teks umum, form |
| `label` | `11–12px` UPPERCASE | 1.3 | 0.16–0.2em | Eyebrow, penomoran, metadata |

Aturan: `text-wrap: balance` untuk heading, `text-wrap: pretty` untuk paragraf; angka tanggal/jam memakai `font-variant-numeric: tabular-nums lining-nums`. Tidak ada teks rata tengah panjang (maks 2 baris pendek).

---

## 5. Layout & grid

- Grid 12 kolom desktop (gap `--space-6`), 4 kolom mobile (gap `--space-4`), margin `--gutter`.
- **Asimetri disengaja**: teks dan gambar saling bergeser antar kolom dan sedikit saling menimpa. Jangan semua serba tengah.
- Satu ide per layar. Section tidak seragam tingginya; ritme berganti antara padat dan lega.
- Hairline `1px var(--hairline)` untuk pembatas, bingkai gambar, dan baris agenda. Tidak ada drop shadow.
- Gambar: tajam, atau memakai `--radius-arch`. Pilih satu per konteks, jangan campur dalam satu section.
- Tinggi layar penuh memakai `svh`/`dvh`, **bukan** `vh`. Hormati safe area (`viewportFit: 'cover'` dan `env(safe-area-inset-*)`).
- **Mobile-first, rancang di 390px dulu.** Mayoritas tamu membuka dari WhatsApp di HP.

---

## 6. Motif "Benang" & elemen dasar

- **Benang SVG**: dua `path` hairline (`stroke: var(--deep)`, 1px, tanpa fill). Desktop: kurva lembut dari profil A dan profil B menuju tengah, menyatu di Acara. Mobile: satu garis vertikal di gutter kiri yang menebal (opacity & stroke) saat mendekati Acara. Digambar dengan `DrawSVGPlugin` (gratis sejak GSAP 3.13) atau `stroke-dashoffset`, di-scrub oleh ScrollTrigger.
- **Penomoran romawi** (I, II, III) dan label `label` sebagai penyusun hierarki, seperti di referensi.
- **Tautan**: garis bawah hairline yang digambar ulang saat hover (scaleX), tanpa perubahan warna agresif.
- **Tombol utama**: persegi (radius 2px), border 1px `--ink`, teks `label` + panah tipis. Hover: isi `--baby-blue` menyapu dari kiri (`clip-path`). Bukan pill gradien.

---

## 7. Storyboard section

Urutan, layout, dan motion tiap section. Selain yang ditulis, mobile mengikuti desktop yang disederhanakan.

### 0 · Cover (`#cover`)
- **Layout:** satu layar penuh, latar `--baby-blue`. Atas: label "UNDANGAN PERNIKAHAN". Tengah: `Kepada Yth.` (label) lalu **nama tamu** di `display-l` (maks 2 baris, balanced). Bawah: "Nama A & Nama B · [tanggal]" kecil dan tombol **Buka Undangan**.
- **Motion masuk:** nama tamu muncul per baris (mask reveal), hairline menggambar dari kiri.
- **Motion buka:** panel terbelah dua (`yPercent` -100 / +100, `ease-in-out`, 1.2s) membuka hero yang skalanya turun 1.15 → 1. Pada saat yang sama Lenis dinyalakan dan musik dimulai (autoplay tidak dipaksa; mulai dari klik ini).
- **Reduced motion:** crossfade 0.4s.
- Scroll terkunci (`lenis.stop()` + `overflow: hidden`) sampai dibuka.

### 1 · Hero (`#hero`)
- **Layout:** latar `--paper`. Nama mempelai `display-xl` bertumpuk ("Nama A" / "& Nama B", `&` italic berwarna `--deep`). Potret berbentuk lengkung (`--radius-arch`) di tengah-kanan, menimpa sebagian nama. Empat label sudut: kiri-atas "THE WEDDING OF", kanan-atas tanggal `12 · 12 · 2026`, kiri-bawah kota, kanan-bawah "SCROLL" dengan garis kecil yang bergerak.
- **Motion:** potret terbuka via `clip-path` dari bawah + skala dalam 1.25 → 1; nama per baris. Scrub: nama bergeser ke sisi berlawanan (`x` ±8vw), `&` berputar halus, potret membesar sedikit.
- **Placeholder:** potret lengkung 4:5 (kotak `--mist` berlabel).

### 2 · Pembuka (`#quote`)
- **Layout:** satu paragraf `display-m`, 3–4 baris, kolom lebar 8/12, rata kiri dengan indent. Latar `--paper`.
- **Motion:** setiap kata menyala dari opacity 0.15 → 1, di-scrub per kata sepanjang scroll (`SplitText` words). Teks dari template `opening_line`.

### 3 · Mempelai (`#couple`)
- **Layout desktop:** dua profil bertingkat (A kiri-atas, B kanan-bawah, offset ~20vh), bernomor **I** dan **II**. Tiap profil: potret lengkung 4:5, nama `display-l`, baris orang tua (`label`), bio 2–3 baris.
- **Motion:** gambar terbuka via clip-path dan parallax berlawanan arah (`yPercent` -6 / +6 scrub). Titik awal benang SVG ada di sini.
- **Mobile:** ditumpuk, benang menjadi garis vertikal di gutter.

### 4 · Cerita (`#story`) — opsional (toggle di pengaturan)
- **Layout:** section **pinned** setinggi ~300vh, tiga momen ("Awal bertemu", "Bersama", "Menuju hari ini"). Numeral besar 01/02/03 di kiri, media di kanan, teks pendek di bawah numeral. Garis progres hairline.
- **Motion:** pergantian momen lewat mask-swap (numeral & teks naik-turun, gambar `clip-path`), di-scrub oleh timeline pin.
- **Mobile:** tanpa pin; tiap momen = blok vertikal dengan reveal biasa (lebih ringan dan aman untuk jempol).

### 5 · Acara (`#event`)
- **Layout:** latar bergeser ke `--baby-blue` (di-scrub). Satu blok besar untuk **Resepsi**: label "RESEPSI PERNIKAHAN", **angka tanggal raksasa** (`display-xl`), hari + bulan (`label`). Di bawahnya tiga baris label-nilai berbatas hairline (TANGGAL / WAKTU / LOKASI), lalu nama tempat, alamat, tautan "Buka Maps", dan "Tambah ke kalender". Di bawahnya blok **countdown** (HARI / JAM / MENIT / DETIK, angka `display-l` tabular).
- **Personalisasi:** jika tamu punya jam hadir sendiri, tampilkan blok berbingkai hairline "Waktu kehadiran Anda" berisi `{{jam_hadir}} WITA` + kalimat `invite_line` sesuai nada. Jika tidak, tampilkan jam acara biasa.
- **Motion:** benang menyatu tepat di bagian ini (momen penutup motif). Angka tanggal naik dengan mask; digit countdown bergulir (translateY di dalam mask) setiap detik, hanya saat section terlihat.

### 6 · Galeri (`#gallery`)
- **Desktop:** scroll horizontal **pinned**. Gambar berbagai ukuran dengan offset vertikal berbeda, bernomor (`01 / 08`). Kursor kustom berlabel "DRAG/SCROLL" (desktop saja).
- **Mobile:** tanpa pin; lajur horizontal native dengan `scroll-snap`, indikator garis tipis di bawah.
- **Motion:** tiap gambar clip-path reveal ketika masuk viewport horizontal (`containerAnimation`); parallax internal tipis.

### 7 · Hadiah (`#gift`)
- **Layout:** teks singkat + accordion "Kirim hadiah" (tertutup secara default). Isi: baris berbatas hairline per rekening (bank, atas nama, nomor dengan `tabular-nums`) dan tombol **Salin**.
- **Micro-interaction:** setelah salin, label tombol berubah menjadi "Tersalin" selama 1.8s (tanpa emoji, tanpa toast besar).

### 8 · RSVP (`#rsvp`)
- **Layout:** judul "Akan hadir?" `display-l`. Form berlangkah dalam satu layar:
  1. Dua blok pilihan besar (radio semantik): "Dengan senang hati hadir" / "Belum bisa hadir". Hover/terpilih: isi `--baby-blue`.
  2. Jika hadir: stepper jumlah tamu (1…maks).
  3. Nomor WhatsApp (hanya bila belum ada), field bergaris bawah dengan penjelasan satu baris.
  4. Ucapan: textarea auto-grow + penghitung karakter.
  5. Tombol kirim.
- **State sukses:** judul berganti ke copy personal (`rsvp_thanks_*`), garis menggambar, centang SVG tergambar; tombol "Tambah ke kalender" dan "Ubah jawaban".
- **Setelah tenggat:** form read-only + pesan sopan.
- Validasi inline, `aria-live="polite"`, fokus berpindah ke pesan error pertama.

### 9 · Ucapan (`#wishes`)
- **Layout:** dua kolom masonry sederhana (satu kolom di mobile): nama (`label`) + ucapan (`body-l`), pembatas hairline. Tombol "Muat lebih banyak".
- **Motion:** item masuk bertahap saat scroll; tanpa marquee otomatis (mengganggu keterbacaan).

### 10 · Penutup (`#footer`)
- **Layout:** latar `--baby-blue`. Kalimat terima kasih personal, lalu **nama mempelai raksasa** (`display-xl`, terpotong sedikit di tepi bawah) dengan parallax horizontal tipis. Baris kecil: "Kembali ke atas".
- **Motion:** nama masuk per baris; scrub `x` kecil.

### Elemen persisten
- **Menu**: teks kecil "MENU" di kanan-atas → overlay layar penuh, tautan serif besar dengan stagger. Tautan "RSVP" selalu ada di kiri-atas setelah cover.
- **Progres scroll**: hairline 1px di tepi atas.
- **Musik**: tombol kecil kiri-bawah dengan tiga garis berayun (CSS), toggle senyap/putar.
- **Tidak ada** navigasi pill melayang di bawah layar.

---

## 8. Sistem motion

**Prinsip:** setiap jenis elemen punya perlakuan sendiri. Dilarang fade-up identik di semua elemen.

| Elemen | Perlakuan |
|---|---|
| Heading | `SplitText` per baris dengan mask (`type: 'lines'`, `mask: 'lines'`, `autoSplit: true` agar re-split saat font/resize), `yPercent: 110 → 0`, stagger 0.08 |
| Paragraf | Reveal per baris, `opacity 0 → 1` + `y: 16 → 0` |
| Gambar | `clip-path: inset()` terbuka + skala dalam 1.25 → 1; parallax scrub tipis (`yPercent` ±6–8) |
| Garis | `scaleX 0 → 1` (origin kiri) atau DrawSVG |
| Latar section | Scrub warna `--paper` ↔ `--baby-blue` antar section |
| Angka | Mask roll (translateY) |

**Easing & durasi:** masuk `expo.out` / `power4.out`, transisi besar `expo.inOut`. Durasi 0.9–1.4s (mikro 0.3s). Tidak ada `bounce` atau `elastic`. Posisi trigger: teks `top 85%`, gambar `top 78%`. Reveal teks `once`; parallax di-scrub.

**Smooth scroll (Lenis x ScrollTrigger)**, satu provider client di root undangan:

```ts
// package: `lenis` (bukan @studio-freight/lenis)
const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```
- Lenis hanya untuk wheel/desktop; di layar sentuh biarkan scroll native (default `syncTouch: false`).
- Cover: `lenis.stop()` sampai dibuka.
- `ScrollTrigger.config({ ignoreMobileResize: true })` untuk mencegah lompatan akibat address bar mobile.

**Disiplin GSAP:**
- Selalu `useGSAP({ scope })` untuk cleanup otomatis; daftar plugin sekali di `lib/motion/gsap.ts`.
- Pisahkan desktop/mobile dan reduced motion dengan `gsap.matchMedia()`.
- Hanya animasikan `transform`, `opacity`, `clip-path`. Dilarang `width/height/top/left`.
- Panggil `ScrollTrigger.refresh()` setelah font dan gambar siap. Beri `aspect-ratio` pada semua media agar tidak ada CLS.
- `will-change` hanya pada elemen yang sedang dianimasikan dan dilepas setelah selesai.
- Pin: gunakan `pin`, `anticipatePin: 1`, dan hindari pin bersarang.
- Desktop saja (`pointer: fine`): tombol magnetik halus (jarak ≤ 12px) dan kursor kustom kecil.

---

## 9. Komponen UI

- **Field**: tanpa kotak; label `label` di atas, input `body-l`, garis bawah hairline yang berubah ke `--ink` saat fokus (digambar dari kiri). Error: teks `--deep` + ikon teks sederhana, bukan merah menyala.
- **Pilihan besar (radio)**: blok bergaris, `min-height: 96px`, label serif `display-m`.
- **Stepper jumlah tamu**: tombol − / + 44×44px, angka `display-m` tabular di tengah.
- **Accordion**: baris hairline, penanda `+` yang berputar menjadi `−`, tinggi dianimasikan lewat `grid-template-rows` (bukan `height`).
- **Fokus**: `outline: 2px solid var(--deep); outline-offset: 3px` pada semua elemen interaktif.
- **Target sentuh** minimal 44×44px.

---

## 10. Personalisasi visual

Nama tamu adalah momen tipografi, bukan sekadar teks sisip:
- Cover menampilkan nama dalam `display-l` dengan pemotongan baris yang seimbang. Nama panjang mengecil dengan `clamp` + `text-wrap: balance`, tidak pernah terpotong atau overflow.
- Fallback elegan: tanpa nama → "Tamu Undangan"; tanpa panggilan → kata pertama nama; tanpa sapaan → tidak ada spasi ganjil.
- Grup/nada memengaruhi **copy**, bukan layout (layout tetap satu keluarga agar kualitas terjaga).
- Uji dengan nama ekstrem: 1 kata ("Wayan"), 5 kata panjang, huruf besar semua, karakter non-ASCII, nama dengan gelar ("Dr. I Made Surya, S.Kom., M.T.").

---

## 11. Copywriting & suara

**Suara:** hangat, tenang, spesifik. Kalimat pendek. Boleh puitis, tidak boleh bombastis. Tidak ada klise ("Di hari yang berbahagia ini…", "Merajut kasih…") kecuali memang dibutuhkan untuk formalitas, dan itupun ditulis ulang. Tiga nada:

- `formal`: sopan, jarak terjaga (orang tua, atasan, tamu terhormat)
- `warm`: akrab tapi santun (default)
- `casual`: santai dan bercanda ringan (teman dekat)

Seed awal `copy_templates` (boleh disunting di admin):

| key | formal | warm | casual |
|---|---|---|---|
| `cover_greeting` | Kepada Yth.<br>{{sapaan}} {{nama}} | Untuk {{sapaan}} {{panggilan}},<br>yang kehadirannya kami nantikan. | Hai, {{panggilan}}!<br>Kamu ada di daftar orang yang paling ingin kami lihat hari itu. |
| `opening_line` | Dengan segala kerendahan hati, kami mengundang Anda untuk menjadi saksi hari bahagia kami. | Ada satu hari yang ingin kami bagi bersama orang-orang yang berarti. Salah satunya, Anda. | Kami akhirnya menikah, dan acaranya nggak lengkap tanpa kamu. |
| `invite_line` | Kami mengundang {{sapaan}} {{nama}} untuk hadir pada {{tanggal}}, pukul {{jam_hadir}}. | Satu kursi sudah kami siapkan untuk {{panggilan}} pada {{tanggal}}. Mohon datang sekitar pukul {{jam_hadir}}. | Catat ya, {{panggilan}}: {{tanggal}}, jam {{jam_hadir}}. Siapkan outfit terbaikmu. |
| `rsvp_prompt` | Mohon konfirmasi kehadiran Anda. | Kabari kami ya, apakah {{panggilan}} bisa hadir? | Jadi, bisa datang nggak, {{panggilan}}? |
| `rsvp_thanks_attending` | Terima kasih, {{sapaan}} {{nama}}. Konfirmasi kehadiran Anda telah kami terima. | Terima kasih, {{panggilan}}. Sampai bertemu pada {{tanggal}}! | Siap, {{panggilan}}! Kursimu sudah kami catat. |
| `rsvp_thanks_declining` | Terima kasih atas kabar dan doa baik {{sapaan}} {{nama}}. | Terima kasih sudah memberi kabar, {{panggilan}}. Doa baikmu sudah sangat berarti. | Tidak apa-apa, {{panggilan}}. Makasih sudah kasih kabar! |
| `closing_line` | Atas kehadiran dan doa restu Anda, kami ucapkan terima kasih. | Terima kasih sudah menjadi bagian dari cerita kami, {{panggilan}}. | Makasih udah ada di sini, {{panggilan}}. Sampai ketemu! |
| `wa_invite` (di Pengaturan) | Yth. {{sapaan}} {{nama}}, dengan hormat kami mengundang Anda ke pernikahan {{mempelai}}. Detail dan konfirmasi kehadiran: {{link}} | Halo {{sapaan}} {{panggilan}}, dengan bahagia kami mengundang Anda ke pernikahan {{mempelai}}. Detail dan konfirmasi kehadiran ada di sini: {{link}} | Halo {{panggilan}}! Kami mau menikah dan kamu harus datang. Detail ada di sini: {{link}} |

Aturan copy:
- Maksimum satu tanda seru per blok teks.
- Dilarang emoji di UI undangan (pesan WA boleh, dikontrol admin).
- Setiap placeholder harus punya fallback (lihat `PLAN.md §4E`); uji renderer dengan data kosong.
- Teks placeholder dibuat jelas ("[Nama A]", "[Kota]") supaya tidak lolos ke produksi tanpa sengaja.

---

## 12. Panduan UI admin

Fungsional dulu, tetap satu keluarga dengan undangan.
- `shadcn/ui` + Tailwind; font Hanken Grotesk, serif hanya untuk judul halaman. Latar `--paper`, aksen `--baby-blue`, tombol utama `--ink`.
- Navigasi: sidebar (desktop) / tab bawah (mobile). Halaman: **Ringkasan, Tamu, RSVP, Ucapan, Konten, Acara & Pengaturan, Import/Export**.
- Tabel: header sticky, pagination server-side, kolom bisa disembunyikan, `/` memfokuskan pencarian. Drawer untuk tambah/edit. Optimistic update + `sonner` untuk toast.
- Dapat dipakai nyaman dari HP (admin mungkin membukanya di lokasi acara).
- Aksi destruktif: dialog konfirmasi; hapus massal wajib ketik `HAPUS`.
- Empty state menjelaskan langkah berikutnya, bukan sekadar "Tidak ada data".

---

## 13. Aksesibilitas & performa

**Aksesibilitas**
- Kontras teks ≥ 4.5:1; fokus terlihat; seluruh form bisa dioperasikan dengan keyboard.
- `prefers-reduced-motion`: tanpa pin, parallax, scrub, atau split; reveal diganti fade 0.3s.
- Gambar bermakna punya `alt`; dekorasi `alt=""`. Video dekoratif `aria-hidden`, tanpa suara.
- Musik tidak pernah autoplay tanpa interaksi; selalu ada tombol senyap.
- Bahasa dokumen `lang="id"`.

**Performa (anggaran)**
- LCP ≤ 2.5s, CLS < 0.05, INP baik, di HP kelas menengah dengan 4G.
- JS awal (gzip) ≤ ~200 KB termasuk GSAP + ScrollTrigger + SplitText + Lenis. Muat komponen berat (galeri, countdown, wishes) dengan `next/dynamic` bila perlu.
- Gambar: `next/image`, AVIF/WebP, `sizes` benar, `priority` hanya untuk gambar hero. Video: `poster`, `muted playsInline preload="metadata"`, ≤ 2.5 MB; di `saveData`/reduced motion pakai poster saja.
- Font: dua family, di-preload, subset Latin.
- Hanya satu `ScrollTrigger` per perilaku; matikan/bersihkan saat unmount.
- Uji di perangkat nyata (iOS Safari & Chrome Android), bukan hanya emulator.

---

## 14. Anti-slop (dilarang keras)

- Gradien ungu/pink, teks bergradien, glow/neon, glassmorphism sebagai gaya default
- Kartu `rounded-2xl shadow-lg` berjejer, grid tiga kolom "fitur"
- Emoji atau ikon generik sebagai dekorasi (hati, cincin, bunga clip-art)
- Font Inter/Roboto/Arial/system-ui, atau pasangan font pilihan asal
- Semuanya rata tengah; semua section sama tinggi dan sama jarak
- Hero "Welcome to our wedding" dengan tombol pill
- Hitam murni, abu netral kusam, biru tua pekat sebagai warna dominan
- Animasi yang sama di semua elemen; hover scale berlebihan; bounce/elastic
- Dekorasi tanpa fungsi: blob, partikel, confetti, bunga melayang
- Lorem ipsum, foto stok acak, URL gambar eksternal
- Komentar kode yang menjelaskan hal sepele; komponen "serba bisa" dengan 20 props

Uji cepat tiap section: *"Kalau logo dan warna dihapus, apakah ini masih terlihat seperti situs yang dirancang untuk pernikahan ini?"* Jika terlihat seperti template apa pun, rancang ulang.

---

## 15. Asset map (placeholder → aset asli)

Semua dirujuk dari satu file (`content/assets.ts`) agar penggantian cukup di satu tempat. Placeholder: kotak `--mist`/`--baby-blue` dengan `aspect-ratio` yang benar dan label jelas.

| Aset | Spesifikasi | Dipakai di |
|---|---|---|
| Video hero (opsional) | Portrait 9:16, 720×1280, 8–12 dtk, MP4/WebM ≤ 2.5 MB, grading lembut dingin | Hero |
| Potret mempelai ×2 | 4:5, ≥ 1600px sisi panjang, latar sederhana | Hero, Mempelai |
| Foto cerita ×3 | 4:5 atau 3:4, ≥ 1400px | Cerita |
| Galeri ×8–12 | Campuran portrait & landscape, ≥ 1600px | Galeri |
| Ornamen/garis | SVG, `stroke` mengikuti token | Benang, pembatas |
| Musik | MP3 ≤ 3 MB, loop halus, 128–192 kbps | Musik toggle |
| OG image | 1200×630 (default), versi personal sebagai stretch | Preview WhatsApp |
| Favicon / monogram | SVG + PNG 512 | Tab, ikon |

---

## 16. Visual QA rubric

Ambil screenshot di **390 / 768 / 1440 px** dan rekam layar di HP nyata. Nilai 1–5 untuk tiap butir; target rata-rata ≥ 4 dan tidak ada nilai < 3.

1. **Hierarki:** satu fokus per layar, terbaca dalam 2 detik
2. **Whitespace:** terasa lega, bukan kosong tanpa tujuan
3. **Tipografi:** dua font, skala konsisten, tidak ada baris yatim/janda yang jelek
4. **Konsistensi motif:** hairline, penomoran, benang terasa satu sistem
5. **Warna:** baby blue terasa sebagai identitas; tidak ada warna di luar token
6. **Motion:** setiap gerak punya tujuan; tidak ada jank; berhenti rapi saat reduced motion
7. **Mobile:** nyaman dengan jempol, tidak ada scroll horizontal tak sengaja, pin tidak "menjebak"
8. **Copy:** suara konsisten, tidak ada `undefined`/`{{…}}`, nama ekstrem aman
9. **Mikro-interaksi:** hover, fokus, tombol salin, sukses RSVP terasa dirancang
10. **Polish:** tidak ada layout shift, tidak ada flash font, tidak ada error konsol

Di akhir tiap fase, tulis **3 hal yang masih paling terlihat generik** dan perbaiki sebelum lanjut.