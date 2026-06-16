-- Ensure Supabase API roles can see public schema relations and reload PostgREST.

grant usage on schema public to anon, authenticated, service_role;

grant select on public.players to anon, authenticated, service_role;
grant select on public.rooms to anon, authenticated, service_role;
grant select on public.room_players to anon, authenticated, service_role;
grant select on public.transactions to anon, authenticated, service_role;
grant select on public.audit_log to anon, authenticated, service_role;
grant select, insert, update on public.wallet_requests to anon, authenticated, service_role;

grant insert, update on public.players to service_role;
grant insert, update, delete on public.rooms to service_role;
grant insert, update, delete on public.room_players to service_role;
grant insert on public.transactions to service_role;
grant insert on public.audit_log to service_role;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant usage on all sequences in schema public to service_role;

notify pgrst, 'reload schema';
