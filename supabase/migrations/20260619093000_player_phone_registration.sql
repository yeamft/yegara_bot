alter table public.players
  add column if not exists phone_number text;

create unique index if not exists players_phone_number_key
  on public.players (phone_number)
  where phone_number is not null;