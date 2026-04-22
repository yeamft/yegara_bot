-- Phase upgrades: room metadata + cartela/mode fields

alter table public.rooms
  add column if not exists game_id text,
  add column if not exists is_private boolean not null default false;

create unique index if not exists rooms_game_id_unique on public.rooms(game_id) where game_id is not null;

alter table public.room_players
  add column if not exists selected_cartelas int[] not null default '{}',
  add column if not exists auto_fill boolean not null default true,
  add column if not exists false_claims int not null default 0;
