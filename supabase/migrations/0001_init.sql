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
  groom_name text not null default 'Aditya Pratama',
  bride_name text not null default 'Clarissa Maharani',
  rsvp_deadline timestamptz,
  event_starts_at timestamptz,                 -- resepsi
  event_ends_at timestamptz,
  venue_name text default 'The Glasshouse Ballroom',
  venue_address text default 'Jl. Metro Tanjung Bunga No. 88, Makassar',
  maps_url text default 'https://maps.google.com/?q=The+Glasshouse+Makassar',
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

-- Hardening: hanya email allowlist yang boleh membuat akun auth
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
