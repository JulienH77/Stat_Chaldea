-- Chaldea Command V3 — Supabase
-- 1) Auth > Users : crée exactement vos 3 comptes email/password.
-- 2) Exécute ce script.
-- 3) Dans chaldea_members, associe chaque auth_user_id à julien / yanis / attmann.

create table if not exists public.chaldea_members (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  player_key text not null unique check (player_key in ('julien','yanis','attmann')),
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chaldea_stats (
  player_key text not null references public.chaldea_members(player_key) on delete cascade,
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
  updated_at timestamptz not null default now(),
  primary key (player_key, servant_id)
);

alter table public.chaldea_members enable row level security;
alter table public.chaldea_stats enable row level security;

drop policy if exists "members_read_authenticated" on public.chaldea_members;
create policy "members_read_authenticated" on public.chaldea_members
for select to authenticated using (true);

drop policy if exists "stats_read_authenticated" on public.chaldea_stats;
create policy "stats_read_authenticated" on public.chaldea_stats
for select to authenticated using (true);

drop policy if exists "stats_insert_own_player" on public.chaldea_stats;
create policy "stats_insert_own_player" on public.chaldea_stats
for insert to authenticated with check (
  player_key = (select m.player_key from public.chaldea_members m where m.auth_user_id = auth.uid())
);

drop policy if exists "stats_update_own_player" on public.chaldea_stats;
create policy "stats_update_own_player" on public.chaldea_stats
for update to authenticated using (
  player_key = (select m.player_key from public.chaldea_members m where m.auth_user_id = auth.uid())
) with check (
  player_key = (select m.player_key from public.chaldea_members m where m.auth_user_id = auth.uid())
);

drop policy if exists "stats_delete_own_player" on public.chaldea_stats;
create policy "stats_delete_own_player" on public.chaldea_stats
for delete to authenticated using (
  player_key = (select m.player_key from public.chaldea_members m where m.auth_user_id = auth.uid())
);
