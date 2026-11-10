-- Contact inquiries inbox: read tracking + admin-only access.
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

-- Read/unread tracking for the admin inbox.
alter table public.contact_inquiries
  add column if not exists is_read boolean not null default false;

create index if not exists contact_inquiries_created_at_idx
  on public.contact_inquiries (created_at desc);

create index if not exists contact_inquiries_is_read_idx
  on public.contact_inquiries (is_read);

alter table public.contact_inquiries enable row level security;

-- The Edge Function writes with the service-role key, which bypasses RLS.
-- Anonymous visitors get no direct table access at all.
revoke all on public.contact_inquiries from anon;
grant select, update, delete on public.contact_inquiries to authenticated;

-- Remove any pre-existing policies (including permissive ones) so only the
-- admin-only policies below remain.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_inquiries'
  loop
    execute format(
      'drop policy if exists %I on public.contact_inquiries',
      existing_policy.policyname
    );
  end loop;
end $$;

create policy "Admins can read contact inquiries"
  on public.contact_inquiries
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can update contact inquiries" on public.contact_inquiries;
create policy "Admins can update contact inquiries"
  on public.contact_inquiries
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can delete contact inquiries" on public.contact_inquiries;
create policy "Admins can delete contact inquiries"
  on public.contact_inquiries
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Live updates in the admin inbox (optional but recommended).
do $$
begin
  alter publication supabase_realtime add table public.contact_inquiries;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
