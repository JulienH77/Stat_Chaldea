-- Chaldea Command — minimal collaborative database
-- Run this in Supabase > SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.chaldea_players (
  id text primary key,
  display_name text not null,
  region text not null default 'NA',
  friend_code text default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.chaldea_stats (
  player_id text not null references public.chaldea_players(id) on delete cascade,
  servant_id integer not null,
  level integer,
  np integer,
  bond integer,
  grail integer,
  fou_hp integer,
  fou_atk integer,
  servant_coins integer,
  skills jsonb not null default '[null,null,null]'::jsonb,
  append_skills jsonb not null default '[null,null,null,null,null]'::jsonb,
  note text default '',
  updated_at timestamptz not null default now(),
  primary key (player_id, servant_id)
);

alter table public.chaldea_players enable row level security;
alter table public.chaldea_stats enable row level security;

-- This first version intentionally keeps the shared workspace simple for a private group.
-- Replace these policies with authenticated-user policies if the project becomes public.
create policy "workspace players read" on public.chaldea_players for select using (true);
create policy "workspace players write" on public.chaldea_players for insert with check (true);
create policy "workspace players update" on public.chaldea_players for update using (true) with check (true);
create policy "workspace stats read" on public.chaldea_stats for select using (true);
create policy "workspace stats write" on public.chaldea_stats for insert with check (true);
create policy "workspace stats update" on public.chaldea_stats for update using (true) with check (true);

insert into public.chaldea_players (id, display_name)
values ('julien','Julien'),('yanis','Yanis'),('attmann','Attmann')
on conflict (id) do nothing;
