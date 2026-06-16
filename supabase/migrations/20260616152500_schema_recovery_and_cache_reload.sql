-- Recovery migration for fresh projects whose migration history is present
-- but whose PostgREST schema cache and/or base tables are not usable yet.

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'room_status'
  ) then
    create type room_status as enum ('lobby','live','finished');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'room_status' and e.enumlabel = 'paused'
  ) then
    alter type room_status add value 'paused';
  end if;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'room_player_role'
  ) then
    create type room_player_role as enum ('player','watcher');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'tx_kind'
  ) then
    create type tx_kind as enum ('stake','payout','refund','seed');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'tx_kind' and e.enumlabel = 'deposit'
  ) then
    alter type tx_kind add value 'deposit';
  end if;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'tx_kind' and e.enumlabel = 'withdrawal'
  ) then
    alter type tx_kind add value 'withdrawal';
  end if;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'tx_kind' and e.enumlabel = 'transfer_to_play'
  ) then
    alter type tx_kind add value 'transfer_to_play';
  end if;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'wallet_request_kind'
  ) then
    create type wallet_request_kind as enum ('deposit','withdrawal');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'wallet_request_status'
  ) then
    create type wallet_request_status as enum ('pending','approved','rejected');
  end if;
end
$$;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  telegram_id text unique not null,
  username text not null,
  wallet_balance int not null default 1000,
  main_wallet_balance int not null default 1000,
  play_wallet_balance int not null default 1000,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.players
  add column if not exists wallet_balance int not null default 1000,
  add column if not exists main_wallet_balance int not null default 1000,
  add column if not exists play_wallet_balance int not null default 1000,
  add column if not exists is_admin boolean not null default false;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  game_id text,
  is_private boolean not null default false,
  room_name text,
  max_players int not null default 100,
  room_password text,
  closed_by_admin boolean not null default false,
  host_id uuid not null references public.players(id) on delete cascade,
  status room_status not null default 'lobby',
  stake_amount int not null default 20,
  house_commission_pct int not null default 20,
  derash int not null default 0,
  call_interval_ms int not null default 4000,
  lobby_seconds int not null default 30,
  lobby_ends_at timestamptz,
  current_index int not null default -1,
  call_sequence int[] not null default '{}',
  winner_id uuid references public.players(id),
  winning_line text,
  pending_winner_id uuid references public.players(id),
  pending_winning_line text,
  pending_payout int,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

alter table public.rooms
  add column if not exists game_id text,
  add column if not exists is_private boolean not null default false,
  add column if not exists room_name text,
  add column if not exists max_players int not null default 100,
  add column if not exists room_password text,
  add column if not exists closed_by_admin boolean not null default false,
  add column if not exists stake_amount int not null default 20,
  add column if not exists house_commission_pct int not null default 20,
  add column if not exists derash int not null default 0,
  add column if not exists call_interval_ms int not null default 4000,
  add column if not exists lobby_seconds int not null default 30,
  add column if not exists lobby_ends_at timestamptz,
  add column if not exists current_index int not null default -1,
  add column if not exists call_sequence int[] not null default '{}',
  add column if not exists winner_id uuid references public.players(id),
  add column if not exists winning_line text,
  add column if not exists pending_winner_id uuid references public.players(id),
  add column if not exists pending_winning_line text,
  add column if not exists pending_payout int,
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz;

create unique index if not exists rooms_game_id_unique on public.rooms(game_id) where game_id is not null;

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  role room_player_role not null default 'player',
  stake_paid boolean not null default false,
  selected_cartelas int[] not null default '{}',
  auto_fill boolean not null default true,
  false_claims int not null default 0,
  card int[] not null default '{}',
  marked int[] not null default '{0}',
  joined_at timestamptz not null default now(),
  unique(room_id, player_id)
);

alter table public.room_players
  add column if not exists role room_player_role not null default 'player',
  add column if not exists stake_paid boolean not null default false,
  add column if not exists selected_cartelas int[] not null default '{}',
  add column if not exists auto_fill boolean not null default true,
  add column if not exists false_claims int not null default 0,
  add column if not exists card int[] not null default '{}',
  add column if not exists marked int[] not null default '{0}';

create table if not exists public.transactions (
  id bigserial primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  kind tx_kind not null,
  amount int not null,
  balance_after int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigserial primary key,
  room_id uuid references public.rooms(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_requests (
  id bigserial primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  kind wallet_request_kind not null,
  amount int not null check (amount > 0),
  status wallet_request_status not null default 'pending',
  note text,
  processed_by uuid references public.players(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.transactions enable row level security;
alter table public.audit_log enable row level security;
alter table public.wallet_requests enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'players' and policyname = 'players readable') then
    create policy "players readable" on public.players for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'rooms' and policyname = 'rooms readable') then
    create policy "rooms readable" on public.rooms for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'room_players' and policyname = 'room_players readable') then
    create policy "room_players readable" on public.room_players for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'transactions' and policyname = 'tx readable') then
    create policy "tx readable" on public.transactions for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'audit_log' and policyname = 'audit readable') then
    create policy "audit readable" on public.audit_log for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wallet_requests' and policyname = 'wallet requests readable') then
    create policy "wallet requests readable" on public.wallet_requests for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wallet_requests' and policyname = 'wallet requests insertable') then
    create policy "wallet requests insertable" on public.wallet_requests for insert with check (true);
  end if;
end $$;

do $$
begin
  begin
    alter publication supabase_realtime add table public.players;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.rooms;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.room_players;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.wallet_requests;
  exception when duplicate_object then null;
  end;
end
$$;

alter table public.players replica identity full;
alter table public.rooms replica identity full;
alter table public.room_players replica identity full;
alter table public.wallet_requests replica identity full;

notify pgrst, 'reload schema';
