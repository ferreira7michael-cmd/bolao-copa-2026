create extension if not exists "pgcrypto";

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  name text not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  round text not null,
  kickoff_at timestamptz not null,
  stadium text,
  home_team text not null,
  away_team text not null,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled' check (status in ('scheduled', 'finished')),
  check (home_score is null or home_score >= 0),
  check (away_score is null or away_score >= 0)
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0 and home_score <= 20),
  away_score integer not null check (away_score >= 0 and away_score <= 20),
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, match_id)
);

create index if not exists matches_kickoff_at_idx on public.matches(kickoff_at);
create index if not exists predictions_participant_id_idx on public.predictions(participant_id);
create index if not exists predictions_match_id_idx on public.predictions(match_id);

alter table public.participants enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

-- The app uses SUPABASE_SERVICE_ROLE_KEY only inside Vercel server routes.
-- Keep public anon access blocked by not creating permissive RLS policies.

insert into public.matches (round, kickoff_at, stadium, home_team, away_team)
values
  ('Grupo A', '2026-06-11 16:00:00-06', 'Estadio Azteca', 'Mexico', 'A2'),
  ('Grupo A', '2026-06-11 19:00:00-06', 'Estadio Guadalajara', 'A3', 'A4'),
  ('Grupo B', '2026-06-12 16:00:00-07', 'SoFi Stadium', 'B1', 'B2'),
  ('Grupo B', '2026-06-12 19:00:00-07', 'Levi''s Stadium', 'B3', 'B4'),
  ('Grupo C', '2026-06-13 15:00:00-04', 'Gillette Stadium', 'C1', 'C2'),
  ('Grupo C', '2026-06-13 18:00:00-04', 'MetLife Stadium', 'C3', 'C4'),
  ('Grupo D', '2026-06-14 15:00:00-05', 'AT&T Stadium', 'D1', 'D2'),
  ('Grupo D', '2026-06-14 18:00:00-05', 'NRG Stadium', 'D3', 'D4')
on conflict do nothing;
