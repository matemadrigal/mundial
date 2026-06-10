-- ============================================================
-- LA PORRA MUNDIAL · Esquema de base de datos (Supabase)
-- Pega este archivo entero en: Supabase -> SQL Editor -> Run
-- ============================================================

-- Usuarios (login por contraseña única; passwords normalizadas:
-- minúsculas, sin tildes, sin espacios)
create table if not exists users (
  id serial primary key,
  name text not null,
  password text not null unique,
  emoji text not null default '⚽',
  is_admin boolean not null default false
);

-- Partidos (la fuente de verdad es API-Football; manual_override
-- protege correcciones del admin frente al sync)
create table if not exists matches (
  id bigint primary key,              -- fixture id de API-Football
  stage text,                         -- 'Group A', 'Round of 16'...
  kickoff timestamptz not null,
  stadium text,
  city text,
  home_team text not null,
  away_team text not null,
  home_logo text,
  away_logo text,
  status text not null default 'NS',  -- NS / LIVE / HT / FT / AET / PEN...
  home_goals int,
  away_goals int,
  penalty_winner text,                -- 'home' | 'away' | null
  total_corners int,
  home_cards int,
  away_cards int,
  stats_ready boolean not null default false,
  manual_override boolean not null default false
);
create index if not exists idx_matches_kickoff on matches (kickoff);

-- Predicciones por partido (editables hasta el kickoff)
create table if not exists predictions (
  id serial primary key,
  user_id int not null references users(id),
  match_id bigint not null references matches(id),
  home_goals int not null,
  away_goals int not null,
  corners int,
  more_cards text,                    -- 'home' | 'away' | 'draw'
  points int not null default 0,
  scored boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

-- Predicciones globales (se cierran con el partido inaugural)
create table if not exists global_predictions (
  user_id int primary key references users(id),
  champion text,
  top_scorer text,
  points int not null default 0,
  updated_at timestamptz not null default now()
);

-- Ajustes internos (last_sync, lock, ratelimit, etc.)
create table if not exists settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

-- RLS desactivado a propósito: la app solo accede desde el servidor
-- con la service key; el navegador nunca toca Supabase directamente.

-- ============================================================
-- Los 4 jugadores de la porra (contraseñas ya normalizadas)
-- ============================================================
insert into users (name, password, emoji, is_admin) values
  ('Carlos',  'anonimo4',  '🦁', false),
  ('Vigne',   'anonimo7',  '🦅', false),
  ('Morguis', 'anonimo10', '🐺', false),
  ('Mateo',   'anonimo1',  '👑', true)
on conflict (password) do nothing;
