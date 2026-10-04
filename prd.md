# PLAN.md — Undangan Digital Pernikahan

> Sumber kebenaran untuk **apa** yang dibangun dan **bagaimana** arsitekturnya.
> Tampilan, motion, dan copy ada di `DESIGN.md`. Kalau dua file ini bentrok, tanyakan; jangan pilih sendiri.
> Centang checkbox di §11 setiap task selesai.

---

## 1. Ringkasan

Website undangan pernikahan yang **personal per tamu**: setiap tamu menerima link unik, melihat sapaan, copywriting, dan jam hadir yang berbeda, lalu konfirmasi kehadiran. Dua admin mengelola semuanya lewat dashboard (CRUD, import CSV, rekap RSVP).

### Keputusan terkunci

| Area | Keputusan |
|---|---|
| Framework | Next.js App Router + TypeScript (project sudah di-init) |
| Database | Supabase Postgres |
| API | Route Handlers Next.js (`app/api/*`), tanpa backend terpisah |
| Auth admin | Supabase Auth + Google OAuth, hanya 2 email allowlist |
| Akses data | Semua query lewat server (service role key, `server-only`). RLS aktif, **tanpa policy publik** |
| Link tamu | `/u/{token}`: token acak, **bukan nama** |
| Zona waktu | `Asia/Makassar` (WITA) sebagai default, configurable via env |
| Bahasa | Indonesia |
| Acara | **Satu acara saja: resepsi** (tanpa akad, tanpa multi-sesi) |
| Aset (foto/video/musik) | Placeholder dulu; lihat *Asset map* di `DESIGN.md` |

### Admin allowlist

- `adityamph1@gmail.com`
- `arisiki123@gmail.com`

---

## 2. Scope

**Masuk v1**
1. Halaman undangan personal per tamu (`/u/{token}`) + halaman umum (`/`) untuk pengunjung tanpa token
2. RSVP (hadir / tidak hadir, jumlah tamu, ucapan)
3. Tamu menambahkan nomor HP sendiri jika belum ada di data
4. Dashboard admin: CRUD tamu, RSVP, ucapan, template copy, pengaturan acara
5. Import CSV (nama, no HP + kolom dinamis opsional) dan export CSV
6. Jam hadir dan nada copy yang bisa berbeda per tamu
7. Tombol kirim via WhatsApp (`wa.me` deep link, dikirim manual oleh admin)

**Di luar v1** (lihat Backlog §13): kirim WA otomatis/blast, check-in QR di lokasi, multi-event/multi-tenant, pembayaran/amplop digital terverifikasi.

---

## 3. Peran & hak akses

| Peran | Cara akses | Boleh |
|---|---|---|
| Tamu | Link `/u/{token}` | Lihat undangan sendiri, kirim/ubah RSVP sendiri, isi/ubah nomor HP sendiri, lihat dinding ucapan (nama + ucapan saja) |
| Pengunjung | `/` tanpa token | Melihat undangan umum; bila `allow_public_registration` aktif, daftar dengan nama + HP |
| Admin | Google SSO (allowlist) | Semua CRUD, import/export, moderasi ucapan |

Tamu **tidak pernah** bisa melihat data tamu lain (nomor HP, status RSVP, daftar tamu).

---

## 4. Fitur & kriteria penerimaan

### A. Login admin (Google SSO)
- Tombol "Masuk dengan Google" di `/admin/login`.
- Setelah callback, email dicek terhadap tabel `admin_emails` (case-insensitive, wajib `email_verified`). Tidak lolos: sign out + pesan "Akun ini tidak punya akses".
- `middleware.ts` melindungi `/admin/*` dan `/api/admin/*`. Setiap route handler admin tetap memanggil `requireAdmin()` (jangan hanya mengandalkan middleware).
- Logout tersedia di header dashboard.

