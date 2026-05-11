-- The Square — City Wall schema
-- Esegui questo file nel SQL editor di Supabase.

create extension if not exists pgcrypto;

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  region text,
  province text,
  country text not null default 'Italia',
  type text not null default 'city' check (type in ('city','municipality','district','province','area')),
  status text not null default 'approved' check (status in ('pending','approved','rejected','merged','archived')),
  is_public boolean not null default true,
  is_official boolean not null default false,
  population_rank integer,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.city_requests (
  id uuid primary key default gen_random_uuid(),
  requested_name text not null,
  requested_slug text not null,
  region text,
  province text,
  country text not null default 'Italia',
  type text not null default 'city' check (type in ('city','municipality','district','province','area')),
  reason text,
  requested_by uuid references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected','merged','archived')),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.city_roles (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('starter','moderator','admin')),
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(city_id, user_id, role)
);

create table if not exists public.wall_posts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  target_type text not null default 'city_wall' check (target_type in ('city_wall','personal_square')),
  target_id uuid,
  post_type text not null default 'text' check (post_type in ('text','image','audio','mixed','news','event')),
  title text,
  content text,
  image_url text,
  image_path text,
  audio_url text,
  audio_path text,
  audio_duration integer,
  visibility text not null default 'public' check (visibility in ('public','followers','private')),
  is_anonymous boolean not null default false,
  status text not null default 'published' check (status in ('published','hidden','removed','pending_review')),
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wall_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.wall_posts(id) on delete cascade,
  reported_by uuid references auth.users(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewed','dismissed','actioned')),
  created_at timestamptz not null default now()
);

create index if not exists cities_slug_idx on public.cities(slug);
create index if not exists wall_posts_city_created_idx on public.wall_posts(city_id, created_at desc);
create index if not exists wall_posts_user_created_idx on public.wall_posts(user_id, created_at desc);
create index if not exists city_requests_status_idx on public.city_requests(status, created_at desc);

alter table public.cities enable row level security;
alter table public.city_requests enable row level security;
alter table public.city_roles enable row level security;
alter table public.wall_posts enable row level security;
alter table public.wall_post_reports enable row level security;

-- Lettura pubblica delle città approvate.
drop policy if exists "Public can read approved cities" on public.cities;
create policy "Public can read approved cities" on public.cities
for select using (status = 'approved' and is_public = true);

-- Gli utenti autenticati possono richiedere nuove città.
drop policy if exists "Authenticated users can create city requests" on public.city_requests;
create policy "Authenticated users can create city requests" on public.city_requests
for insert to authenticated with check (auth.uid() = requested_by);

drop policy if exists "Users can read own city requests" on public.city_requests;
create policy "Users can read own city requests" on public.city_requests
for select to authenticated using (auth.uid() = requested_by);

-- Lettura pubblica dei post pubblicati.
drop policy if exists "Public can read published wall posts" on public.wall_posts;
create policy "Public can read published wall posts" on public.wall_posts
for select using (status = 'published' and visibility = 'public');

-- Gli utenti autenticati possono pubblicare i propri post.
drop policy if exists "Authenticated users can create own wall posts" on public.wall_posts;
create policy "Authenticated users can create own wall posts" on public.wall_posts
for insert to authenticated with check (auth.uid() = user_id);

-- Gli utenti autenticati possono modificare solo i propri post finché non sono rimossi.
drop policy if exists "Users can update own wall posts" on public.wall_posts;
create policy "Users can update own wall posts" on public.wall_posts
for update to authenticated using (auth.uid() = user_id and status <> 'removed') with check (auth.uid() = user_id);

-- Gli utenti autenticati possono segnalare post.
drop policy if exists "Authenticated users can report posts" on public.wall_post_reports;
create policy "Authenticated users can report posts" on public.wall_post_reports
for insert to authenticated with check (auth.uid() = reported_by);
