-- Adonis Pro cloud sync.
-- entitlements: who is Pro. Written only by the revenuecat-webhook Edge Function (service role).
-- sync_records: one row per synced record (a workout day, the routines list, …), readable and
-- writable only by its owner and only while they are Pro.

create table if not exists public.entitlements (
	user_id uuid primary key references auth.users (id) on delete cascade,
	is_pro boolean not null default false,
	expires_at timestamptz,
	source text,
	updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "read own entitlement" on public.entitlements;
create policy "read own entitlement" on public.entitlements
	for select to authenticated
	using (auth.uid() = user_id);
-- No insert/update/delete policies: clients can never grant themselves Pro.

create or replace function public.is_pro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(
		(
			select e.is_pro and (e.expires_at is null or e.expires_at > now())
			from public.entitlements e
			where e.user_id = auth.uid()
		),
		false
	);
$$;

revoke all on function public.is_pro() from public;
grant execute on function public.is_pro() to authenticated;

create table if not exists public.sync_records (
	user_id uuid not null references auth.users (id) on delete cascade,
	key text not null check (char_length(key) between 1 and 80),
	data jsonb,
	deleted boolean not null default false,
	updated_at timestamptz not null default now(),
	primary key (user_id, key)
);

create index if not exists sync_records_user_updated_idx
	on public.sync_records (user_id, updated_at);

alter table public.sync_records enable row level security;

-- The server decides when a record was written, so a phone with a wrong clock can't win conflicts.
create or replace function public.touch_sync_record()
returns trigger
language plpgsql
as $$
begin
	new.updated_at := now();
	return new;
end;
$$;

drop trigger if exists sync_records_touch on public.sync_records;
create trigger sync_records_touch
	before insert or update on public.sync_records
	for each row execute function public.touch_sync_record();

drop policy if exists "pro users read own records" on public.sync_records;
create policy "pro users read own records" on public.sync_records
	for select to authenticated
	using (auth.uid() = user_id and public.is_pro());

drop policy if exists "pro users insert own records" on public.sync_records;
create policy "pro users insert own records" on public.sync_records
	for insert to authenticated
	with check (auth.uid() = user_id and public.is_pro());

drop policy if exists "pro users update own records" on public.sync_records;
create policy "pro users update own records" on public.sync_records
	for update to authenticated
	using (auth.uid() = user_id and public.is_pro())
	with check (auth.uid() = user_id and public.is_pro());

drop policy if exists "pro users delete own records" on public.sync_records;
create policy "pro users delete own records" on public.sync_records
	for delete to authenticated
	using (auth.uid() = user_id and public.is_pro());