### B. Manajemen tamu (CRUD)
- Tabel server-side pagination (50/halaman), search nama/HP, filter: status RSVP, grup, ada/tanpa HP, perlu review, batch import.
- Tambah / edit via drawer: nama, panggilan, sapaan, HP, grup, nada, maks tamu, jam hadir (mulai & selesai), pesan khusus, catatan internal.
- Hapus satu tamu (dialog konfirmasi). Hapus massal butuh ketik `HAPUS`.
- Aksi per baris: salin link, salin pesan WA, buka `wa.me`, lihat sebagai tamu (`?preview=1`, tidak menghitung "dibuka").
- Bulk edit: ubah grup, nada, jam hadir untuk banyak tamu sekaligus (berguna untuk gelombang kedatangan).

### C. Import CSV
- Upload `.csv` (UTF-8, BOM aman, delimiter `,` `;` atau tab otomatis; Excel Indonesia sering memakai `;`).
- Parse di client (PapaParse), validasi ulang di server.
- Langkah: **Upload → Preview & validasi → Pilih mode duplikat → Commit → Ringkasan**.
- Preview menampilkan jumlah valid / peringatan / error, tabel per baris dengan status, dan tombol unduh laporan error.
- Duplikat dideteksi lewat **nomor HP ternormalisasi**. Mode: `lewati` atau `perbarui` (hanya field yang terisi di CSV).
- Baris tanpa HP tetap boleh masuk (ditandai "tanpa nomor"); nama kembar tanpa HP memicu peringatan, bukan error.
- Setiap commit membuat `import_batches`. Tersedia "Batalkan batch": hanya menghapus tamu dari batch itu yang **belum punya RSVP**; sisanya dilaporkan.
- Batas: 5.000 baris / 2 MB. Tersedia unduhan `template.csv` berisi contoh.

**Kolom CSV** (header tidak case-sensitive, alias diterima):

| Kolom | Wajib | Alias | Catatan |
|---|---|---|---|
| `nama` | ya | name | |
| `no_hp` | tidak | hp, phone, wa, whatsapp, nomor | Dinormalisasi ke E.164. Nol di depan yang dibuang Excel (`812…`) tetap dikenali |
| `panggilan` | tidak | nickname | Dipakai di copy kasual. Kosong = kata pertama nama |
| `sapaan` | tidak | salutation | Bapak / Ibu / Kak / Saudara / dll |
| `grup` | tidak | group | Teks bebas: Keluarga, Teman SMA, Kantor, … |
| `maks_tamu` | tidak | pax, max_pax | Default 2 |
| `tanggal_hadir` | tidak | | `YYYY-MM-DD`, `DD/MM/YYYY`, atau `DD-MM-YYYY`. Kosong = tanggal acara |
| `jam_hadir` | tidak | | `HH:mm` atau `HH.mm`, dibaca dalam zona waktu event |
| `jam_selesai` | tidak | | Opsional, membuat rentang "11.00–12.00" |
| `nada` | tidak | tone | `formal` / `warm` / `casual`, default `warm` |
| `pesan_khusus` | tidak | pesan, custom_message | Menimpa copy pembuka untuk tamu ini |
| `catatan` | tidak | note | Internal, tidak tampil ke tamu |

Aturan: `jam_hadir` saja sudah cukup (tanggal otomatis memakai tanggal acara). `tanggal_hadir` tanpa `jam_hadir` = peringatan dan diabaikan.

### D. Export CSV
- Export tamu + status RSVP (nama, HP, grup, jam hadir, status, pax, ucapan, dibuka?, link). Mengikuti filter aktif.
- Format kolom sama dengan import supaya bisa diedit di spreadsheet lalu di-import ulang (mode `perbarui`).
- Escape rumus: sel yang diawali `= + - @` diberi prefix `'` agar tidak dieksekusi di Excel.

### E. Konten dinamis per tamu
Urutan penentuan copy untuk satu slot (mis. sapaan cover):
1. `guest.custom_message` (hanya slot `personal_message`)
2. `copy_templates` dengan `key` + `tone` milik tamu
3. `copy_templates` dengan `key` + `tone = 'any'`
4. Default hardcode di kode (selalu ada, supaya situs tidak pernah kosong)

