-- Add paused state and pending bingo verification fields

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'room_status' and e.enumlabel = 'paused'
  ) then
    alter type room_status add value 'paused';
  end if;
end
$$;

alter table public.rooms
  add column if not exists pending_winner_id uuid references public.players(id),
  add column if not exists pending_winning_line text,
  add column if not exists pending_payout int;
