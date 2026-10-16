-- Rode no Supabase: SQL Editor > New query > Run
create table if not exists public.cifras_items(
 user_id uuid not null references auth.users(id) on delete cascade,
 id text not null, kind text not null, data jsonb not null default '{}',
 updated bigint not null default 0, deleted boolean not null default false,
 primary key(user_id,id));
alter table public.cifras_items enable row level security;
drop policy if exists own_select on public.cifras_items;
drop policy if exists own_insert on public.cifras_items;
drop policy if exists own_update on public.cifras_items;
drop policy if exists own_delete on public.cifras_items;
create policy own_select on public.cifras_items for select using (auth.uid()=user_id);
create policy own_insert on public.cifras_items for insert with check (auth.uid()=user_id);
create policy own_update on public.cifras_items for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy own_delete on public.cifras_items for delete using (auth.uid()=user_id);

-- Excluir a própria conta (botão "Excluir conta")
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path=public,auth as $$
begin delete from auth.users where id=auth.uid(); end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Links de compartilhamento (somente leitura, por link)
create table if not exists public.cifras_shares(
 id text primary key default substr(replace(gen_random_uuid()::text,'-',''),1,12),
 owner uuid not null references auth.users(id) on delete cascade,
 kind text not null, data jsonb not null, created timestamptz not null default now());
alter table public.cifras_shares enable row level security;
drop policy if exists sh_select on public.cifras_shares;
drop policy if exists sh_insert on public.cifras_shares;
drop policy if exists sh_delete on public.cifras_shares;
create policy sh_select on public.cifras_shares for select using (auth.uid()=owner);
create policy sh_insert on public.cifras_shares for insert with check (auth.uid()=owner);
create policy sh_delete on public.cifras_shares for delete using (auth.uid()=owner);
create or replace function public.get_share(p_id text) returns jsonb
language sql stable security definer set search_path=public as $$
 select data from public.cifras_shares where id=p_id $$;
grant execute on function public.get_share(text) to anon, authenticated;