Placeholder yang didukung: `{{sapaan}} {{nama}} {{panggilan}} {{tanggal}} {{jam_hadir}} {{lokasi}} {{link}} {{mempelai}}`.
Placeholder tanpa nilai dihapus dengan rapi (spasi/tanda baca disesuaikan). **Tidak boleh** muncul `undefined`, `null`, atau `{{…}}` di UI. Render sebagai teks, bukan HTML.

Penentuan waktu: `guest.arrival_at/until` (jika ada) → `settings.event_starts_at` → bila kosong, tampilkan tanggal acara saja.

### F. Link & share
- Token 12 karakter dari `nanoid` dengan alphabet tanpa karakter ambigu (tanpa `0 O o 1 l I`).
- Link: `{NEXT_PUBLIC_SITE_URL}/u/{token}`.
- Template pesan WA (`settings.wa_message_template`) dirender per tamu → `https://wa.me/{nomor tanpa +}?text={encodeURIComponent(pesan)}`. Tamu tanpa HP: tombol WA nonaktif, tersedia "Salin pesan".
- Halaman undangan: `noindex`, tanpa sitemap.
- Token tidak valid → halaman 404 yang ramah dan on-brand (tanpa membocorkan apakah token pernah ada).

### G. RSVP
- Form: status (hadir / tidak hadir), jumlah tamu (1…`max_pax`, hanya jika hadir), nomor HP (hanya jika belum ada), ucapan (maks 500 karakter, opsional).
- Satu RSVP per tamu; dapat diubah sampai `rsvp_deadline` (jika diisi). Admin dapat mengubah kapan saja.
- Validasi `pax <= max_pax` di API.
- State sukses memakai copy personal sesuai nada dan status.
- Ada "Tambah ke kalender" (`.ics` per tamu memakai jam hadirnya).

### H. Tamu menambah nomor HP
- **Kasus 1: tamu dari CSV tanpa HP.** Form RSVP menampilkan kolom HP. Nilai disimpan ke tamu itu.
- **Kasus 2: pengunjung di `/` tanpa token** (hanya bila `allow_public_registration`). Isi nama + HP, lalu sistem membuat tamu `source = self_added`, `needs_review = true`, dan mengarahkan ke `/u/{token}` barunya (token juga disimpan di `localStorage`).
- Jika HP yang diinput **sudah ada** di data: jangan membuat duplikat dan jangan membocorkan nama pemilik. Pulihkan sesi ke tamu itu hanya jika HP + nama cocok secara kasar; selain itu tampilkan "Nomor ini sudah terdaftar, gunakan link undangan Anda atau hubungi mempelai."
- Admin melihat badge "Perlu review" dan dapat menyetujui/mengedit/menghapus.

### I. Dinding ucapan
- Publik menampilkan `nickname || name` + ucapan + waktu, paginasi kursor. Tidak pernah menampilkan HP.
- Admin dapat menyembunyikan/menampilkan (`wish_visible`), mengedit, atau menghapus.

### J. Template copy
- CRUD `copy_templates` (key × nada). Ada tombol "Pratinjau dengan tamu…" yang merender template untuk satu tamu contoh.
- Seed awal dari contoh di `DESIGN.md §11`.

### K. Acara & pengaturan
- Detail acara (resepsi): mulai, selesai, nama tempat, alamat, URL Maps.
- Pengaturan: nama mempelai, tenggat RSVP, `allow_public_registration`, template pesan WA, rekening/e-wallet, URL musik.

### L. Ringkasan dashboard
Kartu: total diundang, total kursi (jumlah `max_pax`), sudah membuka (%), sudah merespons (%), hadir (orang), tidak hadir, belum merespons, tanpa nomor HP, perlu review. Daftar 10 RSVP terbaru.

---

## 5. Data model

Satu migrasi: `supabase/migrations/0001_init.sql`. Seed admin: `supabase/seed.sql`.

