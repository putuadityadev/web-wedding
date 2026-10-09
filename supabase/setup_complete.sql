-- ==============================================================================
-- SETUP DATABASE LENGKAP: UNDANGAN PERNIKAHAN DHARMA & LUTFHY
-- Salin dan jalankan seluruh script ini di menu SQL Editor pada Supabase Dashboard.
-- ==============================================================================

-- 1. EXTENSIONS & HELPER FUNCTIONS
create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger
language plpgsql as $$ 
begin 
  new.updated_at = now(); 
  return new; 
end $$;

-- 2. ENUM TYPES
do $$ begin
  create type rsvp_status as enum ('attending', 'not_attending');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type guest_source as enum ('csv', 'manual', 'self_added');
exception
  when duplicate_object then null;
end $$;

-- 3. ALLOWLIST ADMIN TABLE
create table if not exists admin_emails (
  email text primary key check (email = lower(email))
);

-- Seed allowlist email resmi
insert into admin_emails (email) values
  ('adityamph1@gmail.com'),
  ('arisiki123@gmail.com')
on conflict (email) do nothing;

-- 4. PENGATURAN GLOBAL (SETTINGS)
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  groom_name text not null default 'Dharma',
  bride_name text not null default 'Lutfhy',
  rsvp_deadline timestamptz default '2026-11-28T23:59:59+08:00',
  event_starts_at timestamptz default '2026-12-12T11:00:00+08:00',
  event_ends_at timestamptz default '2026-12-12T14:00:00+08:00',
  venue_name text default 'Kediaman Mempelai Pria (Kayubihi, Bangli)',
  venue_address text default 'Banjar Kawan, Desa Kayubihi, Kec. Bangli, Kabupaten Bangli, Bali 80614',
  maps_url text default 'https://www.google.com/maps/search/?api=1&query=-8.3981403,115.3643337',
  allow_public_registration boolean not null default false,
  wa_message_template text not null default
    'Halo {{sapaan}} {{panggilan}}, dengan bahagia kami mengundang Anda ke pernikahan {{mempelai}}. Detail dan konfirmasi kehadiran ada di sini: {{link}}',
  bank_accounts jsonb not null default '[
    {"bank": "BCA", "account_name": "I Wayan Dharma Wirahadi", "account_number": "7820192831"},
    {"bank": "Bank Mandiri", "account_name": "Luthfi Quasimah Widoyo", "account_number": "1420019283741"}
  ]'::jsonb,
  music_url text default 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=piano-moment-9835.mp3',
  updated_at timestamptz not null default now()
);

insert into settings (id) values (1) on conflict (id) do nothing;

-- 5. BATCH IMPORT & TAMU (GUESTS)
create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  filename text,
  row_count int not null default 0,
  created_count int not null default 0,
  updated_count int not null default 0,
  skipped_count int not null default 0,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  nickname text,
  salutation text,
  phone text,
  group_label text,
  tone text not null default 'warm' check (tone in ('formal','warm','casual')),
  max_pax int not null default 2 check (max_pax between 1 and 20),
  arrival_at timestamptz,
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

create unique index if not exists guests_phone_uniq on guests (phone) where phone is not null;
create index if not exists guests_name_idx  on guests (lower(name));
create index if not exists guests_group_idx on guests (group_label);

-- 6. RSVP & DO'A
create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references guests(id) on delete cascade,
  status rsvp_status not null,
  pax int not null default 1 check (pax between 0 and 20),
  wish text check (char_length(wish) <= 500),
  wish_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rsvps_created_idx on rsvps (created_at desc);

-- 7. COPY TEMPLATES
create table if not exists copy_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  tone text not null default 'any' check (tone in ('any','formal','warm','casual')),
  body text not null check (char_length(body) <= 800),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (key, tone)
);