```sql
create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create type rsvp_status  as enum ('attending', 'not_attending');
create type guest_source as enum ('csv', 'manual', 'self_added');

-- Allowlist admin (sumber kebenaran tunggal)
create table admin_emails (
  email text primary key check (email = lower(email))
);

-- Pengaturan global (satu baris)
create table settings (
  id int primary key default 1 check (id = 1),
  groom_name text not null default 'Nama A',
  bride_name text not null default 'Nama B',
  rsvp_deadline timestamptz,
  event_starts_at timestamptz,                 -- resepsi
  event_ends_at timestamptz,
  venue_name text,
  venue_address text,
  maps_url text,
  allow_public_registration boolean not null default false,
  wa_message_template text not null default
    'Halo {{sapaan}} {{panggilan}}, dengan bahagia kami mengundang Anda ke pernikahan {{mempelai}}. Detail dan konfirmasi kehadiran ada di sini: {{link}}',
  bank_accounts jsonb not null default '[]',   -- [{bank, account_name, account_number}]
  music_url text,
  updated_at timestamptz not null default now()
);
insert into settings default values;

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  filename text,
  row_count int not null default 0,
  created_count int not null default 0,
  updated_count int not null default 0,
  skipped_count int not null default 0,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  nickname text,
  salutation text,
  phone text,                                   -- E.164, mis. +6281234567890
  group_label text,
  tone text not null default 'warm' check (tone in ('formal','warm','casual')),
  max_pax int not null default 2 check (max_pax between 1 and 20),
  arrival_at timestamptz,                       -- override jam hadir
  arrival_until timestamptz,
  custom_message text check (char_length(custom_message) <= 600),
  internal_note text,
  source guest_source not null default 'manual',
  needs_review boolean not null default false,
  import_batch_id uuid references import_batches(id) on delete set null,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (arrival_until is null or arrival_at is null or arrival_until >= arrival_at)
);
create unique index guests_phone_uniq on guests (phone) where phone is not null;
create index guests_name_idx  on guests (lower(name));
create index guests_group_idx on guests (group_label);

create table rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references guests(id) on delete cascade,
  status rsvp_status not null,
  pax int not null default 1 check (pax between 0 and 20),
  wish text check (char_length(wish) <= 500),
  wish_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index rsvps_created_idx on rsvps (created_at desc);

create table copy_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null,                            -- cover_greeting, invite_line, rsvp_thanks_attending, ...
  tone text not null default 'any' check (tone in ('any','formal','warm','casual')),
  body text not null check (char_length(body) <= 800),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (key, tone)
);

-- updated_at otomatis
create trigger trg_settings_u  before update on settings       for each row execute function set_updated_at();
create trigger trg_guests_u    before update on guests         for each row execute function set_updated_at();
create trigger trg_rsvps_u     before update on rsvps          for each row execute function set_updated_at();
create trigger trg_templates_u before update on copy_templates for each row execute function set_updated_at();

-- RLS aktif, TANPA policy: anon/authenticated tidak bisa membaca apa pun langsung.
-- Semua akses lewat server dengan service role.
alter table admin_emails    enable row level security;
alter table settings        enable row level security;
alter table import_batches  enable row level security;
alter table guests          enable row level security;
alter table rsvps           enable row level security;
alter table copy_templates  enable row level security;

-- Hardening (disarankan): hanya email allowlist yang boleh membuat akun auth
create or replace function public.block_non_admin_signup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admin_emails where email = lower(new.email)) then
    raise exception 'Email tidak diizinkan';
  end if;
  return new;
end $$;
create trigger trg_block_non_admin_signup before insert on auth.users
  for each row execute function public.block_non_admin_signup();
```

`supabase/seed.sql`:
```sql
insert into admin_emails (email) values
  ('adityamph1@gmail.com'),
  ('arisiki123@gmail.com')
on conflict do nothing;
```

---

## 6. Arsitektur & struktur folder

```
app/
  (public)/
    page.tsx                    # undangan umum (tanpa token) + form registrasi bila aktif
    u/[token]/page.tsx          # undangan personal (server component: ambil data, render client <Invitation/>)
    u/[token]/opengraph-image.tsx   # stretch: OG personal
  admin/
    login/page.tsx
    (dashboard)/
      layout.tsx                # sidebar/topbar + guard
      page.tsx                  # ringkasan
      guests/…  rsvps/…  wishes/…  content/…  settings/…  import/…
  auth/callback/route.ts        # tukar code, cek allowlist
  api/
    public/{open,rsvp,register,phone,wishes,ics}/…
    admin/{guests,rsvps,wishes,templates,settings,import,export,stats}/…
components/
  invitation/                   # section, motion, UI undangan (client)
  admin/                        # shadcn/ui hanya untuk admin
lib/
  supabase/{server,browser,admin}.ts   # admin.ts: service role, `import 'server-only'`
  auth/requireAdmin.ts
  guests/{token,phone,schema}.ts
  csv/{parse,validate,template}.ts
  copy/{render,defaults}.ts
  time/tz.ts                    # format & parse dalam zona event
  motion/{gsap,lenis}.ts        # registrasi plugin & provider
content/                        # hanya default copy; teks bisnis ada di DB
supabase/{migrations,seed.sql}
```

Aturan arsitektur:
- Halaman `/u/[token]` adalah **server component dinamis** (`dynamic = 'force-dynamic'`): mengambil `GuestView` dari DB, merender copy di server, lalu mengoper props serializable ke `<Invitation/>` client. GSAP/Lenis **hanya** di komponen client.
- Tipe `GuestView` didefinisikan sekali (`lib/guests/view.ts`); Phase 1 memakai mock yang bertipe sama, sehingga integrasi DB tidak mengubah komponen.
- Validasi semua input dengan `zod` di setiap route handler. Batasi ukuran body.
- `SUPABASE_SERVICE_ROLE_KEY` tidak pernah diimpor dari file yang bisa masuk bundle client.

---

## 7. Kontrak API

Semua respons JSON `{ ok: true, data } | { ok: false, error: { code, message } }`.

### Publik (`/api/public/*`)

| Method | Path | Body / Query | Fungsi |
|---|---|---|---|
| POST | `/open` | `{ token }` | Catat pembukaan (sekali per sesi browser, dipanggil dari client setelah cover dibuka) |
| POST | `/rsvp` | `{ token, status, pax?, wish?, phone? }` | Buat/ubah RSVP |
| PATCH | `/phone` | `{ token, phone }` | Isi/ubah HP tamu |
| POST | `/register` | `{ name, phone }` | Registrasi umum (jika diaktifkan) → `{ token }` |
| GET | `/wishes` | `?cursor=` | Dinding ucapan |
| GET | `/ics/[token]` | | File kalender per tamu |

### Admin (`/api/admin/*`, semua `requireAdmin()`)

| Resource | Endpoint |
|---|---|
| Tamu | `GET/POST /guests`, `PATCH/DELETE /guests/[id]`, `PATCH/DELETE /guests/bulk` |
| RSVP | `GET /rsvps`, `PATCH/DELETE /rsvps/[id]` |
| Ucapan | `PATCH/DELETE /wishes/[rsvpId]` |
| Template | `GET/POST /templates`, `PATCH/DELETE /templates/[id]` |
| Pengaturan | `GET/PATCH /settings` |
| Import | `POST /import?dryRun=1` (validasi), `POST /import` (commit), `DELETE /import/[batchId]` (batalkan) |
| Export | `GET /export` |
| Statistik | `GET /stats` |

---

## 8. Aturan bisnis & edge case

- **Normalisasi HP**: `libphonenumber-js`, default negara `ID`. `0812…`, `62812…`, `+62 812-…`, dan `812…` semuanya menjadi `+62812…`. Nomor internasional valid tetap diterima. Tidak valid = error baris (import) / error field (form).
- **Zona waktu**: simpan `timestamptz`, tampilkan dan parse selalu dalam `EVENT_TIMEZONE`. Jangan memakai zona browser. Label "WITA" ditampilkan di samping jam.
- **Hitung "dibuka"**: hanya lewat `POST /open` dari client setelah tombol "Buka Undangan" ditekan. **Jangan** menghitung saat SSR, karena crawler preview WhatsApp akan memicunya. Abaikan `?preview=1` dan UA bot yang jelas.
- **RSVP setelah tenggat**: tamu melihat jawabannya (read-only) dengan pesan sopan; admin tetap bisa mengubah.
- **Hapus tamu**: RSVP ikut terhapus (cascade). Sarankan export sebelum hapus massal.
- **Mengubah `max_pax`** di bawah `pax` RSVP yang ada: tolak dengan pesan jelas, atau tawarkan menyesuaikan `pax`.
- **Template hilang/rusak**: selalu jatuh ke default kode. Tulis unit test untuk renderer.
- **Anti-spam**: honeypot field, batas ukuran body, rate limit per IP untuk `/rsvp`, `/register`, `/phone`, dan lookup token (disarankan `@upstash/ratelimit`; alternatif tabel `rate_limits`).
- **Zero-state**: dashboard dan tabel punya empty state yang menjelaskan langkah berikutnya (mis. "Belum ada tamu. Import CSV atau tambah manual.").