-- 8. CMS SITE CONTENT (100% FLEKSIBEL COVER S/D FOOTER)
create table if not exists site_content (
  section_key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- 9. TRIGGERS UPDATED_AT
drop trigger if exists trg_settings_u on settings;
create trigger trg_settings_u before update on settings for each row execute function set_updated_at();

drop trigger if exists trg_guests_u on guests;
create trigger trg_guests_u before update on guests for each row execute function set_updated_at();

drop trigger if exists trg_rsvps_u on rsvps;
create trigger trg_rsvps_u before update on rsvps for each row execute function set_updated_at();

drop trigger if exists trg_templates_u on copy_templates;
create trigger trg_templates_u before update on copy_templates for each row execute function set_updated_at();

drop trigger if exists trg_site_content_u on site_content;
create trigger trg_site_content_u before update on site_content for each row execute function set_updated_at();

-- 10. ROW LEVEL SECURITY (RLS)
alter table admin_emails   enable row level security;
alter table settings       enable row level security;
alter table import_batches enable row level security;
alter table guests         enable row level security;
alter table rsvps          enable row level security;
alter table copy_templates enable row level security;
alter table site_content   enable row level security;

-- 11. SEED DEFAULT KONTEN CMS
insert into site_content (section_key, data) values
('cover', '{
  "badge": "THE WEDDING CELEBRATION OF",
  "groomName": "Dharma",
  "brideName": "Lutfhy",
  "dateDisplay": "Sabtu, 12 Desember 2026",
  "guestGreetingLabel": "KEPADA YTH. BAPAK/IBU/SAUDARA/I:",
  "openButtonLabel": "BUKA UNDANGAN",
  "tapHintLabel": "Ketuk layar untuk membuka"
}'::jsonb),

('hero', '{
  "badge": "THE WEDDING OF",
  "groomName": "Dharma",
  "brideName": "Lutfhy",
  "dateShort": "12 · 12 · 2026",
  "portraitSrc": "/KLK07943.avif",
  "portraitAlt": "Potret I Wayan Dharma Wirahadi & Luthfi Quasimah Widoyo",
  "portraitLabel": "POTRET MEMPELAI",
  "scrollHint": "GULIR PERLAHAN"
}'::jsonb),

('quote', '{
  "label": "KUTIPAN SUCI",
  "text": "Pertemuan dua jiwa bukanlah suatu kebetulan, melainkan perjalanan panjang yang telah digariskan semesta untuk saling melengkapi dan bertumbuh bersama.",
  "citation": "Harmoni Dua Hati"
}'::jsonb),

('couple', '{
  "sectionLabel": "TENTANG MEMPELAI",
  "sectionTitle": "Dua Jiwa, Satu Cerita",
  "sectionDesc": "Dengan penuh rasa syukur dan hormat, kami memohon doa restu keluarga dan sahabat.",
  "groom": {
    "name": "I Wayan Dharma Wirahadi",
    "childOf": "Putra pertama dari Bapak I Wayan Suweta & Ibu Ni Wayan Murni",
    "bio": "Praktisi tata suara dan profesional penyiaran di TVRI Stasiun Bali. Menemukan keindahan dalam harmoni nada, deburan ombak Bali, dan perjalanan yang penuh makna.",
    "photoSrc": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80",
    "photoAlt": "I Wayan Dharma Wirahadi",
    "photoLabel": "POTRET DHARMA",
    "instagram": "dharmawirahadi"
  },
  "bride": {
    "name": "Luthfi Quasimah Widoyo",
    "childOf": "Putri tercinta dari Bapak Widoyo & Ibu Sri Mulyani",
    "bio": "Produser program televisi di TVRI Bali (Eksplorasi Nusantara). Merajut visual, narasi keindahan budaya nusantara, dan kehangatan cerita dalam setiap bingkai karya.",
    "photoSrc": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
    "photoAlt": "Luthfi Quasimah Widoyo",
    "photoLabel": "POTRET LUTFHY",
    "instagram": "lutfhyquasimah"
  }
}'::jsonb),

('story', '{
  "sectionLabel": "PERJALANAN KAMI",
  "sectionTitle": "Kisah yang Kami Rajut",
  "moments": [
    {
      "numeral": "01",
      "title": "Awal Pertemuan",
      "date": "Oktober 2021",
      "desc": "Di antara dinamika studio produksi visual dan penyiaran TVRI Bali, dua langkah dipertemukan oleh kecintaan yang sama pada cerita, nada, dan dedikasi karya.",
      "photoSrc": "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80",
      "photoAlt": "Pertemuan Pertama",
      "label": "MOMEN 01 · 2021"
    },
    {
      "numeral": "02",
      "title": "Dua Garis Menemukan Irama",
      "date": "Mei 2023",
      "desc": "Merajut program eksplorasi nusantara bersama, belajar bahwa harmoni bukan sekadar keselarasan frekuensi di balik layar, melainkan kesediaan hati untuk saling mendengar dan berjalan beriringan.",
      "photoSrc": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
      "photoAlt": "Perjalanan Bersama",
      "label": "MOMEN 02 · 2023"
    },
    {
      "numeral": "03",
      "title": "Menuju Hari Ini",
      "date": "Juli 2026",
      "desc": "Di bawah bentangan langit Bali dan deburan ombak yang tenang, terucap janji suci untuk menyatukan dua benang kehidupan menjadi ikatan yang abadi.",
      "photoSrc": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      "photoAlt": "Janji Suci",
      "label": "MOMEN 03 · 2026"
    }
  ]
}'::jsonb),

('event', '{
  "sectionLabel": "WAKTU & LOKASI",
  "sectionTitle": "Resepsi Pernikahan",
  "dayFormatted": "SABTU",
  "dateNumeral": "12",
  "monthYearFormatted": "DESEMBER 2026",
  "dateFormatted": "Sabtu, 12 Desember 2026",
  "timeFormatted": "11.00 – 14.00 WITA",
  "startsAt": "2026-12-12T11:00:00+08:00",
  "endsAt": "2026-12-12T14:00:00+08:00",
  "venueName": "Kediaman Mempelai Pria (Kayubihi, Bangli)",
  "venueAddress": "Banjar Kawan, Desa Kayubihi, Kec. Bangli, Kabupaten Bangli, Bali 80614",
  "mapsUrl": "https://www.google.com/maps/search/?api=1&query=-8.3981403,115.3643337",
  "lat": -8.3981403,
  "lng": 115.3643337,
  "countdownLabel": "MENGHITUNG HARI"
}'::jsonb),

('gallery', '{
  "sectionLabel": "GALERI KENANGAN",
  "sectionTitle": "Momen Terindah",
  "sectionDesc": "Kumpulan potret kasih dan tawa di setiap langkah.",
  "items": [
    {
      "id": 1,
      "label": "01 / 08",
      "type": "portrait",
      "title": "Senja di Pesisir",
      "aspectRatio": "3/4",
      "src": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80"
    },
    {
      "id": 2,
      "label": "02 / 08",
      "type": "landscape",
      "title": "Langkah Sepadan",
      "aspectRatio": "16/10",
      "src": "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1400&q=80"
    },
    {
      "id": 3,
      "label": "03 / 08",
      "type": "portrait",
      "title": "Genggaman Tenang",
      "aspectRatio": "4/5",
      "src": "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80"
    },
    {
      "id": 4,
      "label": "04 / 08",
      "type": "landscape",
      "title": "Di Balik Jendela Kaca",
      "aspectRatio": "3/2",
      "src": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=80"
    },
    {
      "id": 5,
      "label": "05 / 08",
      "type": "portrait",
      "title": "Detik Sebelum Hari-H",
      "aspectRatio": "3/4",
      "src": "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80"
    },
    {
      "id": 6,
      "label": "06 / 08",
      "type": "portrait",
      "title": "Tawa yang Utuh",
      "aspectRatio": "4/5",
      "src": "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80"
    },
    {
      "id": 7,
      "label": "07 / 08",
      "type": "landscape",
      "title": "Dua Cangkir Kopi",
      "aspectRatio": "16/10",
      "src": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=80"
    },
    {
      "id": 8,
      "label": "08 / 08",
      "type": "portrait",
      "title": "Tatapan Penuh Syukur",
      "aspectRatio": "4/5",
      "src": "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80"
    }
  ]
}'::jsonb),

('gift', '{
  "sectionLabel": "TANDA KASIH",
  "sectionTitle": "Doa Restu & Amplop Digital",
  "sectionDesc": "Doa restu Anda merupakan karunia terindah bagi kami. Bagi keluarga dan sahabat yang ingin memberikan tanda kasih secara digital, dapat melalui rekening berikut:",
  "accounts": [
    {
      "bank": "BCA",
      "accountName": "I Wayan Dharma Wirahadi",
      "accountNumber": "7820192831"
    },
    {
      "bank": "Bank Mandiri",
      "accountName": "Luthfi Quasimah Widoyo",
      "accountNumber": "1420019283741"
    }
  ]
}'::jsonb),

('footer', '{
  "closingLine": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
  "familyHeading": "Kami Yang Berbahagia",
  "familySubheading": "Beserta Keluarga Besar Kedua Mempelai",
  "groomName": "Dharma",
  "brideName": "Lutfhy",
  "copyright": "© 2026 Dharma & Lutfhy. All Rights Reserved.",
  "backToTopText": "KEMBALI KE ATAS",
  "colophonPrefix": "THE WEDDING OF"
}'::jsonb),

('audio', '{
  "musicUrl": "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=piano-moment-9835.mp3",
  "title": "Adagio in Blue — Instrumental"
}'::jsonb),

('branding', '{
  "siteTitle": "The Wedding of Dharma & Luthfi",
  "siteDescription": "Undangan pernikahan digital I Wayan Dharma Wirahadi & Luthfi Quasimah Widoyo.",
  "ogImage": "/apple-icon.png",
  "ogImageAlt": "Pernikahan Dharma & Lutfhy",
  "whatsappShareText": "Halo {nama_tamu}, dengan sukacita dan penuh syukur kami mengundang Anda ke pernikahan Dharma & Lutfhy.\\n\\nDetail acara, denah lokasi, dan konfirmasi kehadiran dapat diakses melalui tautan personal Anda:\\n{link_undangan}\\n\\nSalam hangat,\\nDharma & Lutfhy"
}'::jsonb)
on conflict (section_key) do update set
  data = excluded.data,
  updated_at = now();

-- 12. SUPABASE STORAGE BUCKET: wedding-assets
insert into storage.buckets (id, name, public)
values ('wedding-assets', 'wedding-assets', true)
on conflict (id) do nothing;