---

## 9. Keamanan & privasi (checklist rilis)

- [ ] RLS aktif di semua tabel, tidak ada policy untuk `anon`/`authenticated`
- [ ] Service role key hanya di server (`server-only`), tidak ada di `NEXT_PUBLIC_*`
- [ ] `requireAdmin()` di setiap handler admin + middleware (defense in depth)
- [ ] Trigger `block_non_admin_signup` terpasang
- [ ] Callback OAuth menolak email di luar allowlist dan membersihkan sesi
- [ ] Semua input divalidasi `zod`; output copy dirender sebagai teks (tanpa `dangerouslySetInnerHTML`)
- [ ] CSV export aman dari formula injection
- [ ] Header: `X-Robots-Tag: noindex`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`
- [ ] Dinding ucapan tidak membocorkan HP atau token
- [ ] Token acak 12 karakter, rate limit pada lookup
- [ ] Redirect URL Supabase hanya domain produksi + `localhost:3000`

---

## 10. Environment variables

```
NEXT_PUBLIC_SITE_URL=https://<domain>
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only
EVENT_TIMEZONE=Asia/Makassar
UPSTASH_REDIS_REST_URL=             # opsional (rate limit)
UPSTASH_REDIS_REST_TOKEN=
```
Sediakan `.env.example`. Jangan commit `.env.local`.

---

## 11. Roadmap & task

Kerjakan **berurutan**. Satu fase = satu sesi kerja. Di akhir fase: jalankan `lint`, `typecheck`, `next build`, lalu ringkas apa yang selesai.

### Phase 0 — Fondasi
- [x] Audit project (`package.json`, Tailwind, ESLint, struktur folder); jangan menimpa konfigurasi yang sudah ada tanpa alasan
- [x] Install: `gsap @gsap/react lenis zod nanoid libphonenumber-js papaparse @supabase/supabase-js @supabase/ssr` (+ `vitest`/`tsx`; opsional `@upstash/ratelimit @upstash/redis`)
- [x] `shadcn/ui` hanya untuk area admin
- [x] Token desain, font (`next/font`), struktur folder sesuai §6
- [x] `lib/motion`: registrasi plugin GSAP, provider Lenis tersinkron dengan ScrollTrigger
- [x] `.env.example`, tipe `GuestView`, util `lib/time/tz.ts`
- **DoD:** `next build` hijau, halaman kosong memakai font & token yang benar, Lenis aktif tanpa error konsol.

### Phase 1 — Undangan (design-first, data mock)
- [x] Semua section di `DESIGN.md §7` dengan placeholder aset
- [x] Cover → buka undangan (scroll terkunci sampai dibuka), musik toggle, menu overlay
- [x] Personalisasi lewat mock `GuestView` + `?to=` hanya untuk dev
- [x] Renderer copy + default template (`lib/copy`) dengan unit test
- [x] Form RSVP lengkap (UI + validasi client), state sukses
- **DoD:** lolos *Visual QA rubric* (`DESIGN.md §16`) di 390 / 768 / 1440 px; 60 fps di HP nyata; `prefers-reduced-motion` diuji; Lighthouse mobile ≥ 90 (Performance) dengan placeholder.

### Phase 2 — Database & autentikasi admin
- [ ] Project Supabase, jalankan migrasi + seed
- [ ] Google Cloud OAuth client; redirect URI = `https://<project>.supabase.co/auth/v1/callback`; aktifkan provider Google di Supabase; isi *Site URL* + *Redirect URLs* (localhost + produksi)
- [ ] Klien Supabase (server/browser/admin), `requireAdmin()`, middleware, `/admin/login`, `/auth/callback`, logout
- **DoD:** dua email allowlist bisa masuk; akun Google lain ditolak (diuji manual); `/api/admin/*` tanpa sesi → 401.

### Phase 3 — Dashboard & CRUD
- [ ] Layout admin responsif (dipakai juga dari HP)
- [ ] Pengaturan acara, template copy (CRUD) + seed template
- [ ] Tamu: tabel, filter, drawer, hapus, bulk edit, salin link/pesan, `wa.me`, lihat sebagai tamu
- [ ] RSVP & ucapan: daftar, edit, moderasi
- [ ] Ringkasan statistik
- **DoD:** semua CRUD di §4 berfungsi dengan validasi, empty state, dan konfirmasi hapus.

### Phase 4 — Import / export CSV
- [ ] Parser, alias header, normalisasi HP & tanggal/jam, validator per baris (unit test)
- [ ] UI preview + mode duplikat + laporan error + commit berkelompok + batalkan batch
- [ ] `template.csv`, export sesuai filter, proteksi formula injection
- **DoD:** file uji berisi `;`, BOM, nomor tanpa nol, nama kembar, baris rusak: semua ditangani sesuai §4C.

### Phase 5 — Integrasi sisi tamu
- [ ] `/u/[token]` membaca dari DB (`GuestView` nyata), 404 ramah untuk token salah
- [ ] `POST /open`, `/rsvp`, `/phone`, `/register`, `/wishes`, `/ics`
- [ ] Rate limit + honeypot, copy personal dari template/DB, jam hadir per tamu
- [ ] Stretch: OG image personal ("Undangan untuk {nama}")
- **DoD:** alur penuh diuji: import CSV → salin link → buka → RSVP → data muncul di dashboard → ubah jam hadir di admin → undangan tamu berubah.

### Phase 6 — Polish & rilis
- [ ] QA motion (ScrollTrigger refresh, resize, orientasi, address-bar mobile), a11y pass, perf pass (§13 DESIGN.md)
- [ ] Review keamanan (§9), uji Safari iOS + Chrome Android nyata
- [ ] Ganti placeholder dengan aset asli, tulis ulang copy final
- [ ] Deploy (mis. Vercel), set env + redirect URL produksi, uji login produksi
- [ ] Export cadangan data sebelum hari-H
- **DoD:** semua checklist §9 tercentang; skor QA rata-rata ≥ 4 dan tidak ada nilai < 3.

---

## 12. Asumsi & pertanyaan terbuka

Asumsi berikut dipakai sampai dikoreksi:

1. Hanya **satu acara: resepsi** (tanpa akad). Tanggal, jam, dan lokasi disimpan di pengaturan.
2. "Jam hadir per tamu" = **jam kedatangan yang diminta** untuk tamu itu (bisa berupa rentang). Ini menimpa tampilan jam, bukan jam acara resmi.
3. Pengiriman undangan lewat WA dilakukan manual dengan tombol `wa.me`, bukan otomatis.
4. Hosting di Vercel, domain sendiri.
5. Hanya Bahasa Indonesia.
6. Tidak ada mode gelap.

Pertanyaan yang perlu dijawab sebelum Phase 5: apakah perlu **tenggat RSVP**? apakah **registrasi umum** (tanpa token) diaktifkan atau hanya tamu ber-link?

---

## 13. Backlog (setelah v1)

- Check-in di lokasi (QR per tamu + mode scan di HP admin)
- Blast WA via provider resmi
- Draft ucapan personal dengan AI (admin klik "buat draft", wajib dikurasi manual)
- Lightbox galeri dengan transisi Flip
- Upload aset via Supabase Storage dari dashboard
- Buku tamu fisik: cetak daftar hadir dari export